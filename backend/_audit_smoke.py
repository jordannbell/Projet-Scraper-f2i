"""Smoke audit — lancer depuis backend/: python _audit_smoke.py"""
import json
import os
import sys
import traceback

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.chdir(os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv

load_dotenv(".env")

results = {"ok": [], "fail": [], "warn": []}


def ok(name, detail=""):
    results["ok"].append({"name": name, "detail": detail})


def fail(name, err):
    results["fail"].append({"name": name, "error": str(err)[:500]})


def warn(name, msg):
    results["warn"].append({"name": name, "msg": msg})


# --- Imports app ---
try:
    from main import app
    from fastapi.testclient import TestClient

    client = TestClient(app)
    r = client.get("/")
    assert r.status_code == 200
    ok("FastAPI app import + GET /")
except Exception as e:
    fail("FastAPI app", e)
    print(json.dumps(results, indent=2, ensure_ascii=False))
    sys.exit(1)

# --- Scrapers individuels (1 page, mot-clé court) ---
KW = "developpeur"
MP = 1

for mod_name, fn_name in [
    ("scrapers.france_travail_scrapers", "scrape_france_travail"),
    ("scrapers.hellowork_scraper", "scrape_hellowork"),
    ("scrapers.indeed_scraper", "scrape_indeed"),
]:
    label = mod_name.split(".")[-1]
    try:
        mod = __import__(mod_name, fromlist=[fn_name])
        fn = getattr(mod, fn_name)
        jobs = fn(KW, MP)
        n = len(jobs) if jobs else 0
        if n == 0:
            warn(f"scraper {label}", f"0 offre (bloqué, sélecteur, ou aucun résultat)")
        else:
            sample = jobs[0]
            keys = set(sample.keys()) if isinstance(sample, dict) else []
            ok(f"scraper {label}", f"{n} jobs, clés: {sorted(keys)[:12]}...")
    except Exception as e:
        fail(f"scraper {label}", e)

# Adzuna seulement si activé
if os.environ.get("USE_ADZUNA", "0").strip().lower() in ("1", "true", "yes"):
    try:
        from scrapers.adzuna_scraper import scrape_adzuna

        jobs = scrape_adzuna(KW, MP)
        ok("scraper adzuna", f"{len(jobs)} jobs")
    except Exception as e:
        fail("scraper adzuna", e)
else:
    results["warn"].append({"name": "scraper adzuna", "msg": "SKIP (USE_ADZUNA non activé)"})

# --- POST /api/jobs/search (tout le pipeline merge) ---
try:
    r = client.post("/api/jobs/search", json={"keyword": KW, "max_pages": 1})
    if r.status_code != 200:
        fail("POST /api/jobs/search", f"HTTP {r.status_code} {r.text[:300]}")
    else:
        data = r.json()
        ok("POST /api/jobs/search", f"count={data.get('count')}")
        jobs = data.get("jobs") or []
except Exception as e:
    fail("POST /api/jobs/search", e)

# --- POST /api/recommend ---
try:
    mock_jobs = [
        {
            "titre": "Dev Python",
            "entreprise_lieu": "Paris",
            "lien": "https://example.com/1",
            "description": "Python Django API REST",
            "type_contrat": "CDI",
            "date_publication": "Il y a 2 jours",
            "source": "Test",
        }
    ]
    r = client.post(
        "/api/recommend",
        json={"skills": ["python", "django"], "jobs": mock_jobs},
    )
    if r.status_code != 200:
        fail("POST /api/recommend", f"HTTP {r.status_code} {r.text[:300]}")
    else:
        rec = r.json()
        ok("POST /api/recommend", f"{len(rec)} reco(s), score={rec[0].get('score') if rec else '—'}")
except Exception as e:
    fail("POST /api/recommend", e)

# --- Recommander avec jobs réels si search OK ---
try:
    r = client.post("/api/jobs/search", json={"keyword": KW, "max_pages": 1})
    if r.status_code == 200:
        data = r.json()
        jobs = (data.get("jobs") or [])[:15]
        if jobs:
            r2 = client.post(
                "/api/recommend",
                json={
                    "skills": ["python"],
                    "jobs": jobs,
                    "contract_types": [],
                },
            )
            if r2.status_code == 200:
                ok("search_then_recommend", f"{len(r2.json())} recos")
            else:
                fail("search_then_recommend", f"HTTP {r2.status_code}")
except Exception as e:
    fail("search_then_recommend", e)

# --- Auth obligatoire : matches sans token ---
try:
    r = client.get("/api/matches/")
    if r.status_code == 401:
        ok("GET /api/matches/ sans token", "401 attendu")
    else:
        warn("GET /api/matches/", f"status {r.status_code} (attendu 401 sans auth)")
except Exception as e:
    fail("GET /api/matches/", e)

# --- upload-cv sans token ---
try:
    r = client.post("/api/profile/upload-cv")
    if r.status_code == 422 or r.status_code == 401:
        ok("POST /api/profile/upload-cv sans auth", f"HTTP {r.status_code}")
    else:
        warn("upload-cv sans auth", f"HTTP {r.status_code}")
except Exception as e:
    fail("POST /api/profile/upload-cv", e)

# --- run-now sans token ---
try:
    r = client.post("/api/auto-apply/run-now", json={})
    if r.status_code == 401:
        ok("POST /api/auto-apply/run-now sans token", "401")
    else:
        warn("run-now sans token", f"HTTP {r.status_code}")
except Exception as e:
    fail("POST /api/auto-apply/run-now", e)

# --- Gemini / Supabase env (sans appeler l’API) ---
if os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY"):
    ok("env GEMINI", "clé présente")
else:
    warn("env GEMINI", "GEMINI_API_KEY absente — upload CV / matching IA échoueront")

if os.environ.get("SUPABASE_URL") and (
    os.environ.get("SUPABASE_KEY")
    or os.environ.get("SUPABASE_ANON_KEY")
    or os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
):
    ok("env Supabase", "URL + clé présentes")
else:
    warn("env Supabase", "config incomplète pour DB")

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass
print(json.dumps(results, indent=2, ensure_ascii=False))
