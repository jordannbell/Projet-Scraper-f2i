from fastapi import APIRouter, UploadFile, File, Form, HTTPException
import fitz # PyMuPDF
from services.supabase_client import get_supabase
import os
from google import genai
import json

router = APIRouter()
supabase = get_supabase()
client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

@router.post("/upload-cv")
async def upload_cv(
    user_id: str = Form(...),
    file: UploadFile = File(...)
):
    """
    1. Reçoit le CV PDF.
    2. Extrait le texte via PyMuPDF.
    3. Demande à Gemini de trouver le job visé et les mots-clés.
    4. Met à jour la table user_preferences.
    """
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Seuls les fichiers PDF sont acceptés")

    try:
        # 1. Lire le PDF en mémoire
        file_bytes = await file.read()
        
        # (Optionnel) Sauvegarder dans Supabase Storage
        # supabase.storage.from_("resumes").upload(f"{user_id}/cv.pdf", file_bytes, {"upsert": "true"})

        # 2. Extraire le texte du PDF
        doc = fitz.open("pdf", file_bytes)
        text = ""
        for page in doc:
            text += page.get_text()
        
        if not text.strip():
            raise ValueError("Le PDF ne contient pas de texte lisible.")

        # 3. Extraction IA avec Gemini
        prompt = f"""
Voici le texte d'un CV. Identifie le métier principal recherché par ce candidat, extrait 5 à 10 mots-clés importants (compétences, technos, outils), et rédige unRésumé exécutif accrocheur de 3 à 4 lignes.
Réponds UNIQUEMENT au format JSON strict avec les clés "target_job_title", "target_keywords", et "cv_summary".
Ne mets pas de markdown (pas de ```json).
CV :
\"\"\"{text[:3000]}\"\"\"
"""
        
        # Utilisation de Gemini 2.5 Flash
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt
        )
        
        # Parser le JSON
        raw_json = response.text.strip()
        if raw_json.startswith("```json"):
            raw_json = raw_json[7:-3]
            
        data = json.loads(raw_json)
        
        title = data.get("target_job_title", "")
        keywords = data.get("target_keywords", "")
        cv_summary = data.get("cv_summary", "")
        
        if type(keywords) is list:
            keywords = ", ".join(keywords)

        # 4. Mettre à jour les préférences de l'utilisateur
        supabase.table("user_preferences").upsert({
            "user_id": user_id,
            "target_job_title": title,
            "target_keywords": keywords,
            "cv_summary": cv_summary
        }).execute()

        return {
            "status": "success",
            "extracted_title": title,
            "extracted_keywords": keywords,
            "cv_summary": cv_summary
        }

    except Exception as e:
        print(f"Error processing CV: {e}")
        raise HTTPException(status_code=500, detail=str(e))
