"""
Scraper Indeed via python-jobspy (pas de Selenium maison).
Variable d'environnement USE_INDEED=0 ou false pour désactiver.
"""
import os
import csv
from datetime import datetime
from typing import List, Dict

import pandas as pd

try:
    from jobspy import scrape_jobs
except ImportError:
    scrape_jobs = None


def scrape_indeed(search_keyword: str, max_pages: int = 1) -> List[Dict]:
    """
    Récupère les offres Indeed France via python-jobspy.
    Retourne une liste de dicts au format commun : id, titre, entreprise_lieu, type_contrat, description, date_publication, lien.
    """
    use_indeed = os.environ.get("USE_INDEED", "1").strip().lower()
    if use_indeed in ("0", "false", "no"):
        print("[INFO] INDEED: désactivé (USE_INDEED=0 ou false).")
        return []

    if scrape_jobs is None:
        print("[INFO] INDEED: python-jobspy non installé. Aucune offre Indeed.")
        return []

    print("=" * 60)
    print("[INFO] INDEED (JobSpy) - OFFRES D'EMPLOI France")
    print("=" * 60)
    print(f"[INFO] Recherche: {search_keyword}")
    print(f"[INFO] Nombre de pages (équivalent): {max_pages}")
    print("=" * 60)

    results_wanted = min(max(max_pages * 20, 20), 100)

    try:
        jobs_df = scrape_jobs(
            site_name=["indeed"],
            search_term=search_keyword,
            location="France",
            results_wanted=results_wanted,
            hours_old=168,
            country_indeed="France",
        )
    except Exception as e:
        print(f"[ERREUR] Indeed (JobSpy): {e}")
        return []

    if jobs_df is None or jobs_df.empty:
        print("[INFO] INDEED: 0 offres reçues.")
        return []

    if "job_url" in jobs_df.columns:
        jobs_df = jobs_df.drop_duplicates(subset=["job_url"])

    def _str(val):
        if val is None or (isinstance(val, float) and pd.isna(val)):
            return ""
        return str(val).strip()

    all_jobs: List[Dict] = []
    for idx, row in jobs_df.iterrows():
        try:
            job_id = _str(row.get("id")) or f"row-{idx}"
            title = _str(row.get("title")) or "Sans titre"
            company = _str(row.get("company")) or "Entreprise non précisée"
            location = _str(row.get("location"))
            entreprise_lieu = f"{company} - {location}" if location else company
            description = _str(row.get("description"))
            date_posted = row.get("date_posted")
            date_publication = _str(date_posted) if date_posted is not None and not (isinstance(date_posted, float) and pd.isna(date_posted)) else ""
            job_url = _str(row.get("job_url")) or _str(row.get("job_url_direct"))
            type_contrat = _str(row.get("job_type")) or _str(row.get("contract_type"))

            job_data = {
                "id": f"INDEED-{job_id}",
                "titre": title,
                "entreprise_lieu": entreprise_lieu,
                "type_contrat": type_contrat,
                "description": description,
                "date_publication": date_publication,
                "lien": job_url,
                "source": "Indeed",
            }
            all_jobs.append(job_data)
            print(f"[SUCCES] {title[:50]}...")
        except Exception as e:
            print(f"[ERREUR] Indeed ligne {idx}: {e}")

    print("\n" + "=" * 60)
    print(f"[INFO] TOTAL INDEED: {len(all_jobs)} offres")
    print("=" * 60)

    if all_jobs:
        try:
            os.makedirs("data", exist_ok=True)
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"data/indeed_{search_keyword.replace(' ', '_')}_{timestamp}.csv"
            keys = list(all_jobs[0].keys())
            with open(filename, "w", newline="", encoding="utf-8") as f:
                w = csv.DictWriter(f, fieldnames=keys)
                w.writeheader()
                w.writerows(all_jobs)
            print(f"[SUCCES] {len(all_jobs)} offres Indeed sauvegardées dans: {filename}")
        except Exception as e:
            print(f"[ERREUR] Sauvegarde CSV Indeed: {e}")

    return all_jobs
