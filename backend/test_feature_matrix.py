"""
Smoke tests orientés features critiques.
Execution locale:
  cd backend
  python test_feature_matrix.py
"""

from __future__ import annotations

import json
import os
import sys
from typing import Callable

from dotenv import load_dotenv

load_dotenv(".env")

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient  # noqa: E402
from main import app  # noqa: E402


client = TestClient(app)
RESULTS = {"ok": [], "fail": []}


def case(name: str):
    def deco(fn: Callable[[], None]):
        try:
            fn()
            RESULTS["ok"].append(name)
        except Exception as exc:
            RESULTS["fail"].append({"name": name, "error": str(exc)[:400]})
        return fn

    return deco


@case("health_root")
def _():
    r = client.get("/")
    assert r.status_code == 200


@case("jobs_search")
def _():
    r = client.post("/api/jobs/search", json={"keyword": "developpeur", "max_pages": 1})
    assert r.status_code == 200
    body = r.json()
    assert "jobs" in body and isinstance(body["jobs"], list)


@case("recommend")
def _():
    r = client.post(
        "/api/recommend",
        json={
            "skills": ["python", "fastapi"],
            "jobs": [
                {
                    "titre": "Dev Python",
                    "entreprise_lieu": "Paris",
                    "lien": "https://example.com/job1",
                    "description": "Python FastAPI APIs",
                    "type_contrat": "CDI",
                    "date_publication": "Aujourd'hui",
                    "source": "test",
                }
            ],
        },
    )
    assert r.status_code == 200
    assert isinstance(r.json(), list)


@case("auth_guard_matches")
def _():
    r = client.get("/api/matches/")
    assert r.status_code == 401


@case("auth_guard_run_now")
def _():
    r = client.post("/api/auto-apply/run-now", json={})
    assert r.status_code == 401


@case("auth_guard_profile_upload")
def _():
    r = client.post("/api/profile/upload-cv")
    assert r.status_code in (401, 422)


if __name__ == "__main__":
    print(json.dumps(RESULTS, ensure_ascii=False, indent=2))
    if RESULTS["fail"]:
        raise SystemExit(1)
