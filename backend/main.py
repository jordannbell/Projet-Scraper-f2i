from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import sys
import os

# Charger .env du backend en premier (pour USE_INDEED, etc.)
try:
    from dotenv import load_dotenv
    _env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
    load_dotenv(_env_path)
except Exception:
    pass

# Add current directory to path so imports work
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from scrapers.france_travail_scrapers import scrape_france_travail
from scrapers.hellowork_scraper import scrape_hellowork
from scrapers.adzuna_scraper import scrape_adzuna
from scrapers.indeed_scraper import scrape_indeed
from analysis.recommender import RecommendationSystem

app = FastAPI(title="Seekra API", description="API for Job Search & Recommendation")

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data Models
class JobSearchRequest(BaseModel):
    keyword: str
    max_pages: int = 2

class SkillProfile(BaseModel):
    skills: List[str]

class Job(BaseModel):
    id: Optional[str] = None
    titre: str
    entreprise_lieu: str
    type_contrat: Optional[str] = None
    description: Optional[str] = None
    date_publication: Optional[str] = None
    lien: str
    source: Optional[str] = None

class RecommendationRequest(BaseModel):
    skills: List[str]
    jobs: List[Job]
    contract_types: Optional[List[str]] = None
    date_posted: Optional[str] = None

# Helpers for filtering by contract and date
def _parse_days_ago(date_str: str) -> Optional[int]:
    """Parse date_publication string to approximate days ago. Returns None if unparseable."""
    if not date_str or not isinstance(date_str, str):
        return None
    import re
    s = date_str.strip().lower()
    # "Il y a X jours", "X days ago", "X day ago"
    m = re.search(r"(?:il y a\s+)?(\d+)\s*(?:day|jour)s?(?:\s*ago)?", s)
    if m and m.group(1).isdigit():
        return int(m.group(1))
    if "today" in s or "aujourd" in s:
        return 0
    if "hier" in s or "yesterday" in s:
        return 1
    # ISO date YYYY-MM-DD
    m = re.search(r"(\d{4})-(\d{2})-(\d{2})", date_str)
    if m:
        try:
            from datetime import datetime
            d = datetime(int(m.group(1)), int(m.group(2)), int(m.group(3)))
            return (datetime.now() - d).days
        except Exception:
            pass
    return None


def _filter_jobs(jobs_data: list, contract_types: Optional[List[str]], date_posted: Optional[str]) -> list:
    """Filter jobs by contract type and date posted. Keeps job if unparseable date."""
    if not contract_types and not date_posted:
        return jobs_data
    max_days = None
    if date_posted:
        low = date_posted.strip().lower()
        if "24" in low or "1 day" in low:
            max_days = 1
        elif "7" in low:
            max_days = 7
        elif "30" in low:
            max_days = 30
        if "any" in low or not max_days:
            max_days = None
    out = []
    for j in jobs_data:
        if contract_types:
            tc = (j.get("type_contrat") or "").strip().lower().replace("-", " ").replace("_", " ")
            # Si type_contrat est vide, on garde l'offre (on ne peut pas exclure sans info)
            if tc and not any(ct.lower().replace("-", " ") in tc for ct in contract_types):
                continue
        if max_days is not None:
            days = _parse_days_ago(j.get("date_publication") or "")
            if days is not None and days > max_days:
                continue
        out.append(j)
    return out


# Global state to hold jobs temporarily (in a real app, use DB)
# For this demo, we can just return the data to the frontend
    
@app.get("/")
def read_root():
    return {"message": "Seekra API is running"}

def _debug_log(data: dict):
    # #region agent log
    import json
    _root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    log_path = os.path.join(_root, ".cursor", "debug-091a4a.log")
    os.makedirs(os.path.dirname(log_path), exist_ok=True)
    with open(log_path, "a", encoding="utf-8") as f:
        f.write(json.dumps({"sessionId": "091a4a", **data, "timestamp": __import__("time").time() * 1000}) + "\n")
    # #endregion

@app.post("/api/jobs/search")
def search_jobs(request: JobSearchRequest):
    print(f"Searching for {request.keyword} ({request.max_pages} pages)")
    try:
        # Scrape France Travail
        jobs_ft = scrape_france_travail(search_keyword=request.keyword, max_pages=request.max_pages)
        _debug_log({"location": "main.py:search_jobs:after_ft", "message": "jobs_ft count", "data": {"count": len(jobs_ft)}, "hypothesisId": "H1"})

        # Scrape HelloWork
        jobs_hw = scrape_hellowork(search_keyword=request.keyword, max_pages=request.max_pages)
        _debug_log({"location": "main.py:search_jobs:after_hw", "message": "jobs_hw count", "data": {"count": len(jobs_hw)}, "hypothesisId": "H1"})

        # Adzuna (désactivé par défaut ; mettre USE_ADZUNA=1 pour activer, clés : ADZUNA_APP_ID, ADZUNA_APP_KEY)
        jobs_adzuna = scrape_adzuna(search_keyword=request.keyword, max_pages=request.max_pages) if os.environ.get("USE_ADZUNA", "0").strip().lower() in ("1", "true", "yes") else []

        # Indeed (python-jobspy ; USE_INDEED=0 pour désactiver)
        jobs_indeed = scrape_indeed(search_keyword=request.keyword, max_pages=request.max_pages)
        _debug_log({"location": "main.py:search_jobs:after_indeed", "message": "jobs_indeed count", "data": {"count": len(jobs_indeed), "sample_id": jobs_indeed[0].get("id") if jobs_indeed else None}, "hypothesisId": "H1"})

        # Combine results
        jobs = jobs_ft + jobs_hw + jobs_adzuna + jobs_indeed
        indeed_in_merged = sum(1 for j in jobs if (j.get("id") or "").startswith("INDEED-") or j.get("source") == "Indeed")
        _debug_log({"location": "main.py:search_jobs:merged", "message": "merged jobs", "data": {"total": len(jobs), "indeed_count": indeed_in_merged}, "hypothesisId": "H1"})

        return {"count": len(jobs), "jobs": jobs}
    except Exception as e:
        _debug_log({"location": "main.py:search_jobs:exception", "message": "search exception", "data": {"error": str(e)}, "hypothesisId": "H5"})
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/recommend")
def recommend_jobs(request: RecommendationRequest):
    print(f"Recommending for skills: {request.skills}")
    try:
        jobs_data = [job.dict() for job in request.jobs]
        jobs_data = _filter_jobs(jobs_data, request.contract_types, request.date_posted)
        indeed_in_request = sum(1 for j in jobs_data if (j.get("id") or "").startswith("INDEED-") or j.get("source") == "Indeed")
        # #region agent log
        import json
        _root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        log_path = os.path.join(_root, ".cursor", "debug-091a4a.log")
        with open(log_path, "a", encoding="utf-8") as f:
            f.write(json.dumps({"sessionId": "091a4a", "location": "main.py:recommend:input", "message": "jobs sent to recommender", "data": {"total": len(jobs_data), "indeed_count": indeed_in_request}, "hypothesisId": "H2", "timestamp": __import__("time").time() * 1000}) + "\n")
        # #endregion
        rec_sys = RecommendationSystem()
        recommendations = rec_sys.get_recommendations(request.skills, top_n=100, jobs_data=jobs_data)
        indeed_in_rec = sum(1 for r in recommendations if r.get("source") == "Indeed")
        # #region agent log
        with open(log_path, "a", encoding="utf-8") as f:
            f.write(json.dumps({"sessionId": "091a4a", "location": "main.py:recommend:output", "message": "recommendations returned", "data": {"total": len(recommendations), "indeed_count": indeed_in_rec}, "hypothesisId": "H3", "timestamp": __import__("time").time() * 1000}) + "\n")
        # #endregion
        return recommendations
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
