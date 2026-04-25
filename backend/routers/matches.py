from datetime import date

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException

from services.apply_processor import run_process_apply_queue_sync
from services.apply_queue import enqueue_apply_job
from services.auth import get_current_user
from services.supabase_client import get_supabase

router = APIRouter()
supabase = None

FREE_DAILY_LIMIT = 2


@router.get("/")
def get_user_matches(current_user: dict = Depends(get_current_user)):
    """
    Fetch pending matches for the authenticated user.
    """
    user_id = current_user["id"]
    try:
        global supabase
        if supabase is None:
            supabase = get_supabase()
        res = (
            supabase.table("job_matches")
            .select("*")
            .eq("user_id", user_id)
            .eq("status", "pending_validation")
            .order("created_at", desc=True)
            .execute()
        )
        return {"matches": res.data}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/{match_id}/approve")
def approve_match(
    match_id: str,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
):
    """
    Valide un match, vérifie quota (candidatures réussies du jour), consentement et profil,
    passe le match en queued et enfile un traitement Playwright (succès = applied uniquement après bot).
    """
    user_id = current_user["id"]
    global supabase
    if supabase is None:
        supabase = get_supabase()

    res = (
        supabase.table("job_matches")
        .select("*")
        .eq("id", match_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Match not found")

    match_data = res.data[0]
    if match_data["status"] != "pending_validation":
        raise HTTPException(status_code=400, detail="Match already processed")

    pref_res = (
        supabase.table("user_preferences")
        .select("*")
        .eq("user_id", user_id)
        .execute()
    )
    if not pref_res.data:
        raise HTTPException(
            status_code=400,
            detail="Configurez vos préférences et votre profil candidat avant de postuler.",
        )
    pref_data = pref_res.data[0]

    if not pref_data.get("auto_apply_consent_at"):
        raise HTTPException(
            status_code=400,
            detail="Vous devez accepter les conditions d’auto-candidature dans votre profil.",
        )
    if not (pref_data.get("applicant_first_name") or "").strip() or not (
        pref_data.get("applicant_last_name") or ""
    ).strip():
        raise HTTPException(
            status_code=400,
            detail="Renseignez prénom et nom (profil candidat) avant de lancer une candidature.",
        )

    cv_path = (pref_data.get("cv_storage_path") or "").strip() or f"{user_id}/cv.pdf"
    if not cv_path:
        raise HTTPException(status_code=400, detail="CV manquant : importez un PDF.")

    today_str = str(date.today())
    applications_sent_today = pref_data.get("applications_sent_today", 0)
    last_application_date = pref_data.get("last_application_date")
    if last_application_date != today_str:
        applications_sent_today = 0

    if applications_sent_today >= FREE_DAILY_LIMIT:
        raise HTTPException(
            status_code=403,
            detail=f"Daily limit of {FREE_DAILY_LIMIT} successful applications reached for free plan",
        )

    qres = (
        supabase.table("job_matches")
        .update({"status": "queued"})
        .eq("id", match_id)
        .eq("status", "pending_validation")
        .select("id")
        .execute()
    )
    if not (qres.data or []):
        raise HTTPException(status_code=409, detail="Match status changed, retry")

    try:
        queue_id = enqueue_apply_job(match_id, user_id)
    except Exception as exc:
        supabase.table("job_matches").update({"status": "pending_validation"}).eq(
            "id", match_id
        ).eq("status", "queued").execute()
        raise HTTPException(
            status_code=500,
            detail=f"Impossible d’enfiler la candidature (SUPABASE_SERVICE_ROLE_KEY / apply_queue): {exc}",
        ) from exc

    if not queue_id:
        supabase.table("job_matches").update({"status": "pending_validation"}).eq(
            "id", match_id
        ).eq("status", "queued").execute()
        raise HTTPException(status_code=500, detail="Enqueue auto-apply failed")

    background_tasks.add_task(run_process_apply_queue_sync, queue_id)

    return {
        "status": "success",
        "message": "Application queued for background processing",
        "queue_id": queue_id,
        "applications_sent_today": applications_sent_today,
    }
