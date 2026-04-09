import asyncio
from datetime import date, datetime
import sys
import os
from dotenv import load_dotenv

# Charger les variables d'environnement avant les autres imports locaux !
load_dotenv()

# Ensure backend imports work
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.supabase_client import get_supabase
from scrapers.france_travail_scrapers import scrape_france_travail
from scrapers.hellowork_scraper import scrape_hellowork
from services.matching_runner import run_matching_for_user
from services.auto_apply_bot import apply_to_job_bot
from services.email_sender import send_single_application_alert
supabase = get_supabase()

async def execute_daily_autoapply_campaign(specific_user_id: str = None, force_immediate: bool = False):
    print("=== Démarrage de la campagne Auto-Apply (Cron) ===")
    
    # 1. Fetch tous les utilisateurs ayant activé l'Auto-Apply
    query = supabase.table("user_preferences").select("*").eq("auto_apply_enabled", True)
    if specific_user_id:
        query = query.eq("user_id", specific_user_id)
        
    pref_res = query.execute()
    users_to_process = pref_res.data
    
    today_str = str(date.today())
    current_hour_str = datetime.now().strftime("%H")

    for pref in users_to_process:
        user_id = pref["user_id"]
        
        # Check preferred apply time if not forced
        pref_time = pref.get("preferred_apply_time", "08:00:00")
        if not force_immediate and pref_time:
            # Only run if current hour matches preferred hour (e.g., "08:XX" matches "08")
            if not pref_time.startswith(f"{current_hour_str}:"):
                print(f"Skipping {user_id} - Scheduled time {pref_time} != current hour {current_hour_str}")
                continue

        user_id = pref["user_id"]
        target = pref.get("target_job_title")
        if not target:
            continue
            
        # Get user email safely (Admin role required)
        user_email = "utilisateur@seekra.com"
        try:
            user_res = supabase.auth.admin.get_user_by_id(user_id)
            if hasattr(user_res, 'user') and hasattr(user_res.user, 'email'):
                user_email = user_res.user.email
        except Exception:
            pass # Use mock email if fallback
        
        print(f"\n--- Traitement User: {user_id} | Cible: {target} ---")

        # 2. Gestion des Quotas (2 / jour en gratuit)
        apps_today = pref.get("applications_sent_today", 0)
        last_date = pref.get("last_application_date")
        
        if last_date != today_str:
            apps_today = 0
            supabase.table("user_preferences").update({
                "applications_sent_today": 0,
                "last_application_date": today_str
            }).eq("user_id", user_id).execute()

        if apps_today >= 2:
            print("Quota quotidien atteint pour cet utilisateur.")
            continue
            
        # 3. Scraping ultra-ciblé (uniquement la page 1 pour être rapide)
        try:
            print("Lancement du scraping ciblée...")
            jobs_ft = scrape_france_travail(search_keyword=target, max_pages=1)
            jobs_hw = scrape_hellowork(search_keyword=target, max_pages=1)
            jobs = jobs_ft + jobs_hw
        except Exception as e:
            print(f"Erreur de scraping pour {target}: {e}")
            continue

        if not jobs:
            print("Aucune offre trouvée.")
            continue
            
        # 4. Intelligence Artificielle (Score et Lettre)
        # Ceci insère les bons matchs (> 70%) dans la table job_matches
        print("Lancement de l'analyse Gemini...")
        run_matching_for_user(user_id, jobs)

        # 5. Extraction des meilleurs matchs en attente
        matches_res = supabase.table("job_matches").select("*").eq("user_id", user_id).eq("status", "pending_validation").order("match_score", desc=True).limit(2 - apps_today).execute()
        
        for match in matches_res.data:
            print(f"Auto-Apply Robot sur le Match ID: {match['id']}")
            
            # Postuler en simulant un navigateur via Playwright
            await apply_to_job_bot(match, user_id)
            
            # L'offre est transmise avec succès, déclenchement du mail instantané
            job_info = match.get("job_data", {})
            cv_path = pref.get("cv_storage_path", None)
            send_single_application_alert(user_email, job_info, cv_path)
            
            # Mise à jour des quotas
            apps_today += 1
            supabase.table("user_preferences").update({
                "applications_sent_today": apps_today
            }).eq("user_id", user_id).execute()

            if apps_today >= 2:
                break
            
    print("\n=== Fin de la campagne Auto-Apply ===")

if __name__ == "__main__":
    asyncio.run(execute_daily_autoapply_campaign())
