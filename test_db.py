import os
import sys
import traceback
from supabase import create_client, Client
from dotenv import load_dotenv

# Ajouter le dossier parent au path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

print(f"URL: {url}")
print(f"KEY: {key[:10]}..." if key else "KEY: None")

try:
    print("Tentative de connexion...")
    # Essai simple
    client = create_client(url, key)
    print("SUCCESS!")
except Exception:
    traceback.print_exc()
