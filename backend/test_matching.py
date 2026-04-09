import os
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

from services.ai_matching import calculate_match_score
from services.ai_cover_letter import generate_cover_letter

def test_ai_services():
    print("--- Test des services IA Seekra ---")
    
    # Données de test (Offre d'emploi fictive)
    job_data = {
        "titre": "Développeur Python FastAPI Senior",
        "entreprise_lieu": "Paris (75) - Remote",
        "description": "Nous recherchons un développeur Python passionné par FastAPI pour rejoindre notre équipe. Vous travaillerez sur des architectures micro-services et l'intégration d'IA. Compétences requises : Python, FastAPI, PostgreSQL, Docker."
    }
    
    target_title = "Développeur Backend Python"
    target_keywords = "Python, FastAPI, SQL, Docker"

    print("\n1. Test du Matching Score...")
    score = calculate_match_score(job_data, target_title, target_keywords)
    print(f"Score calculé par Gemini : {score}/100")

    print("\n2. Test de la Lettre de Motivation...")
    letter = generate_cover_letter(job_data, target_title, target_keywords)
    print("Lettre générée (extrait) :")
    print("-" * 30)
    print(letter[:300] + "...")
    print("-" * 30)

    if score > 0 and len(letter) > 100:
        print("\nSUCCES : Les services Gemini repondent correctement avec gemini-2.5-flash.")
    else:
        print("\nECHEC : Vérifiez votre GEMINI_API_KEY dans le fichier .env")

if __name__ == "__main__":
    test_ai_services()
