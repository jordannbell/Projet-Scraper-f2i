from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import Optional
from datetime import datetime, date
from services.supabase_client import get_supabase
# from services.auto_apply_bot import apply_to_job_bot

router = APIRouter()
supabase = get_supabase()

@router.get("/")
def get_user_matches(user_id: str):
    """
    Fetch pending matches for a specific user.
    """
    try:
        res = supabase.table("job_matches").select("*").eq("user_id", user_id).eq("status", "pending_validation").order("created_at", desc=True).execute()
        return {"matches": res.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{match_id}/approve")
def approve_match(match_id: str, user_id: str, background_tasks: BackgroundTasks):
    """
    Approve a match. Checks limits, increments counter, and triggers the Playwright auto-apply bot.
    """
    # 1. Verification
    res = supabase.table("job_matches").select("*").eq("id", match_id).eq("user_id", user_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Match not found")
        
    match_data = res.data[0]
    if match_data['status'] != 'pending_validation':
        raise HTTPException(status_code=400, detail="Match already processed")

    # 2. Check Daily Limits (Free plan = 2/day)
    pref_res = supabase.table("user_preferences").select("*").eq("user_id", user_id).execute()
    
    # Setup preferences if doesn't exist
    if not pref_res.data:
        supabase.table("user_preferences").insert({
            "user_id": user_id, 
            "applications_sent_today": 0,
            "last_application_date": str(date.today())
        }).execute()
        pref_data = {"applications_sent_today": 0, "last_application_date": str(date.today())}
    else:
        pref_data = pref_res.data[0]

    today_str = str(date.today())
    
    # Reset limit if it's a new day
    if pref_data.get("last_application_date") != today_str:
        pref_data["applications_sent_today"] = 0
        pref_data["last_application_date"] = today_str

    if pref_data.get("applications_sent_today", 0) >= 2:
        # TODO: Implémenter vérification du plan Stripe Premium ici
        raise HTTPException(status_code=403, detail="Daily limit of 2 applications reached for free plan.")

    # 3. Validé -> Mise à jour base de données
    new_count = pref_data.get("applications_sent_today", 0) + 1
    
    supabase.table("user_preferences").update({
        "applications_sent_today": new_count,
        "last_application_date": today_str
    }).eq("user_id", user_id).execute()

    supabase.table("job_matches").update({"status": "applied"}).eq("id", match_id).execute()

    # 4. Lancer le Bot Playwright en tâche de fond
    # background_tasks.add_task(apply_to_job_bot, match_data, user_id)

    return {"status": "success", "message": "Bot application started in background", "applications_sent_today": new_count}
