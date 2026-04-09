import asyncio
from playwright.async_api import async_playwright
from services.supabase_client import get_supabase

supabase = get_supabase()

async def apply_to_job_bot(match_data: dict, user_id: str):
    """
    Playwright bot to apply to jobs automatically.
    """
    job_url = match_data.get('job_data', {}).get('lien', '')
    cover_letter = match_data.get('generated_cover_letter', '')
    
    if not job_url:
        print("No job URL provided.")
        supabase.table("job_matches").update({"status": "failed"}).eq("id", match_data["id"]).execute()
        return

    # TODO: Télécharger le CV depuis Supabase Storage
    # Example: cv_file = supabase.storage.from_("resumes").download(f"{user_id}/cv.pdf")
    # with open("temp_cv.pdf", "wb") as f: f.write(cv_file)
    
    print(f"Starting bot for job: {job_url}")
    
    try:
        async with async_playwright() as p:
            # Lancer le navigateur
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            )
            page = await context.new_page()
            
            await page.goto(job_url, timeout=60000)
            print(f"Page loaded: {await page.title()}")
            
            # --- LOGIQUE DE REMPLISSAGE SPÉCIFIQUE À LA PLATEFORME ---
            # En production, vous devrez inspecter les sélecteurs CSS 
            # de HelloWork, WelcomeToTheJungle, LinkedIn, etc.
            
            # await page.click("button:has-text('Postuler')", timeout=5000)
            # await page.fill('input[name="firstName"]', "Prénom")
            # await page.fill('input[name="lastName"]', "Nom")
            # await page.set_input_files('input[type="file"]', 'temp_cv.pdf')
            # await page.fill('textarea', cover_letter)
            # await page.click('button[type="submit"]')
            
            print("Bot finished simulation. Real form filling logic requires platform-specific CSS selectors.")
            
            await browser.close()
            
            # Si succès :
            supabase.table("job_matches").update({"status": "applied"}).eq("id", match_data["id"]).execute()
            
    except Exception as e:
        print(f"Playwright Bot Error: {e}")
        supabase.table("job_matches").update({"status": "failed"}).eq("id", match_data["id"]).execute()

def run_apply_bot_sync(match_data: dict, user_id: str):
    """Synchronous wrapper for FastAPI BackgroundTasks"""
    asyncio.run(apply_to_job_bot(match_data, user_id))
