import json
from datetime import datetime, timezone
from typing import Any, Optional

from services.supabase_client import get_supabase_admin


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _log_event(event: str, **kwargs: Any) -> None:
    payload = {"ts": _utc_now_iso(), "event": event, **kwargs}
    print(json.dumps(payload, ensure_ascii=False, default=str))


def _find_active_queue_id(sb, match_id: str, user_id: str) -> Optional[str]:
    res = (
        sb.table("apply_queue")
        .select("id")
        .eq("match_id", match_id)
        .eq("user_id", user_id)
        .in_("status", ["pending", "processing"])
        .order("created_at")
        .limit(1)
        .execute()
    )
    rows = res.data or []
    return str(rows[0]["id"]) if rows else None


def enqueue_apply_job(match_id: str, user_id: str) -> Optional[str]:
    sb = get_supabase_admin()
    existing_id = _find_active_queue_id(sb, match_id, user_id)
    if existing_id:
        _log_event(
            "queue_dedup_hit",
            match_id=match_id,
            user_id=user_id,
            queue_id=existing_id,
        )
        return existing_id

    payload = {
        "match_id": match_id,
        "user_id": user_id,
        "status": "pending",
        "updated_at": _utc_now_iso(),
    }
    try:
        res = sb.table("apply_queue").insert(payload).execute()
        rows = res.data or []
        qid = str(rows[0]["id"]) if rows else None
        if qid:
            _log_event("queue_enqueued", match_id=match_id, user_id=user_id, queue_id=qid)
        return qid
    except Exception:
        # Race concurrente: si l'index unique partiel rejette l'insert,
        # on retourne l'item actif existant au lieu de casser le flux.
        fallback_id = _find_active_queue_id(sb, match_id, user_id)
        if fallback_id:
            _log_event(
                "queue_dedup_conflict_recovered",
                match_id=match_id,
                user_id=user_id,
                queue_id=fallback_id,
            )
            return fallback_id
        raise


def claim_queue_item(queue_id: str, attempts: int) -> bool:
    sb = get_supabase_admin()
    res = (
        sb.table("apply_queue")
        .update({"status": "processing", "attempts": attempts, "updated_at": _utc_now_iso()})
        .eq("id", queue_id)
        .eq("status", "pending")
        .select("id")
        .execute()
    )
    rows = res.data or []
    if rows:
        return True
    _log_event("queue_claim_conflict", queue_id=queue_id, attempts=attempts)
    return False


def fetch_pending_queue_ids(limit: int = 5) -> list[str]:
    sb = get_supabase_admin()
    res = (
        sb.table("apply_queue")
        .select("id")
        .eq("status", "pending")
        .order("created_at")
        .limit(limit)
        .execute()
    )
    return [str(r["id"]) for r in (res.data or [])]


def update_queue_row(queue_id: str, fields: dict[str, Any]) -> None:
    sb = get_supabase_admin()
    payload = {**fields, "updated_at": _utc_now_iso()}
    sb.table("apply_queue").update(payload).eq("id", queue_id).execute()
