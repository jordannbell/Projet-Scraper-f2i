"""
Texte brut via Groq (API OpenAI-compatible) ou Gemini.
LLM_PROVIDER=auto|groq|gemini ; clés GROQ_API_KEY / GEMINI_API_KEY.
"""

from __future__ import annotations

import os
import random
import time

import requests
from google import genai

from services.gemini_client import gemini_generate_text, resolve_gemini_api_key


def _groq_api_key() -> str | None:
    k = (os.environ.get("GROQ_API_KEY") or "").strip()
    return k or None


def get_text_backend() -> str:
    """
    Retourne 'groq', 'gemini' ou 'none'.
    auto : Groq si GROQ_API_KEY, sinon Gemini si clé présente.
    """
    p = (os.environ.get("LLM_PROVIDER") or "auto").strip().lower()
    gq = _groq_api_key()
    gm = resolve_gemini_api_key()
    if p == "groq":
        return "groq" if gq else ("gemini" if gm else "none")
    if p == "gemini":
        return "gemini" if gm else ("groq" if gq else "none")
    if gq:
        return "groq"
    if gm:
        return "gemini"
    return "none"


def throttle_sleep_after_llm_call() -> None:
    """Après un appel LLM en matching : limite le débit côté Gemini (RPM free tier)."""
    if get_text_backend() != "gemini":
        return
    sec = float(os.environ.get("GEMINI_THROTTLE_AFTER_CALL_SEC", "12") or "12")
    if sec > 0:
        time.sleep(sec)


def _groq_chat(prompt: str, temperature: float, max_tokens: int) -> str:
    key = _groq_api_key()
    if not key:
        raise RuntimeError("GROQ_API_KEY manquant")
    model = (os.environ.get("GROQ_MODEL") or "llama-3.3-70b-versatile").strip()
    url = (os.environ.get("GROQ_BASE_URL") or "https://api.groq.com/openai/v1").rstrip("/")
    max_retries = max(1, int(os.environ.get("GROQ_RETRY_MAX", "4") or "4"))
    base_delay = float(os.environ.get("GROQ_RETRY_BASE_DELAY_SEC", "1.0") or "1.0")
    last_err: Exception | None = None
    for attempt in range(max_retries):
        try:
            r = requests.post(
                f"{url}/chat/completions",
                headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
                json={
                    "model": model,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                },
                timeout=120,
            )
            if r.status_code == 429:
                delay = min(base_delay * (2**attempt) + random.random() * 0.5, 60.0)
                time.sleep(delay)
                last_err = RuntimeError(f"Groq 429: {r.text[:300]}")
                continue
            r.raise_for_status()
            data = r.json()
            choices = data.get("choices") or []
            if not choices:
                raise RuntimeError("Groq: réponse sans choices")
            content = (choices[0].get("message") or {}).get("content") or ""
            return content.strip()
        except requests.RequestException as e:
            last_err = e
            if attempt < max_retries - 1:
                time.sleep(min(base_delay * (2**attempt), 30.0))
                continue
            raise
    if last_err:
        raise last_err
    raise RuntimeError("Groq: échec après retries")


def generate_plain_text(
    prompt: str,
    *,
    temperature: float = 0.3,
    max_tokens: int = 2048,
) -> str:
    backend = get_text_backend()
    if backend == "groq":
        return _groq_chat(prompt, temperature=temperature, max_tokens=max_tokens)
    if backend == "gemini":
        api_key = resolve_gemini_api_key()
        if not api_key:
            raise RuntimeError("Clé Gemini absente")
        client = genai.Client(api_key=api_key)
        return gemini_generate_text(client, prompt)
    raise RuntimeError("Aucun fournisseur LLM configuré (GROQ_API_KEY ou GEMINI_API_KEY)")
