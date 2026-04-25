from urllib.parse import urlparse

from services.apply_types import ApplyBotResult
from services.handlers.base import ApplyContext
from services.handlers.france_travail import handle_france_travail
from services.handlers.generic import handle_generic
from services.handlers.hellowork import handle_hellowork


def _host(url: str) -> str:
    return urlparse(url).netloc.lower()


async def dispatch_apply_handler(ctx: ApplyContext) -> ApplyBotResult:
    host = _host(ctx.job_url)
    if "hellowork.com" in host:
        return await handle_hellowork(ctx)
    if "francetravail" in host or "pole-emploi" in host:
        return await handle_france_travail(ctx)
    return await handle_generic(ctx)
