import os
from supabase import create_client, Client

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

if not url or not key:
    raise RuntimeError("Set SUPABASE_URL and SUPABASE_KEY in environment before running this script.")

supabase: Client = create_client(url, key)

try:
    print("Trying to fetch from users table...")
    response = supabase.table("users").select("*").limit(1).execute()
    print("users table exists:", response.data)
except Exception as e:
    print("Error fetching 'users':", str(e))

try:
    print("Trying to fetch from profiles table...")
    response = supabase.table("profiles").select("*").limit(1).execute()
    print("profiles table exists:", response.data)
except Exception as e:
    print("Error fetching 'profiles':", str(e))
