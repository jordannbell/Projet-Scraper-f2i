"""
Client Gemini partagé : retries, modèles de secours, classification d’erreurs.
Utilisé par profile (upload CV) et llm_text (matching / lettres).
"""

from __future__ import annotations

import os
import random
import time

from google import genai


def response_text(response) -> str:
    """Extrait le texte de la réponse google-genai (API parfois différente selon versions)."""
    if response is None:
        return ""
    t = getattr(response, "text", None)
    if t:
        return t
    try:
        cands = getattr(response, "candidates", None) or []
        if cands:
            parts = getattr(cands[0].content, "parts", None) or []
            return "".join(getattr(p, "text", "") or "" for p in parts)
    except Exception:
        pass
    return ""


def is_transient_gemini_error(exc: BaseException) -> bool:
    s = str(exc).lower()
    return any(
        x in s
        for x in (
            "503",
            "429",
            "unavailable",
            "overloaded",
            "high demand",
            "resource exhausted",
            "resource_exhausted",
            "try again",
            "deadline",
            "timeout",
            "rate limit",
            "too many requests",
            "busy",
            "temporarily",
        )
    )


def is_quota_billing_or_auth_error(exc: BaseException) -> bool:
    s = str(exc).lower()
    if any(
        x in s
        for x in (
            "billing",
            "payment required",
            "billing must be enabled",
            "api key not valid",
            "invalid api key",
            "api_key_invalid",
            "consumer_suspended",
            "has not been used in project",
            "api not enabled",
        )
    ):
        return True
    if "quota" in s and any(
        x in s for x in ("exceed", "exhaust", "limit", "per day", "per_day", "generate_requests")
    ):
        return True
    if ("resource_exhausted" in s or "resource has been exhausted" in s) and any(
        x in s for x in ("quota", "generatecontent", "perday", "per_day", "limit")
    ):
        return True
    return False


def is_wrong_or_unknown_model_error(exc: BaseException) -> bool:
    s = str(exc).lower()
    return any(
        x in s
        for x in (
            "404",
            "not_found",
            "not found",
            "is not found for api version",
            "not supported for generatecontent",
            "unknown model",
        )
    )


def gemini_generate_text(client: genai.Client, prompt: str) -> str:
    """
    Appelle Gemini avec retry + modèles de secours.
    Env :
      - GEMINI_MODEL : liste séparée par virgules (sinon liste par défaut)
      - GEMINI_RETRY_PER_MODEL : tentatives par modèle (défaut 5)
      - GEMINI_RETRY_BASE_DELAY_SEC : délai de base backoff (défaut 1.0)
      - GEMINI_FULL_ROUNDS : repasse toute la liste de modèles N fois (défaut 2)
    """
    default_models = [
        "gemini-2.0-flash",
        "gemini-2.5-flash",
        "gemini-2.5-flash-lite",
        "gemini-1.5-flash-8b",
    ]
    raw = (os.environ.get("GEMINI_MODEL") or "").strip()
    models = [m.strip() for m in raw.split(",") if m.strip()] if raw else default_models

    max_attempts = max(1, int(os.environ.get("GEMINI_RETRY_PER_MODEL", "5") or "5"))
    base_delay = float(os.environ.get("GEMINI_RETRY_BASE_DELAY_SEC", "1.0") or "1.0")
    full_rounds = max(1, int(os.environ.get("GEMINI_FULL_ROUNDS", "2") or "2"))

    last_exc: BaseException | None = None

    for round_idx in range(full_rounds):
        for model in models:
            for attempt in range(max_attempts):
                try:
                    response = client.models.generate_content(model=model, contents=prompt)
                    text = response_text(response).strip()
                    if text:
                        return text
                    last_exc = RuntimeError("Réponse Gemini vide")
                    time.sleep(min(base_delay * (2**attempt), 15.0) + random.random() * 0.25)
                except Exception as e:
                    last_exc = e
                    if is_quota_billing_or_auth_error(e):
                        raise
                    if is_wrong_or_unknown_model_error(e):
                        break
                    if is_transient_gemini_error(e):
                        delay = min(base_delay * (2**attempt) + random.random() * 0.5, 30.0)
                        time.sleep(delay)
                        continue
                    raise

        if round_idx < full_rounds - 1:
            time.sleep(min(3.0 * (round_idx + 1), 20.0))

    if last_exc is not None:
        raise last_exc
    raise RuntimeError("empty response from Gemini")


def resolve_gemini_api_key() -> str | None:
    for name in ("GEMINI_API_KEY", "GOOGLE_API_KEY"):
        v = (os.environ.get(name) or "").strip()
        if v:
            return v
    return None
