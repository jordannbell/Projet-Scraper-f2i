import os

from supabase import Client, create_client
from supabase.lib.client_options import SyncClientOptions

url: str = os.environ.get("SUPABASE_URL", "")
service_role_key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
anon_key: str = os.environ.get("SUPABASE_ANON_KEY", os.environ.get("SUPABASE_KEY", ""))


def _build_client(key: str) -> Client:
    if not url or not key:
        raise RuntimeError("SUPABASE_URL or Supabase key missing in environment")
    return create_client(url, key)


def get_supabase(require_service_role: bool = False) -> Client:
    """
    Default client for backend operations.
    Uses service role when available, otherwise anon key.
    """
    if require_service_role:
        return get_supabase_admin()

    if service_role_key:
        return _build_client(service_role_key)
    if anon_key:
        return _build_client(anon_key)

    raise RuntimeError("No Supabase key configured (service role or anon key)")


def get_supabase_admin() -> Client:
    """
    Admin-only client. Required for privileged operations.
    """
    if not service_role_key:
        raise RuntimeError("SUPABASE_SERVICE_ROLE_KEY is required for admin operations")
    return _build_client(service_role_key)


def get_supabase_anon() -> Client:
    """
    Anon-key client. Useful for user-token verification and RLS-safe operations.
    """
    if not anon_key:
        raise RuntimeError("SUPABASE_ANON_KEY (or SUPABASE_KEY) is required")
    return _build_client(anon_key)


def get_supabase_for_access_token(access_token: str) -> Client:
    """
    Client PostgREST avec le JWT utilisateur (RLS : auth.uid() = utilisateur connecté).
    À utiliser pour insert/upsert côté API quand la clé anon seule est refusée par RLS.
    """
    if not url or not anon_key:
        raise RuntimeError("SUPABASE_URL or Supabase anon key missing")
    if not access_token or not str(access_token).strip():
        raise RuntimeError("Missing access token for RLS-scoped Supabase client")
    return create_client(
        url,
        anon_key,
        options=SyncClientOptions(
            headers={"Authorization": f"Bearer {access_token.strip()}"},
        ),
    )
