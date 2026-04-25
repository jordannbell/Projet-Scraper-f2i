from fastapi import APIRouter, BackgroundTasks, Body, Depends, HTTPException

from services.auth import get_current_user


def _get_execute_daily_autoapply_campaign():
    # Lazy import to avoid crashing app on missing Supabase service role key
    from services.cron_auto_apply import execute_daily_autoapply_campaign

    return execute_daily_autoapply_campaign


def _is_user_campaign_running(user_id: str) -> bool:
    from services.cron_auto_apply import is_user_campaign_running

    return is_user_campaign_running(user_id)


from services.supabase_client import get_supabase

router = APIRouter()
supabase = None


@router.post("/run-now")
async def run_auto_apply_now(
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
    payload: dict | None = Body(default=None),
):
    """
    Trigger auto-apply immediately for the authenticated user.
    """
    user_id = current_user["id"]
    # Optional sanity check: ensure Supabase env is present early (clear error)
    global supabase
    if supabase is None:
        try:
            supabase = get_supabase()
        except Exception as exc:
            raise HTTPException(status_code=500, detail=str(exc))

    # Backward compatibility: if frontend still sends user_id, enforce ownership.
    requested_user_id = (payload or {}).get("user_id")
    if requested_user_id and requested_user_id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden user_id")

    if _is_user_campaign_running(user_id):
        return {
            "status": "skipped",
            "message": "Auto-apply campaign already running for this user",
        }

    print(f"Triggering immediate auto-apply run for user_id={user_id}")
    background_tasks.add_task(
        _get_execute_daily_autoapply_campaign(),
        specific_user_id=user_id,
        force_immediate=True,
    )
    return {
        "status": "success",
        "message": "Auto-apply campaign started immediately in background",
    }
