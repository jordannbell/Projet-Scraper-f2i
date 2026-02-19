from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import sys
import os

# Add current directory to path so imports work
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from scrapers.france_travail_scrapers import scrape_france_travail
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

class RecommendationRequest(BaseModel):
    skills: List[str]
    jobs: List[Job]

# Global state to hold jobs temporarily (in a real app, use DB)
# For this demo, we can just return the data to the frontend
    
@app.get("/")
def read_root():
    return {"message": "Seekra API is running"}

@app.post("/api/jobs/search")
def search_jobs(request: JobSearchRequest):
    print(f"Searching for {request.keyword} ({request.max_pages} pages)")
    try:
        jobs = scrape_france_travail(search_keyword=request.keyword, max_pages=request.max_pages)
        return {"count": len(jobs), "jobs": jobs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/recommend")
def recommend_jobs(request: RecommendationRequest):
    print(f"Recommending for skills: {request.skills}")
    try:
        rec_sys = RecommendationSystem()
        # Convert Pydantic models to dicts for the existing logic
        jobs_data = [job.dict() for job in request.jobs]
        recommendations = rec_sys.get_recommendations(request.skills, top_n=100, jobs_data=jobs_data)
        return recommendations
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
