# Space Today — Backend API

A production-quality REST API for the Space Today dashboard, built with FastAPI, Supabase PostgreSQL, and Redis caching.

---

## Quick Start

```bash
# 1. Install Python 3.11+ (check version)
python --version

# 2. Create and activate virtual environment
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS/Linux

# 3. Install dependencies
pip install -r requirements.txt

# 4. Copy and fill environment variables
copy .env.example .env
# Edit .env with your Supabase URL, key, NASA API key, and Redis URL

# 5. Run database migrations (Supabase Postgres)
alembic upgrade head

# 6. Start the development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Visit **http://localhost:8000/docs** for interactive OpenAPI documentation.

---

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| `SUPABASE_URL` | Your Supabase project URL | ✅ |
| `SUPABASE_KEY` | Supabase service role key | ✅ |
| `DATABASE_URL` | Supabase Postgres connection string (`postgresql+asyncpg://…`) | ✅ |
| `NASA_API_KEY` | NASA API key (get free at api.nasa.gov) | ✅ |
| `REDIS_URL` | Redis connection string (leave empty to use in-memory cache) | ⬜ |
| `JWT_SECRET_KEY` | Random secret for JWT signing | ✅ |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token TTL (default: 15) | ⬜ |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token TTL (default: 7) | ⬜ |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins | ⬜ |

---

## API Endpoints

### Health

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | — | Server + cache health check |

### Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/signup` | — | Create account, get tokens |
| POST | `/auth/login` | — | Login, get tokens |
| POST | `/auth/refresh` | — | Exchange refresh token |
| POST | `/auth/logout` | Bearer | Revoke refresh tokens |
| GET | `/auth/me` | Bearer | Get current user |

### Space Data

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/space/dashboard` | Bearer | All data in parallel |
| GET | `/space/apod?date=YYYY-MM-DD` | Bearer | Astronomy Picture of the Day |
| GET | `/space/asteroids?start_date=&end_date=` | Bearer | Near Earth Objects |
| GET | `/space/mars-photos?rover=&camera=&sol=` | Bearer | Mars rover photos |
| GET | `/space/earth-events?limit=` | Bearer | EONET natural events |

### Favorites

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/favorites` | Bearer | Save a NASA item |
| GET | `/favorites` | Bearer | List user's favorites |
| DELETE | `/favorites/{id}` | Bearer | Delete a favorite |

---

## Error Format

All errors return a consistent JSON structure:

```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Email or password is incorrect"
  }
}
```

Common error codes:
- `EMAIL_EXISTS` (409) — Signup with existing email
- `INVALID_CREDENTIALS` (401) — Wrong email or password
- `INVALID_TOKEN` (401) — JWT expired or tampered
- `INVALID_REFRESH_TOKEN` (401) — Refresh token expired or revoked
- `NOT_FOUND` (404) — Resource not found
- `VALIDATION_ERROR` (422) — Request body failed validation
- `INTERNAL_ERROR` (500) — Unexpected server error

---

## Running Tests

```bash
# Run all tests
pytest

# Run unit tests only
pytest tests/unit/

# Run integration tests only
pytest tests/integration/

# Run with verbose output
pytest -v

# Run with coverage
pytest --cov=app tests/
```

All integration tests use SQLite in-memory database and mocked NASA API calls — no real network access needed.

---

## Design Report (400–600 words)

### Architecture Overview

Space Today's backend follows a layered, service-oriented architecture built entirely without Docker, running natively on Python 3.11 with Uvicorn as the ASGI server.

**Technology Choices**

FastAPI was selected as the framework because of its native `async/await` support (critical for non-blocking NASA API calls), automatic OpenAPI documentation, and type-safe Pydantic validation. It aligns with the assessment's preference for Python backends.

Supabase provides both the hosted PostgreSQL database and authentication primitives. The ORM layer uses SQLAlchemy 2.0 with the `asyncpg` driver for fully asynchronous queries. Alembic manages schema migrations. This setup means the database can be used both via direct SQL (performance) and via the ORM (safety).

**Authentication Strategy**

The API implements a dual-token JWT pattern:

1. **Access tokens** (15-minute TTL): Short-lived JWTs stored in browser memory. Never persisted to `localStorage` or cookies. Stateless — validated by decoding the signature, no database lookup needed per request.

2. **Refresh tokens** (7-day TTL): Cryptographically random 64-byte URL-safe strings (not JWTs). Only the SHA-256 hash is stored in the `refresh_tokens` database table — the raw token is sent to the client once and never stored server-side. This prevents token theft even if the database is compromised.

**Token Rotation**: Every `/auth/refresh` call revokes the old refresh token and issues a new one. This implements [sliding window](https://auth0.com/blog/refresh-tokens-what-are-they-and-when-to-use-them/) semantics — a user stays logged in if they use the app within 7 days, but a stolen token becomes invalid the moment the real user uses it.

**Caching Strategy**

NASA APIs have strict rate limits (1000/hour for most endpoints). A two-tier caching abstraction was implemented:

- **MemoryCache**: In-process TTL cache using a Python `dict`. Zero dependencies. Used in development or when `REDIS_URL` is not set. Not shared across multiple worker processes.

- **RedisCache**: Production-grade shared cache using `redis-py` async client. Allows horizontal scaling (multiple Uvicorn workers or processes share the same cache).

Cache keys follow the pattern `{resource}:{params}` — for example, `apod:2026-06-12` or `neo:2026-06-12:2026-06-12`. TTLs are matched to NASA update frequency: APOD is cached 24 hours (it changes once daily at midnight ET), asteroids and events are cached 1 hour.

**Dashboard Parallelism**: The `/space/dashboard` endpoint fetches all four NASA data sources simultaneously using `asyncio.gather(return_exceptions=True)`. This reduces dashboard load time from ~4s sequential to ~1s parallel. Individual section failures return `{"error": "Service temporarily unavailable"}` in that section's key while the rest of the dashboard renders normally — no HTTP 500 for partial failures.

**Database Design**

Three tables:
- `users` — stores hashed passwords (bcrypt, cost factor 12), email, name, created_at
- `refresh_tokens` — stores token hashes with expiry and revocation status; CASCADE deletes on user removal
- `favorites` — user-owned JSON blobs (item_type + item_payload) enabling polymorphic favorites without separate tables per NASA resource

The JSON `item_payload` column (PostgreSQL JSONB) provides flexibility to store any NASA response shape without schema migrations for each new API field.

**Rate Limiting**: `slowapi` decorates auth endpoints at 5 requests/minute and data endpoints at 100 requests/minute using the client IP as the key. This protects against credential stuffing and brute-force attacks.

---

## Project Structure

```
backend/
├── app/
│   ├── main.py          # FastAPI app, CORS, lifespan
│   ├── config.py        # Pydantic Settings from .env
│   ├── database.py      # SQLAlchemy async engine
│   ├── dependencies.py  # get_current_user()
│   ├── models/          # SQLAlchemy ORM models
│   ├── schemas/         # Pydantic request/response models
│   ├── routers/         # auth, space, favorites
│   ├── services/        # auth_service, nasa_service, cache_service
│   └── middleware/      # rate_limit (slowapi)
├── alembic/             # Database migrations
├── tests/
│   ├── conftest.py      # Fixtures (SQLite + test client)
│   ├── unit/            # auth hashing, cache TTL tests
│   └── integration/     # auth flow, NASA mocked, favorites CRUD
├── .env.example
├── pytest.ini
├── requirements.txt
└── README.md
```
