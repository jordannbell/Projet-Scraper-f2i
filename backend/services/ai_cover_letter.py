from services.llm_text import generate_plain_text, get_text_backend


def generate_cover_letter(job_data: dict, target_title: str, target_keywords: str) -> str:
    """
    Lettre de motivation personnalisée (Groq ou Gemini selon LLM_PROVIDER).
    """
    job_title = job_data.get("titre", "")
    job_desc = job_data.get("description", "")
    company = job_data.get("entreprise_lieu", "")

    prompt = f"""
Tu es un candidat à la recherche d'un emploi. Rédige une lettre de motivation professionnelle 
et convaincante pour cette offre d'emploi, en mettant en valeur tes compétences.
La lettre doit être prête à l'emploi (sans placeholders complexes type [Nom], sauf pour la signature éventuelle).
Maintiens un ton professionnel, positif et concis (environ 3 paragraphes).

Profil du candidat :
- Titre : {target_title}
- Compétences principales : {target_keywords}

Détails de l'offre :
- Titre : {job_title}
- Entreprise : {company}
- Description : {job_desc[:1500]}...

Rédige la lettre de motivation :
"""
    try:
        if get_text_backend() == "none":
            return "Aucune clé API LLM configurée (GROQ_API_KEY ou GEMINI_API_KEY)."

        return generate_plain_text(prompt, temperature=0.45, max_tokens=2048)
    except Exception as e:
        print(f"Error generating cover letter: {e}")
        return "Erreur lors de la génération de la lettre de motivation."
