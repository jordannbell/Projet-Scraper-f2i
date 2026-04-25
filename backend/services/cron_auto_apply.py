import asyncio
import json
from datetime import date, datetime
import sys
import os
import threading
from dotenv import load_dotenv

load_dotenv()

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.supabase_client import get_supabase
from scrapers.france_travail_scrapers import scrape_france_travail
from scrapers.hellowork_scraper import scrape_hellowork
from services.matching_runner import run_matching_for_user
from services.apply_queue import enqueue_apply_job
from services.apply_processor import run_process_apply_queue_sync

try:
    supabase = get_supabase(require_service_role=True)
except Exception:
    supabase = get_supabase()

_ACTIVE_CAMPAIGN_USERS: set[str] = set()
_CAMPAIGN_LOCK = threading.Lock()


def _log_event(event: str, **kwargs) -> None:
    payload = {"ts": datetime.utcnow().isoformat() + "Z", "event": event, **kwargs}
    print(json.dumps(payload, ensure_ascii=False, default=str))


def _acquire_user_campaign_lock(user_id: str) -> bool:
    with _CAMPAIGN_LOCK:
        if user_id in _ACTIVE_CAMPAIGN_USERS:
            return False
        _ACTIVE_CAMPAIGN_USERS.add(user_id)
        return True


def _release_user_campaign_lock(user_id: str) -> None:
    with _CAMPAIGN_LOCK:
        _ACTIVE_CAMPAIGN_USERS.discard(user_id)


def is_user_campaign_running(user_id: str) -> bool:
    with _CAMPAIGN_LOCK:
        if user_id in _ACTIVE_CAMPAIGN_USERS:
            return True
    # Garde DB minimale: si une queue active existe, considérer qu'un traitement est en cours.
    try:
        res = (
            supabase.table("apply_queue")
            .select("id")
            .eq("user_id", user_id)
            .in_("status", ["pending", "processing"])
            .limit(1)
            .execute()
        )
        return bool(res.data)
    except Exception:
        # En cas d'erreur DB, on n'empêche pas le lancement.
        return False


def _mark_match_queued_if_pending(match_id: str) -> bool:
    res = (
        supabase.table("job_matches")
        .update({"status": "queued"})
        .eq("id", match_id)
        .eq("status", "pending_validation")
        .select("id")
        .execute()
    )
    return bool(res.data)


async def execute_daily_autoapply_campaign(specific_user_id: str = None, force_immediate: bool = False):
    print("=== Démarrage de la campagne Auto-Apply (Cron) ===")

    query = supabase.table("user_preferences").select("*").eq("auto_apply_enabled", True)
    if specific_user_id:
        query = query.eq("user_id", specific_user_id)

    pref_res = query.execute()
    users_to_process = pref_res.data

    today_str = str(date.today())
    current_hour_str = datetime.now().strftime("%H")

    for pref in users_to_process:
        user_id = pref["user_id"]
        if not _acquire_user_campaign_lock(user_id):
            _log_event("campaign_lock_skipped", user_id=user_id, reason="in_memory_lock")
            continue
        _log_event("campaign_lock_acquired", user_id=user_id)
        try:

            pref_time = pref.get("preferred_apply_time", "08:00:00")
            if not force_immediate and pref_time:
                if not pref_time.startswith(f"{current_hour_str}:"):
                    print(f"Skipping {user_id} - Scheduled time {pref_time} != current hour {current_hour_str}")
                    continue

            target = pref.get("target_job_title")
            if not target:
                continue

            if not pref.get("auto_apply_consent_at"):
                print(f"Skipping {user_id} - auto-apply consent not recorded")
                continue
            if not (pref.get("applicant_first_name") or "").strip() or not (
                pref.get("applicant_last_name") or ""
            ).strip():
                print(f"Skipping {user_id} - applicant profile incomplete")
                continue

            print(f"\n--- Traitement User: {user_id} | Cible: {target} ---")

            apps_today = pref.get("applications_sent_today", 0)
            last_date = pref.get("last_application_date")

            if last_date != today_str:
                apps_today = 0
                supabase.table("user_preferences").update(
                    {
                        "applications_sent_today": 0,
                        "last_application_date": today_str,
                    }
                ).eq("user_id", user_id).execute()

            if apps_today >= 2:
                print("Quota quotidien atteint pour cet utilisateur.")
                continue

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

            print("Lancement de l'analyse LLM (matching)...")
            run_matching_for_user(user_id, jobs)

            slots = max(0, 2 - int(apps_today or 0))
            if slots == 0:
                continue
            matches_res = (
                supabase.table("job_matches")
                .select("*")
                .eq("user_id", user_id)
                .eq("status", "pending_validation")
                .order("match_score", desc=True)
                .limit(slots)
                .execute()
            )

            for match in matches_res.data:
                mid = str(match["id"])
                print(f"Auto-Apply file d'attente Match ID: {mid}")
                if not _mark_match_queued_if_pending(mid):
                    _log_event("queue_skip_status_transition", match_id=mid, user_id=user_id)
                    continue
                try:
                    qid = enqueue_apply_job(mid, user_id)
                    if qid:
                        # Playwright nécessite Proactor sous Windows ; la boucle Uvicorn est souvent
                        # incompatible avec subprocess. run_process_apply_queue_sync → asyncio.run
                        # dans un thread dédié (voir asyncio_runner).
                        await asyncio.to_thread(run_process_apply_queue_sync, qid)
                except Exception as exc:
                    print(f"Erreur enqueue/traitement match {mid}: {exc}")
                    supabase.table("job_matches").update({"status": "pending_validation"}).eq(
                        "id", mid
                    ).eq("status", "queued").execute()

                pref_refresh = (
                    supabase.table("user_preferences")
                    .select("applications_sent_today, last_application_date")
                    .eq("user_id", user_id)
                    .execute()
                )
                if pref_refresh.data:
                    p2 = pref_refresh.data[0]
                    ld = p2.get("last_application_date")
                    at = int(p2.get("applications_sent_today") or 0)
                    apps_today = 0 if ld != today_str else at
                if apps_today >= 2:
                    break
        finally:
            _release_user_campaign_lock(user_id)
            _log_event("campaign_lock_released", user_id=user_id)

    print("\n=== Fin de la campagne Auto-Apply ===")


if __name__ == "__main__":
    from services.asyncio_runner import run_async

    run_async(execute_daily_autoapply_campaign())
