import os

from services.llm_text import generate_plain_text, get_text_backend


def calculate_match_score(job_data: dict, target_title: str, target_keywords: str) -> int:
    """
    Analyse l’offre par rapport au titre et mots-clés cibles ; score 0–100.
    """
    job_title = job_data.get("titre", "")
    job_desc = job_data.get("description", "")
    company = job_data.get("entreprise_lieu", "")

    prompt = f"""
Tu es un recruteur expert. Analyse cette offre d'emploi et note de 0 à 100 sa pertinence 
pour un candidat avec ce profil. NE REPONDS QU'AVEC UN NOMBRE ENTIER ENTRE 0 ET 100.

Profil du candidat :
- Poste visé : {target_title}
- Mots-clés/Compétences : {target_keywords}

Offre d'emploi :
- Titre : {job_title}
- Entreprise/Lieu : {company}
- Description : {job_desc}

Score de pertinence (0-100) :
"""
    try:
        if get_text_backend() == "none":
            print("Aucune clé LLM (GROQ_API_KEY / GEMINI_API_KEY). Score=0.")
            return 0

        score_str = generate_plain_text(
            prompt,
            temperature=float(os.environ.get("MATCHING_LLM_TEMPERATURE", "0.15") or "0.15"),
            max_tokens=64,
        )
        score_str = score_str.strip().replace("%", "")
        score_val = "".join(filter(str.isdigit, score_str))
        score = int(score_val) if score_val else 0
        return max(0, min(100, score))
    except Exception as e:
        print(f"Error calculating match score: {e}")
        return 0
