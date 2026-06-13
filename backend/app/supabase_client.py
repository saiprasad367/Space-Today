from __future__ import annotations

from functools import lru_cache
from supabase import create_client, Client, ClientOptions
from app.config import get_settings

@lru_cache
def get_supabase() -> Client:
    settings = get_settings()
    if not settings.supabase_url or not settings.supabase_key:
        raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in the environment")
    return create_client(
        settings.supabase_url,
        settings.supabase_key,
        options=ClientOptions(flow_type="pkce")
    )
