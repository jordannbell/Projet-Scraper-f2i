import os
from supabase import create_client, Client

# The backend should ideally use the SERVICE_ROLE_KEY to bypass RLS and perform admin actions
url: str = os.environ.get("SUPABASE_URL", "")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", os.environ.get("SUPABASE_ANON_KEY", os.environ.get("SUPABASE_KEY", "")))

def get_supabase() -> Client:
    if not url or not key:
        print("Warning: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing in .env")
    return create_client(url, key)
