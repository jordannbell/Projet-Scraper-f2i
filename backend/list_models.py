import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

api_key = os.environ.get("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)

print(f"Clé API utilisée : {api_key[:10]}...")

try:
    print("\nListe des modèles disponibles :")
    for m in client.models.list():
        print(f"- {m.name}")
        # print(dir(m)) # Debug attributes if needed
except Exception as e:
    print(f"Erreur lors du listing des modèles : {e}")
