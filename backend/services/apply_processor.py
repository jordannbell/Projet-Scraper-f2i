import json
import os
import tempfile
import traceback
from datetime import date, datetime, timezone
from typing import Any, Optional

from services.apply_queue import claim_queue_item, fetch_pending_queue_ids, update_queue_row
from services.asyncio_runner import run_async
from services.auto_apply_bot import apply_to_job_bot
from services.email_sender import send_apply_outcome_email
from services.supabase_client import get_supabase_admin


def _log_event(event: str, **kwargs: Any) -> None:
    payload = {"ts": datetime.now(timezone.utc).isoformat(), "event": event, **kwargs}
    print(json.dumps(payload, ensure_ascii=False, default=str))


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


async def _run_bot_for_match(match_row: dict, user_id: str) -> None:
    await apply_to_job_bot(match_row, user_id)


def _increment_quota_on_success(sb, user_id: str) -> None:
    today_str = str(date.today())
    pref_res = sb.table("user_preferences").select("*").eq("user_id", user_id).execute()
    pref_data = (pref_res.data or [{}])[0]
    apps = int(pref_data.get("applications_sent_today") or 0)
    last = pref_data.get("last_application_date")
    if last != today_str:
        apps = 0
    apps += 1
    sb.table("user_preferences").update(
        {
            "applications_sent_today": apps,
            "last_application_date": today_str,
        }
    ).eq("user_id", user_id).execute()


async def process_apply_queue_item_by_id(queue_id: str) -> None:
    sb = get_supabase_admin()
    qres = sb.table("apply_queue").select("*").eq("id", queue_id).execute()
    qrows = qres.data or []
    if not qrows:
        _log_event("apply_queue_missing", queue_id=queue_id)
        return
    row = qrows[0]
    if row.get("status") != "pending":
        _log_event("apply_queue_skip_status", queue_id=queue_id, status=row.get("status"))
        return

    match_id = str(row["match_id"])
    user_id = str(row["user_id"])
    attempts = int(row.get("attempts") or 0) + 1

    if not claim_queue_item(queue_id, attempts):
        return

    mres = sb.table("job_matches").select("*").eq("id", match_id).execute()
    mrows = mres.data or []
    if not mrows:
        update_queue_row(
            queue_id,
            {"status": "dead", "last_error": "match introuvable"},
        )
        return

    match_row = mrows[0]
    st = match_row.get("status")
    if st not in ("queued", "applying"):
        update_queue_row(
            queue_id,
            {"status": "dead", "last_error": f"match status inattendu: {st}"},
        )
        return

    sb.table("job_matches").update(
        {"status": "applying", "apply_error": None}
    ).eq("id", match_id).execute()

    user_email = "user@example.com"
    try:
        ures = sb.auth.admin.get_user_by_id(user_id)
        if hasattr(ures, "user") and ures.user and getattr(ures.user, "email", None):
            user_email = ures.user.email
    except Exception:
        pass

    try:
        await _run_bot_for_match(match_row, user_id)
    except Exception as exc:
        tb = traceback.format_exc()[:2000]
        _log_event("apply_bot_crash", match_id=match_id, error=str(exc), traceback=tb)
        sb.table("job_matches").update(
            {
                "status": "failed",
                "apply_error": str(exc)[:2000],
                "apply_finished_at": _utc_now_iso(),
            }
        ).eq("id", match_id).execute()
        send_apply_outcome_email(
            user_email,
            match_row.get("job_data") or {},
            "failed",
            str(exc)[:500],
            None,
        )
        update_queue_row(queue_id, {"status": "done", "last_error": str(exc)[:2000]})
        return

    mres2 = sb.table("job_matches").select("*").eq("id", match_id).execute()
    final = (mres2.data or [{}])[0]
    outcome = final.get("status")
    job_info = final.get("job_data") or {}
    err = final.get("apply_error")
    shot = final.get("apply_screenshot_path")

    if outcome == "applied":
        _increment_quota_on_success(sb, user_id)
        send_apply_outcome_email(user_email, job_info, "applied", None, shot)
    elif outcome == "needs_manual":
        send_apply_outcome_email(
            user_email,
            job_info,
            "needs_manual",
            err or "Action manuelle requise sur le site de l'employeur.",
            shot,
        )
    elif outcome == "failed":
        send_apply_outcome_email(user_email, job_info, "failed", err or "Échec inconnu", shot)
    else:
        _log_event("apply_unexpected_status", match_id=match_id, outcome=outcome)
        send_apply_outcome_email(
            user_email,
            job_info,
            "failed",
            err or f"Statut inattendu après traitement: {outcome}",
            shot,
        )

    update_queue_row(queue_id, {"status": "done", "last_error": err})
    _log_event("apply_queue_done", queue_id=queue_id, match_id=match_id, outcome=outcome)


def run_process_apply_queue_sync(queue_id: str) -> None:
    run_async(process_apply_queue_item_by_id(queue_id))


def worker_poll_once(max_jobs: int = 3) -> int:
    ids = fetch_pending_queue_ids(limit=max_jobs)
    for qid in ids:
        run_async(process_apply_queue_item_by_id(qid))
    return len(ids)
