from urllib.parse import urlparse

from services.apply_types import ApplyBotResult
from services.handlers.base import ApplyContext


async def handle_france_travail(ctx: ApplyContext) -> ApplyBotResult:
    """
    France Travail redirige souvent vers des ATS tiers : pas de parcours unique fiable.
    """
    final_host = urlparse(ctx.page.url).netloc.lower()
    return ApplyBotResult(
        outcome="needs_manual",
        handler="france_travail",
        message=(
            "Offre France Travail : la candidature se fait souvent sur un site recruteur externe. "
            f"Page actuelle : {final_host}. Finalisez depuis le lien de l'annonce."
        ),
        structured_log={"final_url": ctx.page.url},
    )
