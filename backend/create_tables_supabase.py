"""
Create all database tables in Supabase using the REST API.
This is an alternative to alembic when the direct DB connection is not available.
Run: python create_tables_supabase.py
"""
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

import httpx


async def create_tables():
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY")  # service_role key

    if not url or not key:
        print("ERROR: SUPABASE_URL or SUPABASE_KEY not set in .env")
        return

    sql = """
-- Create tables for Space Today application

-- ── users ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_users_email ON users (email);

-- ── refresh_tokens ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_refresh_tokens_user_id ON refresh_tokens (user_id);
CREATE INDEX IF NOT EXISTS ix_refresh_tokens_token_hash ON refresh_tokens (token_hash);

-- ── favorites ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_type VARCHAR(50) NOT NULL,
    item_payload JSONB NOT NULL,
    saved_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_favorites_user_id ON favorites (user_id);
CREATE INDEX IF NOT EXISTS ix_favorites_saved_at ON favorites (saved_at);

-- ── alembic_version (so alembic thinks migration ran) ───────────────
CREATE TABLE IF NOT EXISTS alembic_version (
    version_num VARCHAR(32) NOT NULL
);
INSERT INTO alembic_version (version_num) 
VALUES ('001_initial') 
ON CONFLICT DO NOTHING;

SELECT 'Tables created successfully!' as status;
"""

    print(f"Connecting to Supabase: {url}")
    
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            f"{url}/rest/v1/rpc/sql",
            json={"query": sql},
            headers=headers,
        )
        
        if resp.status_code in (200, 201):
            print("✓ Tables created via Supabase RPC")
            print(resp.text)
        else:
            print(f"RPC failed ({resp.status_code}): {resp.text}")
            print("\nTrying direct SQL via pg_dumpall alternative...")
            
            # Try raw SQL endpoint
            resp2 = await client.post(
                f"{url}/sql",
                content=sql.encode(),
                headers={**headers, "Content-Type": "text/plain"},
            )
            print(f"Direct SQL response: {resp2.status_code}")
            print(resp2.text[:500])


if __name__ == "__main__":
    asyncio.run(create_tables())
