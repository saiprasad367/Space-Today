from __future__ import annotations

import os
import uuid
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from datetime import datetime

# Override env before importing app
os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///./test_space_today.db")
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-for-unit-tests-only")
os.environ.setdefault("NASA_API_KEY", "DEMO_KEY")
os.environ.setdefault("REDIS_URL", "")
os.environ.setdefault("SUPABASE_URL", "https://mock.supabase.co")
os.environ.setdefault("SUPABASE_KEY", "mock-key")

from app.database import Base, get_db
from app.main import create_app
from app.services.cache_service import MemoryCache

TEST_DB_URL = "sqlite+aiosqlite:///./test_space_today.db"

# ─── Mock Supabase Client ──────────────────────────────────────────────────────

class MockUser:
    def __init__(self, id: str, email: str, name: str = ""):
        self.id = id
        self.email = email
        self.user_metadata = {"name": name}
        self.created_at = "2026-06-13T00:00:00Z"

class MockSession:
    def __init__(self, access_token: str, refresh_token: str):
        self.access_token = access_token
        self.refresh_token = refresh_token

class MockAuthResponse:
    def __init__(self, user: MockUser, session: MockSession | None):
        self.user = user
        self.session = session

class MockTableResponse:
    def __init__(self, data: list[dict]):
        self.data = data

class MockAuth:
    def __init__(self, users_db: dict):
        self.users_db = users_db
        
    def sign_up(self, credentials: dict) -> MockAuthResponse:
        email = credentials["email"]
        password = credentials["password"]
        name = credentials.get("options", {}).get("data", {}).get("name", "")
        if email in self.users_db:
            raise Exception("user already exists")
        
        user_id = str(uuid.uuid4())
        user = MockUser(user_id, email, name)
        session = MockSession(f"access_{user_id}", f"refresh_{user_id}")
        self.users_db[email] = {
            "id": user_id,
            "email": email,
            "name": name,
            "password": password,
            "user": user,
            "session": session
        }
        return MockAuthResponse(user, session)
        
    def sign_in_with_password(self, credentials: dict) -> MockAuthResponse:
        email = credentials["email"]
        password = credentials["password"]
        if email not in self.users_db or self.users_db[email]["password"] != password:
            raise Exception("Invalid credentials")
        
        user_data = self.users_db[email]
        user = user_data["user"]
        session = MockSession(f"access_{user.id}", f"refresh_{user.id}")
        user_data["session"] = session
        return MockAuthResponse(user, session)
        
    def refresh_session(self, refresh_token: str) -> MockAuthResponse:
        for email, user_data in self.users_db.items():
            if user_data["session"] and user_data["session"].refresh_token == refresh_token:
                user = user_data["user"]
                new_session = MockSession(f"access_{user.id}_new", f"refresh_{user.id}_new")
                user_data["session"] = new_session
                return MockAuthResponse(user, new_session)
        raise Exception("Invalid refresh token")
        
    def exchange_code_for_session(self, params: dict) -> MockAuthResponse:
        user_id = str(uuid.uuid4())
        email = "google_user@test.com"
        name = "Google User"
        user = MockUser(user_id, email, name)
        session = MockSession(f"access_{user_id}", f"refresh_{user_id}")
        self.users_db[email] = {
            "id": user_id,
            "email": email,
            "name": name,
            "password": "google-oauth-password",
            "user": user,
            "session": session
        }
        return MockAuthResponse(user, session)
        
    def sign_out(self) -> None:
        if getattr(self, "current_access_token", None):
            for email, user_data in self.users_db.items():
                sess = user_data["session"]
                if sess and sess.access_token == self.current_access_token:
                    user_data["session"] = None
            self.current_access_token = None
        
    def get_user(self, access_token: str) -> MockAuthResponse | None:
        self.current_access_token = access_token
        # First check for exact matching access token session
        for email, user_data in self.users_db.items():
            sess = user_data["session"]
            if sess and sess.access_token == access_token:
                return MockAuthResponse(user_data["user"], sess)
        # Fallback for external or mocked test tokens
        if access_token and access_token.startswith("access_"):
            parts = access_token.split("_")
            uid = parts[1] if len(parts) > 1 else str(uuid.uuid4())
            return MockAuthResponse(MockUser(uid, "test@example.com", "Test"), None)
        return None

class MockTable:
    def __init__(self, name: str, favorites_db: list[dict]):
        self.name = name
        self.favorites_db = favorites_db
        self.filters = {}
        self.orders = []
        self.is_delete = False
        self.data_to_write = None
        
    def select(self, *args, **kwargs) -> MockTable:
        return self
        
    def insert(self, data: dict) -> MockTable:
        self.data_to_write = data
        self.is_insert = True
        return self
        
    def upsert(self, data: dict) -> MockTable:
        self.data_to_write = data
        self.is_upsert = True
        return self
        
    def eq(self, field: str, value: str) -> MockTable:
        self.filters[field] = value
        return self
        
    def order(self, field: str, desc: bool = False) -> MockTable:
        self.orders.append((field, desc))
        return self
        
    def delete(self) -> MockTable:
        self.is_delete = True
        return self
        
    def execute(self) -> MockTableResponse:
        if self.is_delete:
            deleted = []
            remaining = []
            for item in self.favorites_db:
                match = True
                for k, v in self.filters.items():
                    if str(item.get(k)) != str(v):
                        match = False
                        break
                if match:
                    deleted.append(item)
                else:
                    remaining.append(item)
            self.favorites_db.clear()
            self.favorites_db.extend(remaining)
            return MockTableResponse(deleted)

        if getattr(self, "is_insert", False) or getattr(self, "is_upsert", False):
            data = self.data_to_write
            if self.name == "favorites":
                fav_id = str(uuid.uuid4())
                item = {
                    "id": fav_id,
                    "user_id": data["user_id"],
                    "item_type": data["item_type"],
                    "item_payload": data["item_payload"],
                    "saved_at": "2026-06-13T00:00:00Z"
                }
                self.favorites_db.append(item)
                return MockTableResponse([item])
            return MockTableResponse([data])
            
        results = []
        for item in self.favorites_db:
            match = True
            for k, v in self.filters.items():
                if str(item.get(k)) != str(v):
                    match = False
                    break
            if match:
                results.append(item)
        return MockTableResponse(results)


class MockSupabaseClient:
    def __init__(self):
        self.users_db = {}
        self.favorites_db = []
        self.auth = MockAuth(self.users_db)
        
    def table(self, name: str) -> MockTable:
        return MockTable(name, self.favorites_db)

@pytest.fixture(autouse=True)
def mock_supabase(monkeypatch):
    client = MockSupabaseClient()
    monkeypatch.setattr("app.routers.auth.get_supabase", lambda: client)
    monkeypatch.setattr("app.routers.favorites.get_supabase", lambda: client)
    monkeypatch.setattr("app.dependencies.get_supabase", lambda: client)
    return client

# ─── Standard Database Fixtures ────────────────────────────────────────────────

@pytest.fixture(scope="session")
async def engine():
    _engine = create_async_engine(TEST_DB_URL, echo=False)
    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield _engine
    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await _engine.dispose()


@pytest.fixture
async def db_session(engine):
    session_factory = async_sessionmaker(bind=engine, expire_on_commit=False)
    async with session_factory() as session:
        yield session
        await session.rollback()


@pytest.fixture
async def client(engine):
    """AsyncClient connected to the FastAPI app with test DB and in-memory cache."""
    from app.middleware.rate_limit import limiter
    limiter.enabled = False

    app = create_app()
    app.state.cache = MemoryCache()

    # Override get_db to use test engine
    session_factory = async_sessionmaker(bind=engine, expire_on_commit=False)

    async def override_get_db():
        async with session_factory() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
