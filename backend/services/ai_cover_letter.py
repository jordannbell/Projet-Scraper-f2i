import os
from google import genai

# Configure Gemini API using the new google-genai client
api_key = os.environ.get("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)

def generate_cover_letter(job_data: dict, target_title: str, target_keywords: str) -> str:
    """
    Generates a personalized cover letter using Gemini based on the job offer and user profile.
    """
    job_title = job_data.get('titre', '')
    job_desc = job_data.get('description', '')
    company = job_data.get('entreprise_lieu', '')

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
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt
        )
        return response.text.strip()
    except Exception as e:
        print(f"Error generating cover letter: {e}")
        return "Erreur lors de la génération de la lettre de motivation."
