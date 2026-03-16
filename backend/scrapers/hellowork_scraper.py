import os
import csv
import time
from datetime import datetime
import requests
from bs4 import BeautifulSoup
from typing import List, Dict

def scrape_hellowork(search_keyword: str, max_pages: int = 1) -> List[Dict]:
    """
    Scrape les offres d'emploi depuis HelloWork.
    """
    print("="*60)
    print("[INFO] SCRAPER HELLOWORK - OFFRES D'EMPLOI")
    print("="*60)
    print(f"[INFO] Recherche: {search_keyword}")
    print(f"[INFO] Nombre de pages: {max_pages}")
    print("="*60)
    
    all_jobs = []
    
    # URL Format: https://www.hellowork.com/fr-fr/emploi/recherche.html?k=Data+Analyst
    encoded_keyword = search_keyword.replace(' ', '+')
    base_url = "https://www.hellowork.com/fr-fr/emploi/recherche.html"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "fr-FR,fr;q=0.9",
        "Cache-Control": "max-age=0"
    }

    for page in range(1, max_pages + 1):
        print(f"\n[INFO] Page {page}/{max_pages}")
        
        # Parms
        params = {"k": search_keyword}
        if page > 1:
            params["p"] = page
            
        try:
            response = requests.get(base_url, params=params, headers=headers, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            print(f"[INFO] URL: {response.url}")
            
            # HelloWork lists job offers typically in li tags inside a ul
            # We look for links pointing to jobs: /fr-fr/emplois/
            offers = soup.find_all('a', href=lambda h: h and '/fr-fr/emplois/' in h)
            
            # Since an offer might have multiple links (like image, title), we use a set to avoid duplicates based on href
            seen_hrefs = set()
            unique_offers = []
            
            for offer in offers:
                href = offer.get('href')
                if href not in seen_hrefs:
                    seen_hrefs.add(href)
                    unique_offers.append(offer)
            
            print(f"[INFO] Extraction de {len(unique_offers)} offres trouvées...")
            
            page_jobs_count = 0
            for i, offer_link_tag in enumerate(unique_offers):
                try:
                    # ID
                    href = offer_link_tag['href']
                    job_id = href.split('/')[-1].replace('.html', '')
                    
                    # Le texte est souvent écrasé dans Hellowork.
                    # L'élément père (li) contient toutes les div avec la structure
                    li_parent = offer_link_tag.find_parent('li')
                    if not li_parent:
                        continue
                        
                    # Title
                    title = "Titre non trouvé"
                    title_elem = li_parent.find('a', attrs={"data-cy": "offerTitle"})
                    if title_elem and title_elem.find('p'):
                        # Le premier <p> dans l'ancre contient le titre
                        title_p = title_elem.find('p')
                        title = title_p.get_text(strip=True)
                    elif title_elem:
                        # Fallback
                        title = title_elem.get_text(strip=True)
                        
                    # Company
                    company = "Entreprise confidentielle"
                    if title_elem:
                        # Le deuxième <p> contient souvent l'entreprise
                        p_tags = title_elem.find_all('p')
                        if len(p_tags) > 1:
                            company = p_tags[1].get_text(strip=True)
                            
                    # Location
                    location = ""
                    loc_elem = li_parent.find(attrs={"data-cy": "localisationCard"})
                    if loc_elem:
                        location = loc_elem.get_text(strip=True)
                        
                    # Contract
                    contract = ""
                    contract_elem = li_parent.find(attrs={"data-cy": "contractCard"})
                    if contract_elem:
                        contract = contract_elem.get_text(strip=True)
                        
                    # Date (Souvent le dernier div texte gris)
                    date_pub = ""
                    date_divs = li_parent.find_all('div', class_=lambda c: c and 'tw-text-grey-500' in c)
                    if date_divs:
                        date_pub = date_divs[-1].get_text(strip=True)
                        
                    # Make link absolute
                    lien = f"https://www.hellowork.com{href}"
                    
                    # Description snippet
                    desc = ""
                    # Parfois Hellowork n'a pas de p directement dans la carte, ou alors caché
                    # On laisse vide si non dispo facilement
                    
                    job_data = {
                        "id": f"HW-{job_id}",
                        "titre": title,
                        "entreprise_lieu": f"{company} - {location}" if location else company,
                        "type_contrat": contract,
                        "description": desc,
                        "date_publication": date_pub,
                        "lien": lien
                    }
                    
                    all_jobs.append(job_data)
                    page_jobs_count += 1
                    
                    print(f"[SUCCES] {i+1}. {title[:40]}...")
                    
                except Exception as e:
                    print(f"[ERREUR] Impossible de parser une offre : {e}")
                    
            print(f"[SUCCES] {page_jobs_count} offres extraites de cette page")
            
            # Pause pour ne pas spammer le serveur
            time.sleep(2)
            
        except Exception as e:
            print(f"[ERREUR] Echec lors de la requête de la page {page} : {e}")
            break
            
    print("\n" + "="*60)
    print(f"[INFO] TOTAL: {len(all_jobs)} offres extraites")
    print("="*60)
    
    # Sauvegarde CSV optionnelle (comme pour France Travail)
    if all_jobs:
        try:
            # Créer le dossier data s'il n'existe pas
            os.makedirs('data', exist_ok=True)
            
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"data/hellowork_{search_keyword}_{timestamp}.csv"
            
            keys = all_jobs[0].keys()
            with open(filename, 'w', newline='', encoding='utf-8') as output_file:
                dict_writer = csv.DictWriter(output_file, fieldnames=keys)
                dict_writer.writeheader()
                dict_writer.writerows(all_jobs)
                
            print(f"\n[SUCCES] {len(all_jobs)} offres sauvegardées dans: {filename}")
        except Exception as e:
            print(f"\n[ERREUR] Sauvegarde CSV échouée: {e}")
            
    return all_jobs

if __name__ == "__main__":
    jobs = scrape_hellowork("Data Analyst", 1)
    if jobs:
        print("\nPremier job:")
        print(jobs[0])
