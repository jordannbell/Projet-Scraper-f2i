import requests
from bs4 import BeautifulSoup
import pandas as pd
from datetime import datetime
import time
import os
import sys

# Ajouter le dossier parent au path pour pouvoir importer config
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def get_page(url, headers):
    """
    Fait une requête HTTP et retourne le contenu HTML
    """
    try:
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code == 200:
            return response.text
        else:
            print(f"[ERREUR] Status code {response.status_code}")
            return None
    except requests.exceptions.RequestException as e:
        print(f"[ERREUR] Erreur lors de la requête: {e}")
        return None

def extract_job_data(soup):
    """
    Extrait les données des offres d'emploi
    """
    jobs = []
    
    # Trouver toutes les offres (balises <li> avec class="result")
    offres = soup.find_all('li', class_='result')
    
    print(f"\n[INFO] Extraction de {len(offres)} offres...\n")
    
    for i, offre in enumerate(offres, 1):
        try:
            # ID de l'offre
            job_id = offre.get('data-id-offre', 'N/A')
            
            # Titre du poste
            titre_elem = offre.find('span', class_='media-heading-title')
            titre = titre_elem.text.strip() if titre_elem else 'N/A'
            
            # Lien de l'offre
            lien_elem = offre.find('a', href=True)
            lien = 'https://candidat.francetravail.fr' + lien_elem['href'] if lien_elem else 'N/A'
            
            # Date de publication
            date_elem = offre.find('p', class_='date')
            date = date_elem.text.strip() if date_elem else 'N/A'
            
            # Description
            desc_elem = offre.find('p', class_='description')
            description = desc_elem.text.strip() if desc_elem else 'N/A'
            
            # Sous-texte (peut contenir entreprise et lieu)
            subtext_elem = offre.find('p', class_='subtext')
            subtext = subtext_elem.text.strip() if subtext_elem else 'N/A'
            
            # Type de contrat
            contrat_elem = offre.find('p', class_='contrat')
            contrat = contrat_elem.text.strip() if contrat_elem else 'N/A'
            
            # Créer un dictionnaire pour cette offre
            job = {
                'id': job_id,
                'titre': titre,
                'entreprise_lieu': subtext,
                'type_contrat': contrat,
                'description': description,
                'date_publication': date,
                'lien': lien
            }
            
            jobs.append(job)
            print(f"[SUCCES] {i}. {titre[:50]}...")
            
        except Exception as e:
            print(f"[ERREUR] Erreur lors de l'extraction de l'offre {i}: {e}")
            continue
    
    return jobs

def save_to_csv(jobs, filename):
    """
    Sauvegarde les offres dans un fichier CSV
    """
    if not jobs:
        print("[INFO] Aucune offre à sauvegarder")
        return
    
    # Créer le dossier data s'il n'existe pas
    os.makedirs('data', exist_ok=True)
    
    # Créer un DataFrame pandas
    df = pd.DataFrame(jobs)
    
    # Chemin complet du fichier
    filepath = os.path.join('data', filename)
    
    # Sauvegarder en CSV
    df.to_csv(filepath, index=False, encoding='utf-8-sig')
    
    print(f"\n[SUCCES] {len(jobs)} offres sauvegardées dans: {filepath}")
    print(f"[INFO] Colonnes: {', '.join(df.columns.tolist())}")

def scrape_france_travail(search_keyword="data", max_pages=1):
    """
    Fonction principale pour scraper France Travail
    
    Args:
        search_keyword: Mot-clé de recherche (ex: "data", "data analyst")
        max_pages: Nombre de pages à scraper (par défaut 1)
    """
    print("=" * 60)
    print("[INFO] SCRAPER FRANCE TRAVAIL - OFFRES D'EMPLOI")
    print("=" * 60)
    print(f"[INFO] Recherche: {search_keyword}")
    print(f"[INFO] Nombre de pages: {max_pages}")
    print("=" * 60)
    
    # Headers pour simuler un navigateur
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    
    all_jobs = []
    
    # Boucle sur les pages
    for page in range(max_pages):
        print(f"\n[INFO] Page {page + 1}/{max_pages}")
        
        # Construire l'URL (France Travail utilise un paramètre de pagination)
        # Note: Ajustez selon la structure réelle de pagination
        if page == 0:
            url = f"https://candidat.francetravail.fr/offres/recherche?motsCles={search_keyword}&typeSortie=I&tri=0"
        else:
            # La pagination peut nécessiter un paramètre différent
            url = f"https://candidat.francetravail.fr/offres/recherche?motsCles={search_keyword}&typeSortie=I&tri=0&page={page}"
        
        print(f"[INFO] URL: {url}")
        
        # Récupérer le HTML
        html = get_page(url, headers)
        
        if not html:
            print(f"[ERREUR] Impossible de récupérer la page {page + 1}")
            continue
        
        # Parser avec BeautifulSoup
        soup = BeautifulSoup(html, 'lxml')
        
        # Extraire les données
        jobs = extract_job_data(soup)
        
        if jobs:
            all_jobs.extend(jobs)
            print(f"[SUCCES] {len(jobs)} offres extraites de cette page")
        else:
            print("[INFO] Aucune offre trouvée sur cette page")
        
        # Pause entre les pages pour éviter d'être bloqué
        if page < max_pages - 1:
            print("[INFO] Pause de 2 secondes...")
            time.sleep(2)
    
    print("\n" + "=" * 60)
    print(f"[INFO] TOTAL: {len(all_jobs)} offres extraites")
    print("=" * 60)
    
    # Sauvegarder les résultats
    if all_jobs:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"france_travail_{search_keyword}_{timestamp}.csv"
        save_to_csv(all_jobs, filename)
        
        # Sauvegarder dans Supabase (Désactivé)
        # print("\n[INFO] Tentative de sauvegarde dans Supabase...")
        # db = SupabaseManager()
        # db.insert_jobs(all_jobs)
        
        # Afficher un aperçu
        print("\n[INFO] Aperçu des premières offres:")
        print("-" * 60)
        for i, job in enumerate(all_jobs[:3], 1):
            print(f"\n{i}. {job['titre']}")
            print(f"   Lieu: {job['entreprise_lieu']}")
            print(f"   Date: {job['date_publication']}")
            print(f"   Lien: {job['lien']}")
    else:
        print("\n[INFO] Aucune offre n'a été extraite")
    
    return all_jobs

if __name__ == "__main__":
    # Configuration
    SEARCH_KEYWORD = "data"  # Changez selon vos besoins
    MAX_PAGES = 30  # Nombre de pages à scraper (environ 600 offres)
    
    # Lancer le scraping
    jobs = scrape_france_travail(search_keyword=SEARCH_KEYWORD, max_pages=MAX_PAGES)
    
    print("\n[SUCCES] Scraping terminé !")
