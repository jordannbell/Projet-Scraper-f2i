from services.supabase_client import get_supabase
from services.ai_matching import calculate_match_score
from services.ai_cover_letter import generate_cover_letter
from services.llm_text import throttle_sleep_after_llm_call

supabase = None

def run_matching_for_user(user_id: str, scraped_jobs: list):
    """
    Given a list of newly scraped jobs, evaluate them against user preferences.
    If match score >= 70, insert into job_matches.
    """
    global supabase
    if supabase is None:
        supabase = get_supabase()
    pref_res = supabase.table("user_preferences").select("*").eq("user_id", user_id).execute()
    if not pref_res.data:
        print(f"No preferences found for user {user_id}")
        return
        
    prefs = pref_res.data[0]
    target_title = prefs.get('target_job_title', '')
    target_keywords = prefs.get('target_keywords', '')
    
    if not target_title and not target_keywords:
        print(f"User {user_id} has empty target preferences.")
        return
        
    for job in scraped_jobs:
        score = calculate_match_score(job, target_title, target_keywords)
        throttle_sleep_after_llm_call()

        if score >= 70:
            print(f"Found good match ({score}%) for user {user_id}: {job.get('titre')}")
            
            # Use 'lien' to avoid duplicates
            job_link = job.get('lien', '')
            existing = supabase.table("job_matches").select("id").eq("user_id", user_id).contains("job_data", {"lien": job_link}).execute()
            if existing.data:
                print("Job already matched for this user.")
                continue

            # Generate cover letter
            cover_letter = generate_cover_letter(job, target_title, target_keywords)
            throttle_sleep_after_llm_call()

            supabase.table("job_matches").insert({
                "user_id": user_id,
                "job_data": job, 
                "match_score": score,
                "status": "pending_validation",
                "generated_cover_letter": cover_letter
            }).execute()
