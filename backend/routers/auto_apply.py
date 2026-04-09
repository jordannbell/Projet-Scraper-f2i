from fastapi import APIRouter, HTTPException, BackgroundTasks, Body
from services.cron_auto_apply import execute_daily_autoapply_campaign

router = APIRouter()

@router.post("/run-now")
async def run_auto_apply_now(background_tasks: BackgroundTasks, payload: dict = Body(...)):
    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required")
        
    print(f"Triggering immediate auto-apply run for user_id={user_id}")
    
    # Run the campaign in background. 
    # force_immediate=True skips the hour restriction.
    background_tasks.add_task(execute_daily_autoapply_campaign, specific_user_id=user_id, force_immediate=True)
    
    return {"status": "success", "message": "Auto-apply campaign started immediately in background"}
