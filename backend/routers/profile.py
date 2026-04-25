import json
import os

import fitz  # PyMuPDF
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel, Field
from typing import Optional
from google import genai

from services.auth import get_current_user, get_current_user_with_token
from services.gemini_client import (
    gemini_generate_text,
    is_quota_billing_or_auth_error,
    is_transient_gemini_error,
    is_wrong_or_unknown_model_error,
    resolve_gemini_api_key,
)
from services.supabase_client import get_supabase_for_access_token, get_supabase_admin

# Toujours charger backend/.env ici (même si main.py l’a déjà fait — utile pour tests/import isolés)
_backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
try:
    from dotenv import load_dotenv

    load_dotenv(os.path.join(_backend_dir, ".env"))
except Exception:
    pass

router = APIRouter()


def _extract_json_object(text: str) -> dict:
    """
    Best-effort extraction of a JSON object from an LLM response.
    Accepts raw JSON or JSON inside ``` blocks. Raises ValueError on failure.
    """
    if not text or not isinstance(text, str):
        raise ValueError("Empty AI response")

    s = text.strip()
    # Remove fenced code blocks if present
    if s.startswith("```"):
        lines = s.splitlines()
        # drop first fence line and last fence line if present
        if len(lines) >= 3 and lines[-1].strip().startswith("```"):
            s = "\n".join(lines[1:-1]).strip()
        else:
            s = "\n".join(lines[1:]).strip()

    # Try direct JSON parse
    try:
        parsed = json.loads(s)
        if isinstance(parsed, dict):
            return parsed
    except Exception:
        pass

    # Try to locate the first {...} object in the text
    start = s.find("{")
    end = s.rfind("}")
    if start != -1 and end != -1 and end > start:
        candidate = s[start : end + 1]
        parsed = json.loads(candidate)
        if isinstance(parsed, dict):
            return parsed

    raise ValueError("AI did not return valid JSON object")


@router.post("/upload-cv")
async def upload_cv(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user_with_token),
):
    """
    1) Receive CV PDF
    2) Extract text with PyMuPDF
    3) Ask Gemini for title/keywords/summary
    4) Upsert user_preferences for the authenticated user
    """
    user_id = current_user["id"]
    access_token = current_user.get("access_token") or ""

    if not (file.filename or "").lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    api_key = resolve_gemini_api_key()
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail=(
                "Clé API Gemini absente : ajoutez GEMINI_API_KEY (ou GOOGLE_API_KEY) "
                "dans backend/.env puis redémarrez uvicorn. "
                "Obtenir une clé : https://aistudio.google.com/apikey"
            ),
        )
    client = genai.Client(api_key=api_key)

    try:
        file_bytes = await file.read()
        max_mb = float(os.environ.get("MAX_CV_MB", "6") or "6")
        if len(file_bytes) > int(max_mb * 1024 * 1024):
            raise HTTPException(status_code=413, detail=f"File too large (max {max_mb:g}MB)")

        doc = fitz.open(stream=file_bytes, filetype="pdf")
        try:
            text = "".join(page.get_text() for page in doc)
        finally:
            doc.close()

        if not text.strip():
            raise HTTPException(status_code=400, detail="The PDF does not contain readable text")

        prompt = f"""
Voici le texte d'un CV. Identifie le metier principal recherche par ce candidat, extrait 5 a 10 mots-cles importants (competences, technos, outils), et redige un resume executif accrocheur de 3 a 4 lignes.
Reponds UNIQUEMENT au format JSON strict avec les cles "target_job_title", "target_keywords", et "cv_summary".
Ne mets pas de markdown (pas de ```json).
CV:
\"\"\"{text[:3000]}\"\"\"
"""

        try:
            raw_text = gemini_generate_text(client, prompt)
        except Exception as gem_exc:
            if is_quota_billing_or_auth_error(gem_exc):
                raise HTTPException(
                    status_code=429,
                    detail=(
                        "Quota ou facturation Gemini : limite atteinte, clé invalide, ou API non activée. "
                        "Vérifiez https://aistudio.google.com/apikey (quotas) et la facturation Google AI si besoin. "
                        "Détail technique (serveur) : voir les logs uvicorn."
                    ),
                ) from gem_exc
            if is_transient_gemini_error(gem_exc):
                raise HTTPException(
                    status_code=503,
                    detail=(
                        "L’API Gemini est temporairement saturée ou indisponible après plusieurs tentatives. "
                        "Réessayez dans quelques minutes. "
                        "Options dans backend/.env : GEMINI_MODEL=gemini-2.0-flash,gemini-2.5-flash "
                        "ou GEMINI_FULL_ROUNDS=3, GEMINI_RETRY_PER_MODEL=6."
                    ),
                ) from gem_exc
            if is_wrong_or_unknown_model_error(gem_exc):
                raise HTTPException(
                    status_code=400,
                    detail=(
                        "Modèle Gemini inconnu ou non supporté pour cette API. "
                        "Supprimez GEMINI_MODEL dans backend/.env ou utilisez par exemple : "
                        "GEMINI_MODEL=gemini-2.0-flash,gemini-2.5-flash"
                    ),
                ) from gem_exc
            raise

        data = _extract_json_object(raw_text)
        title = (data.get("target_job_title") or "").strip()
        keywords = data.get("target_keywords") or ""
        cv_summary = (data.get("cv_summary") or "").strip()

        if isinstance(keywords, list):
            keywords = ", ".join([str(k).strip() for k in keywords if str(k).strip()])
        else:
            keywords = str(keywords).strip()

        # Basic validation to avoid writing garbage to DB
        if not title and not keywords and not cv_summary:
            raise HTTPException(status_code=502, detail="AI extraction failed (empty fields)")

        # RLS : clé anon + JWT utilisateur (sinon upsert refusé sans service_role)
        supabase = get_supabase_for_access_token(access_token)
        cv_storage_path = f"{user_id}/cv.pdf"
        supabase.table("user_preferences").upsert(
            {
                "user_id": user_id,
                "target_job_title": title,
                "target_keywords": keywords,
                "cv_summary": cv_summary,
                "cv_storage_path": cv_storage_path,
            }
        ).execute()

        return {
            "status": "success",
            "extracted_title": title,
            "extracted_keywords": keywords,
            "cv_summary": cv_summary,
        }
    except HTTPException:
        raise
    except Exception as exc:
        print(f"Error processing CV for user_id={user_id}: {exc}")
        if is_transient_gemini_error(exc):
            raise HTTPException(
                status_code=503,
                detail=(
                    "L’API Gemini est temporairement indisponible. Réessayez dans quelques minutes."
                ),
            ) from exc
        raise HTTPException(status_code=500, detail="Error processing CV")


class ApplicantProfileBody(BaseModel):
    applicant_first_name: Optional[str] = None
    applicant_last_name: Optional[str] = None
    applicant_phone: Optional[str] = None
    applicant_city: Optional[str] = None
    applicant_linkedin_url: Optional[str] = None


@router.patch("/applicant")
def patch_applicant_profile(
    body: ApplicantProfileBody,
    current_user: dict = Depends(get_current_user_with_token),
):
    user_id = current_user["id"]
    access_token = current_user.get("access_token") or ""
    data = {k: v for k, v in body.model_dump().items() if v is not None}
    if not data:
        raise HTTPException(status_code=400, detail="Aucun champ à mettre à jour")
    supabase = get_supabase_for_access_token(access_token)
    ex = supabase.table("user_preferences").select("user_id").eq("user_id", user_id).execute()
    if ex.data:
        supabase.table("user_preferences").update(data).eq("user_id", user_id).execute()
    else:
        supabase.table("user_preferences").insert({**data, "user_id": user_id}).execute()
    return {"status": "success"}


class AutoApplyConsentBody(BaseModel):
    version: str = Field(..., min_length=1, max_length=64)


@router.post("/auto-apply-consent")
def record_auto_apply_consent(
    body: AutoApplyConsentBody,
    current_user: dict = Depends(get_current_user_with_token),
):
    user_id = current_user["id"]
    access_token = current_user.get("access_token") or ""
    supabase = get_supabase_for_access_token(access_token)
    payload = {
        "auto_apply_consent_at": datetime.now(timezone.utc).isoformat(),
        "auto_apply_consent_version": body.version.strip(),
    }
    ex = supabase.table("user_preferences").select("user_id").eq("user_id", user_id).execute()
    if ex.data:
        supabase.table("user_preferences").update(payload).eq("user_id", user_id).execute()
    else:
        supabase.table("user_preferences").insert({**payload, "user_id": user_id}).execute()
    return {"status": "success"}


class PlatformCredentialBody(BaseModel):
    platform: str = Field(..., min_length=2, max_length=64)
    login: str = Field(..., min_length=1, max_length=256)
    password: str = Field(..., min_length=1, max_length=512)


@router.post("/platform-credential")
def store_platform_credential(
    body: PlatformCredentialBody,
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user["id"]
    try:
        from services.credential_vault import encrypt_credentials

        enc = encrypt_credentials({"login": body.login.strip(), "password": body.password})
    except RuntimeError as exc:
        raise HTTPException(
            status_code=503,
            detail=str(exc),
        ) from exc
    sb = get_supabase_admin()
    sb.table("user_platform_credentials").upsert(
        {
            "user_id": user_id,
            "platform": body.platform.strip().lower(),
            "credential_encrypted": enc,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
    ).execute()
    return {"status": "success", "platform": body.platform.strip().lower()}
