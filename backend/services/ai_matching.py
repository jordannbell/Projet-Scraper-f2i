import os
from google import genai

# Configure Gemini API using the new google-genai client
api_key = os.environ.get("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)

def calculate_match_score(job_data: dict, target_title: str, target_keywords: str) -> int:
    """
    Analyzes the job offer against the user's targeted title and keywords
    and returns a match score between 0 and 100.
    """
    job_title = job_data.get('titre', '')
    job_desc = job_data.get('description', '')
    company = job_data.get('entreprise_lieu', '')

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
        # Using the new google-genai syntax
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt
        )
        # Parse the integer from response
        score_str = response.text.strip().replace('%', '')
        # Clean potential non-numeric text (sometimes LLM adds explanations)
        score_val = "".join(filter(str.isdigit, score_str))
        score = int(score_val) if score_val else 0
        return max(0, min(100, score))
    except Exception as e:
        print(f"Error calculating match score: {e}")
        return 0
