from config.database import SupabaseManager
from analysis.nlp_engine import NLPEngine
import json

class RecommendationSystem:
    def __init__(self):
        self.db = SupabaseManager()
        self.nlp = NLPEngine()

    def run_analysis_pipeline(self):
        """
        Récupère les offres sans analyse, extrait les compétences et met à jour la base.
        """
        print("\n[INFO] Démarrage du pipeline d'analyse sémantique...")
        
        if not self.db.client:
            print("[ERREUR] Pas de connexion base de données.")
            return

        # 1. Récupérer les offres (Idéalement celles qui n'ont pas encore été analysées)
        # Pour l'instant on récupère tout pour la démo
        response = self.db.client.table("job_offers").select("*").execute()
        jobs = response.data
        
        if not jobs:
            print("[INFO] Aucune offre à analyser en base.")
            return

        print(f"[INFO] Analyse de {len(jobs)} offres en cours...")
        
        updates_count = 0
        for job in jobs:
            # Combiner titre et description pour l'analyse
            full_text = f"{job.get('title', '')} {job.get('description', '')}"
            
            # Extraction des compétences
            skills_dict = self.nlp.extract_skills(full_text)
            
            # Aplatir la liste pour le stockage simple
            all_skills_list = []
            for cat_skills in skills_dict.values():
                all_skills_list.extend(cat_skills)
            
            # Mise à jour dans Supabase (On suppose qu'on a ajouté une colonne 'skills' ou on stocke dans une table à part)
            # Pour cet exercice, on va juste afficher le résultat car on n'a pas modifié la structure de la table
            # Si vous voulez sauvegarder, il faudrait ajouter une colonne 'detected_skills' JSONB dans Supabase
            
            if all_skills_list:
                # print(f"   > Offre {job.get('external_id')}: {len(all_skills_list)} compétences trouvées")
                updates_count += 1
                
        print(f"[SUCCES] Analyse terminée. {updates_count} offres qualifiées.")

    def get_recommendations(self, user_profile_skills: list, top_n: int = 5, jobs_data: list = None):
        """
        Retourne les meilleures offres pour un profil donné.
        Si jobs_data est fourni (ex: depuis CSV), utilise ces données au lieu de la BDD.
        """
        print(f"\n[INFO] Recherche de recommandations pour le profil : {user_profile_skills}")
        
        jobs = []
        if jobs_data:
            print("[INFO] Utilisation des données locales (CSV/Mémoire) pour la recommandation.")
            jobs = jobs_data
        elif self.db.client:
            print("[INFO] Utilisation de la base de données Supabase.")
            response = self.db.client.table("job_offers").select("*").execute()
            jobs = response.data
        else:
            print("[ERREUR] Aucune source de données disponible (ni DB, ni CSV).")
            return []
        
        scored_jobs = []
        
        for job in jobs:
            # Adaptation selon la source (CSV a des clés différentes parfois ?)
            # CSV : 'titre', 'description', 'entreprise_lieu'
            # DB : 'title', 'description', 'company_location'
            
            title = job.get('title') or job.get('titre') or ''
            desc = job.get('description') or ''
            company = job.get('company_location') or job.get('entreprise_lieu') or ''
            url = job.get('url') or job.get('lien') or ''
            
            full_text = f"{title} {desc}"
            
            # Extraction (en temps réel pour l'instant, idéalement pré-calculé)
            job_skills_dict = self.nlp.extract_skills(full_text)
            job_skills_list = []
            for cat_skills in job_skills_dict.values():
                job_skills_list.extend(cat_skills)
            
            # Calcul du score
            score = self.nlp.calculate_match_score(job_skills_list, user_profile_skills)
            
            if score > 0:
                scored_jobs.append({
                    "titre": job.get('title'),
                    "entreprise": job.get('company_location'),
                    "score": score,
                    "skills_found": job_skills_list,
                    "url": job.get('url')
                })
        
        # Trier par score décroissant
        scored_jobs.sort(key=lambda x: x['score'], reverse=True)
        
        return scored_jobs[:top_n]
