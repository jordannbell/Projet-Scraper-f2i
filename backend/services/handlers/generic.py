from urllib.parse import urlparse

from services.apply_types import ApplyBotResult
from services.handlers.base import ApplyContext


async def handle_generic(ctx: ApplyContext) -> ApplyBotResult:
    host = urlparse(ctx.job_url).netloc.lower()
    return ApplyBotResult(
        outcome="needs_manual",
        handler="generic",
        message=f"Aucun automate configuré pour {host}. Ouvrez l'offre et postulez manuellement.",
        structured_log={"host": host},
    )
