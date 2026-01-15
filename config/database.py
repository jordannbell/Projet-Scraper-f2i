import os
from supabase import create_client, Client
from dotenv import load_dotenv
import traceback

# Charger les variables d'environnement
load_dotenv()

class SupabaseManager:
    def __init__(self):
        self.url: str = os.environ.get("SUPABASE_URL")
        self.key: str = os.environ.get("SUPABASE_KEY")
        
        if not self.url or not self.key:
            print("[ATTENTION] SUPABASE_URL ou SUPABASE_KEY non trouvés dans les variables d'environnement.")
            print("   Assurez-vous d'avoir créé un fichier .env avec ces variables.")
            self.client = None
        else:

            try:
                # Correction du bug 'proxy' : on initialise sans options complexes pour l'instant
                # Si l'erreur persiste, c'est un conflit de version profond
                from supabase.client import ClientOptions
                
                self.client: Client = create_client(
                    self.url, 
                    self.key,
                    options=ClientOptions(
                        postgrest_client_timeout=10,
                        storage_client_timeout=10
                    )
                )
                print("[SUCCES] Connexion à Supabase initialisée")
            except TypeError as te:
                # Fallback si ClientOptions échoue aussi (pour les vieilles versions)
                try:
                    self.client: Client = create_client(self.url, self.key)
                    print("[SUCCES] Connexion à Supabase initialisée (Mode simple)")
                except Exception as e:
                    print(f"[ERREUR] Erreur critique Supabase: {e}")
                    traceback.print_exc()
                    self.client = None
            except Exception as e:
                print(f"[ERREUR] Erreur lors de la connexion à Supabase: {e}")
                traceback.print_exc()
                self.client = None

    def insert_jobs(self, jobs_data: list, table_name: str = "job_offers"):
        """
        Insère une liste d'offres d'emploi dans Supabase.
        Utilise 'upsert' pour éviter les doublons si une contrainte d'unicité existe (ex: sur l'URL ou l'ID externe).
        """
        if not self.client:
            print("[ERREUR] Client Supabase non initialisé. Impossible de sauvegarder.")
            return

        if not jobs_data:
            print("[INFO] Aucune donnée à insérer.")
            return

        try:
            # On prépare les données pour correspondre aux colonnes de la table
            # Assurez-vous que les clés du dictionnaire correspondent aux noms de colonnes dans Supabase
            formatted_data = []
            for job in jobs_data:
                formatted_data.append({
                    "external_id": job.get('id'),
                    "title": job.get('titre'),
                    "company_location": job.get('entreprise_lieu'),
                    "contract_type": job.get('type_contrat'),
                    "description": job.get('description'),
                    "publication_date": job.get('date_publication'),
                    "url": job.get('lien'),
                    "source": "France Travail", # Pour identifier la source
                    "scraped_at": "now()" # Laisse Supabase gérer le timestamp si configuré, sinon on peut le passer
                })

            # Upsert basique. Pour que ça marche comme un "update or insert", 
            # il faut une contrainte UNIQUE sur 'url' ou 'external_id' dans la table Supabase.
            response = self.client.table(table_name).upsert(formatted_data).execute()
            
            print(f"[SUCCES] {len(jobs_data)} offres envoyées vers Supabase (Table: {table_name})")
            return response

        except Exception as e:
            print(f"[ERREUR] Erreur lors de l'insertion dans Supabase: {e}")
            return None
