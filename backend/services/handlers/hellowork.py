import asyncio
from typing import Optional

from playwright.async_api import TimeoutError as PlaywrightTimeout

from services.apply_types import ApplyBotResult
from services.handlers.base import ApplyContext


async def _try_click_apply(page) -> bool:
    selectors = [
        "a:has-text('Postuler')",
        "button:has-text('Postuler')",
        "a:has-text('Postuler en 1 clic')",
        "button:has-text('Postuler en 1 clic')",
        "[data-testid*='apply']",
        "a[href*='candidat']",
    ]
    for sel in selectors:
        try:
            loc = page.locator(sel).first
            if await loc.count() > 0 and await loc.is_visible():
                await loc.click(timeout=8000)
                await asyncio.sleep(1.5)
                return True
        except Exception:
            continue
    return False


async def _fill_visible_inputs(page, applicant: dict, cover_letter: str) -> int:
    filled = 0
    email = (applicant.get("email") or "").strip()
    first = (applicant.get("first_name") or "").strip()
    last = (applicant.get("last_name") or "").strip()
    phone = (applicant.get("phone") or "").strip()

    pairs = [
        ('input[type="email"]', email),
        ('input[name*="email" i]', email),
        ('input[name*="mail" i]', email),
        ('input[name*="prenom" i]', first),
        ('input[name*="first" i]', first),
        ('input[name*="nom" i]', last),
        ('input[name*="last" i]', last),
        ('input[name*="phone" i]', phone),
        ('input[name*="tel" i]', phone),
        ('input[type="tel"]', phone),
    ]
    for sel, value in pairs:
        if not value:
            continue
        try:
            loc = page.locator(sel).first
            if await loc.count() > 0 and await loc.is_visible():
                await loc.fill(value, timeout=5000)
                filled += 1
        except Exception:
            continue

    for ta_sel in ("textarea", 'textarea[name*="lettre" i]', 'textarea[name*="message" i]'):
        try:
            loc = page.locator(ta_sel).first
            if await loc.count() > 0 and await loc.is_visible():
                await loc.fill(cover_letter[:8000], timeout=8000)
                filled += 1
                break
        except Exception:
            continue

    return filled


async def _attach_cv(page, cv_path: Optional[str]) -> bool:
    if not cv_path:
        return False
    try:
        inp = page.locator('input[type="file"]').first
        if await inp.count() > 0:
            await inp.set_input_files(cv_path, timeout=15000)
            return True
    except Exception:
        pass
    return False


async def _try_submit(page) -> bool:
    for sel in (
        'button[type="submit"]',
        "button:has-text('Envoyer')",
        "button:has-text('Valider')",
        "button:has-text('Soumettre')",
    ):
        try:
            loc = page.locator(sel).first
            if await loc.count() > 0 and await loc.is_visible():
                await loc.click(timeout=8000)
                await asyncio.sleep(2)
                return True
        except Exception:
            continue
    return False


async def handle_hellowork(ctx: ApplyContext) -> ApplyBotResult:
    """
    Tentative de candidature HelloWork : les parcours varient (iframe, SSO, redirection ATS).
    """
    log: dict = {"steps": []}

    try:
        clicked = await _try_click_apply(ctx.page)
        log["steps"].append({"apply_click": clicked})
        if not clicked:
            return ApplyBotResult(
                outcome="needs_manual",
                handler="hellowork",
                message="Bouton « Postuler » introuvable ou offre nécessitant une connexion / site externe.",
                structured_log=log,
            )

        await ctx.page.wait_for_timeout(1500)
        # Redirection hors HelloWork = ATS externe
        url = ctx.page.url.lower()
        if "hellowork.com" not in url:
            return ApplyBotResult(
                outcome="needs_manual",
                handler="hellowork",
                message="Redirection vers un site recruteur externe : finalisez la candidature manuellement.",
                structured_log={**log, "external_url": ctx.page.url},
            )

        filled = await _fill_visible_inputs(ctx.page, ctx.applicant, ctx.cover_letter or "")
        cv_ok = await _attach_cv(ctx.page, ctx.cv_path)
        log["steps"].append({"fields_filled": filled, "cv_attached": cv_ok})

        if filled == 0 and not cv_ok:
            return ApplyBotResult(
                outcome="needs_manual",
                handler="hellowork",
                message="Formulaire de candidature non détecté (connexion HelloWork ou parcours spécifique requis).",
                structured_log=log,
            )

        submitted = await _try_submit(ctx.page)
        log["steps"].append({"submit_clicked": submitted})

        if not submitted:
            return ApplyBotResult(
                outcome="needs_manual",
                handler="hellowork",
                message="Impossible de valider automatiquement l'envoi : vérifiez les champs obligatoires sur la page.",
                structured_log=log,
            )

        # Heuristique succès : pas d'alerte bloquante, URL ou contenu a changé
        try:
            await ctx.page.wait_for_load_state("networkidle", timeout=12000)
        except PlaywrightTimeout:
            pass

        content = ""
        try:
            content = (await ctx.page.content()).lower()
        except Exception:
            pass

        err_hints = ("erreur", "error", "obligatoire", "required", "invalid", "captcha")
        if any(h in content for h in err_hints) and "succ" not in content and "merci" not in content:
            return ApplyBotResult(
                outcome="needs_manual",
                handler="hellowork",
                message="La page signale une erreur ou des champs manquants après envoi — contrôle manuel recommandé.",
                structured_log=log,
            )

        return ApplyBotResult(
            outcome="applied",
            handler="hellowork",
            message="Formulaire soumis (succès probable — vérifiez sur le site si besoin).",
            structured_log=log,
        )
    except Exception as exc:
        return ApplyBotResult(
            outcome="failed",
            handler="hellowork",
            message=str(exc)[:500],
            structured_log={**log, "exception": type(exc).__name__},
        )
