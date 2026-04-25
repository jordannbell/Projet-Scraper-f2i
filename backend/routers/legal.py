from fastapi import APIRouter

router = APIRouter()

# Référence produit : à adapter avec votre avocat avant commercialisation.
TOS_MATRIX = [
    {
        "site": "HelloWork",
        "automation_risk": "Les parcours varient ; connexion, ATS externe ou captcha peuvent bloquer l’automate.",
        "user_action": "Vérifier les CGU du site ; finaliser manuellement si besoin.",
    },
    {
        "site": "France Travail",
        "automation_risk": "Redirection fréquente vers des sites recruteurs tiers.",
        "user_action": "Postuler sur le site indiqué par l’annonce ; Seekra peut marquer « action manuelle requise ».",
    },
    {
        "site": "Autres / ATS",
        "automation_risk": "Non pris en charge par défaut.",
        "user_action": "Utiliser le lien direct de l’offre.",
    },
]


@router.get("/tos-matrix")
def get_tos_matrix():
    return {"items": TOS_MATRIX}
