import json
import os
import tempfile
from datetime import datetime, timezone
from typing import Any, Optional

from playwright.async_api import async_playwright

from services.apply_types import ApplyBotResult
from services.handlers.base import ApplyContext
from services.handlers.router import dispatch_apply_handler
from services.supabase_client import get_supabase_admin


def _log(event: str, **kwargs: Any) -> None:
    print(
        json.dumps(
            {"ts": datetime.now(timezone.utc).isoformat(), "event": event, **kwargs},
            ensure_ascii=False,
            default=str,
        )
    )


def _utc_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


async def _upload_screenshot(sb, user_id: str, match_id: str, png_bytes: bytes) -> Optional[str]:
    path = f"{user_id}/{match_id}.png"
    try:
        sb.storage.from_("apply_screenshots").upload(
            path,
            png_bytes,
            file_options={"content-type": "image/png", "upsert": "true"},
        )  # storage3 : upsert via header x-upsert
        return path
    except Exception as exc:
        _log("screenshot_upload_failed", error=str(exc)[:300])
        return None


def _download_cv_to_temp(sb, storage_path: str) -> Optional[str]:
    try:
        raw = sb.storage.from_("resumes").download(storage_path)
        if not raw:
            return None
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
        data = raw if isinstance(raw, (bytes, bytearray)) else bytes(raw)
        tmp.write(data)
        tmp.close()
        return tmp.name
    except Exception as exc:
        _log("cv_download_failed", path=storage_path, error=str(exc)[:300])
        return None


def _load_platform_login(sb, user_id: str, platform: str) -> Optional[dict[str, Any]]:
    try:
        from services.credential_vault import try_decrypt_credentials

        res = (
            sb.table("user_platform_credentials")
            .select("credential_encrypted")
            .eq("user_id", user_id)
            .eq("platform", platform)
            .limit(1)
            .execute()
        )
        rows = res.data or []
        if not rows:
            return None
        return try_decrypt_credentials(rows[0].get("credential_encrypted"))
    except Exception:
        return None


async def apply_to_job_bot(match_data: dict, user_id: str) -> None:
    """
    Exécute le handler Playwright adapté à l'URL, met à jour job_matches (status + métadonnées).
    """
    sb = get_supabase_admin()
    match_id = str(match_data["id"])
    job = match_data.get("job_data") or {}
    job_url = (job.get("lien") or job.get("url") or "").strip()
    cover_letter = match_data.get("generated_cover_letter") or ""

    if not job_url:
        sb.table("job_matches").update(
            {
                "status": "failed",
                "apply_error": "URL d'offre manquante",
                "apply_handler_used": "none",
                "apply_finished_at": _utc_iso(),
            }
        ).eq("id", match_id).execute()
        return

    pref_res = sb.table("user_preferences").select("*").eq("user_id", user_id).execute()
    prefs = pref_res.data or []
    pref = prefs[0] if prefs else {}

    user_email = ""
    try:
        ures = sb.auth.admin.get_user_by_id(user_id)
        if hasattr(ures, "user") and ures.user and getattr(ures.user, "email", None):
            user_email = (ures.user.email or "").strip()
    except Exception:
        pass

    applicant = {
        "email": user_email,
        "first_name": (pref.get("applicant_first_name") or "").strip(),
        "last_name": (pref.get("applicant_last_name") or "").strip(),
        "phone": (pref.get("applicant_phone") or "").strip(),
        "city": (pref.get("applicant_city") or "").strip(),
        "linkedin_url": (pref.get("applicant_linkedin_url") or "").strip(),
    }

    cv_key = (pref.get("cv_storage_path") or "").strip() or f"{user_id}/cv.pdf"
    cv_temp_path = _download_cv_to_temp(sb, cv_key)

    platform = "hellowork" if "hellowork.com" in job_url.lower() else None
    platform_login = _load_platform_login(sb, user_id, platform) if platform else None

    result: Optional[ApplyBotResult] = None
    headless = os.environ.get("PLAYWRIGHT_HEADED", "").lower() not in ("1", "true", "yes")

    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=headless)
            try:
                context = await browser.new_context(
                    user_agent=(
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                        "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                    ),
                    locale="fr-FR",
                )
                page = await context.new_page()
                _log("apply_goto", match_id=match_id, url=job_url[:200])
                await page.goto(
                    job_url,
                    timeout=int(os.environ.get("APPLY_GOTO_TIMEOUT_MS", "60000")),
                    wait_until="domcontentloaded",
                )

                ctx = ApplyContext(
                    page=page,
                    job_url=job_url,
                    cover_letter=cover_letter,
                    cv_path=cv_temp_path,
                    applicant=applicant,
                    platform_login=platform_login,
                )
                result = await dispatch_apply_handler(ctx)

                shot_path: Optional[str] = None
                if result.outcome != "applied":
                    try:
                        png = await page.screenshot(full_page=True)
                        shot_path = await _upload_screenshot(sb, user_id, match_id, png)
                    except Exception as shot_exc:
                        _log("screenshot_page_failed", error=str(shot_exc)[:200])
                    result.screenshot_path = shot_path or result.screenshot_path

                patch = {
                    "status": result.outcome,
                    "apply_handler_used": result.handler,
                    "apply_error": None
                    if result.outcome == "applied"
                    else ((result.message or "")[:2000] if result.message else None),
                    "apply_screenshot_path": result.screenshot_path,
                    "apply_finished_at": _utc_iso(),
                }
                sb.table("job_matches").update(patch).eq("id", match_id).execute()
                _log(
                    "apply_finished",
                    match_id=match_id,
                    outcome=result.outcome,
                    handler=result.handler,
                    log=result.structured_log,
                )
            finally:
                await browser.close()
    except Exception as exc:
        _log("apply_playwright_exception", match_id=match_id, error=str(exc)[:500])
        sb.table("job_matches").update(
            {
                "status": "failed",
                "apply_error": str(exc)[:2000],
                "apply_handler_used": "exception",
                "apply_finished_at": _utc_iso(),
            }
        ).eq("id", match_id).execute()
        result = None
    finally:
        if cv_temp_path:
            try:
                os.unlink(cv_temp_path)
            except OSError:
                pass


def run_apply_bot_sync(match_data: dict, user_id: str) -> None:
    from services.asyncio_runner import run_async

    run_async(apply_to_job_bot(match_data, user_id))
