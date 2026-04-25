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
from routers import profile, matches, auto_apply, legal

app = FastAPI(title="Seekra API", description="API for Job Search & Recommendation")

# Enable CORS for Next.js frontend
_default_cors = "http://localhost:3000,http://127.0.0.1:3000"
_cors_origins = [
    origin.strip()
    for origin in os.environ.get("CORS_ORIGINS", _default_cors).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(profile.router, prefix="/api/profile", tags=["Profile"])
app.include_router(matches.router, prefix="/api/matches", tags=["Matches"])
app.include_router(auto_apply.router, prefix="/api/auto-apply", tags=["AutoApply"])
app.include_router(legal.router, prefix="/api/legal", tags=["Legal"])

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
    import unicodedata

    def _norm(v: str) -> str:
        return (
            unicodedata.normalize("NFKD", v)
            .encode("ascii", "ignore")
            .decode("ascii")
            .lower()
            .replace("-", " ")
            .replace("_", " ")
            .strip()
        )

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
            tc = _norm(j.get("type_contrat") or "")
            # Si type_contrat est vide, on garde l'offre (on ne peut pas exclure sans info)
            if tc and not any(_norm(ct) in tc for ct in contract_types):
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

@app.post("/api/jobs/search")
def search_jobs(request: JobSearchRequest):
    print(f"Searching for {request.keyword} ({request.max_pages} pages)")
    try:
        # Scrape France Travail
        jobs_ft = scrape_france_travail(search_keyword=request.keyword, max_pages=request.max_pages)

        # Scrape HelloWork
        jobs_hw = scrape_hellowork(search_keyword=request.keyword, max_pages=request.max_pages)

        # Adzuna (désactivé par défaut ; mettre USE_ADZUNA=1 pour activer, clés : ADZUNA_APP_ID, ADZUNA_APP_KEY)
        jobs_adzuna = scrape_adzuna(search_keyword=request.keyword, max_pages=request.max_pages) if os.environ.get("USE_ADZUNA", "0").strip().lower() in ("1", "true", "yes") else []

        # Indeed (python-jobspy ; USE_INDEED=0 pour désactiver)
        jobs_indeed = scrape_indeed(search_keyword=request.keyword, max_pages=request.max_pages)

        # Combine results
        jobs = jobs_ft + jobs_hw + jobs_adzuna + jobs_indeed

        return {"count": len(jobs), "jobs": jobs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/recommend")
def recommend_jobs(request: RecommendationRequest):
    print(f"Recommending for skills: {request.skills}")
    try:
        jobs_data = [job.dict() for job in request.jobs]
        jobs_data = _filter_jobs(jobs_data, request.contract_types, request.date_posted)
        rec_sys = RecommendationSystem()
        recommendations = rec_sys.get_recommendations(request.skills, top_n=100, jobs_data=jobs_data)
        return recommendations
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
