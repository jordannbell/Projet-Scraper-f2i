"""
Client Adzuna : récupère les offres via l'API gratuite Adzuna (pas de scraping).
Inscription gratuite : https://developer.adzuna.com/signup
Variables d'environnement : ADZUNA_APP_ID, ADZUNA_APP_KEY
"""
import os
import time
from typing import List, Dict

import requests


def scrape_adzuna(search_keyword: str, max_pages: int = 1) -> List[Dict]:
    """
    Récupère les offres d'emploi en France via l'API Adzuna.

    Nécessite ADZUNA_APP_ID et ADZUNA_APP_KEY (sinon retourne une liste vide).
    """
    print("=" * 60)
    print("[INFO] ADZUNA API - OFFRES D'EMPLOI (France)")
    print("=" * 60)
    print(f"[INFO] Recherche: {search_keyword}")
    print(f"[INFO] Nombre de pages: {max_pages}")
    print("=" * 60)

    app_id = os.environ.get("ADZUNA_APP_ID")
    app_key = os.environ.get("ADZUNA_APP_KEY")

    if not app_id or not app_key:
        print("[INFO] ADZUNA: clés API absentes (ADZUNA_APP_ID, ADZUNA_APP_KEY). Aucune offre Adzuna.")
        return []

    all_jobs: List[Dict] = []
    results_per_page = 20

    for page in range(1, max_pages + 1):
        print(f"\n[INFO] Page {page}/{max_pages}")
        # Pagination Adzuna : numéro de page dans le path (ex. /search/1, /search/2)
        url = f"https://api.adzuna.com/v1/api/jobs/fr/search/{page}"

        params = {
            "app_id": app_id,
            "app_key": app_key,
            "what": search_keyword,
            "results_per_page": results_per_page,
        }

        try:
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()

            results = data.get("results") or []
            print(f"[INFO] {len(results)} offres reçues (Adzuna)")

            for r in results:
                job_id = str(r.get("id", ""))
                title = r.get("title") or "Sans titre"
                company = (r.get("company") or {}).get("display_name") or "Entreprise non précisée"
                location = (r.get("location") or {}).get("display_name") or ""
                entreprise_lieu = f"{company} - {location}" if location else company
                contract_type = r.get("contract_type") or ""
                contract_time = r.get("contract_time") or ""
                type_contrat = " ".join(filter(None, [contract_type, contract_time])).strip()
                description = r.get("description") or ""
                created = r.get("created") or ""
                redirect_url = r.get("redirect_url") or ""

                job_data = {
                    "id": f"ADZUNA-{job_id}",
                    "titre": title,
                    "entreprise_lieu": entreprise_lieu,
                    "type_contrat": type_contrat,
                    "description": description,
                    "date_publication": created,
                    "lien": redirect_url,
                    "source": "Adzuna",
                }
                all_jobs.append(job_data)
                print(f"[SUCCES] {title[:50]}...")

            if page < max_pages:
                time.sleep(1)

        except Exception as e:
            print(f"[ERREUR] Adzuna page {page}: {e}")
            break

    print("\n" + "=" * 60)
    print(f"[INFO] TOTAL ADZUNA: {len(all_jobs)} offres")
    print("=" * 60)
    return all_jobs


if __name__ == "__main__":
    jobs = scrape_adzuna("developpeur", max_pages=1)
    if jobs:
        print("\nPremier job:", jobs[0])
    else:
        print("Aucun job (vérifier ADZUNA_APP_ID et ADZUNA_APP_KEY)")
