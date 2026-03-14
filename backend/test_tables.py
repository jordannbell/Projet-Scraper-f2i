import os
from supabase import create_client, Client

url = os.environ.get("SUPABASE_URL", "https://aalgfsxyxwfedxcronui.supabase.co")
key = os.environ.get("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhbGdmc3h5eHdmZWR4Y3JvbnVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0NTI3NDEsImV4cCI6MjA4NDAyODc0MX0.qI2hwCB8tnnEeSsTNSLLZP6RVt8BSN3zSndBwqb9SCE")

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
