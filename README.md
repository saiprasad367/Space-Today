# Space Today 🌌 — Real-Time Space Intelligence Dashboard

Space Today is a state-of-the-art, production-grade space intelligence dashboard and NASA telemetry aggregator. It connects securely to official NASA endpoints (APOD, NeoWs, Mars Rover, and EONET), provides resilient caching with an in-memory or Redis backend, offers secure user authentication via Supabase Auth (including Google OAuth PKCE sign-in), and synchronizes user favorites and bookmarks.

---

## 🚀 Key Features

*   **Astronomy Picture of the Day (APOD)**: Daily high-resolution cosmic imagery with robust timezone fallback. If the current day's image is not yet published, the app gracefully falls back to the latest available APOD.
*   **Near-Earth Objects (NeoWs)**: Real-time asteroid tracking with hazard scoring, approach windows, relative velocity, and miss distance.
*   **Mars Photos Feed**: Interactive search engine pulling latest photography from Curiosity and Perseverance rovers, filterable by Sol and camera type.
*   **EONET Earth Events Monitor**: Tracks global natural events (wildfires, storms, volcanoes) from orbit in real time.
*   **Persisted Sessions & Auto-Redirect**: Intelligent session restoration on app load. Automatically redirects already authenticated users to the dashboard if they visit the landing, login, or signup screens.
*   **Stateless OAuth Exchange**: Monitored PKCE Google Sign-In with popup BroadcastChannel communication to bypass Cross-Origin-Opener-Policy (COOP) browser blocks.
*   **Optimistic UI Updates**: Instant toggling of favorites with auto-rollback if the backend write fails, powered by TanStack Query.
*   **Parallel Fetching**: Dashboard fetches multiple NASA services concurrently using `asyncio.gather(return_exceptions=True)` to drop dashboard load time from ~4 seconds to under 1 second.

---

## 🛠️ Technology Stack & Architecture

```
                 +--------------------------------+
                 |            Frontend            |
                 |      React 19 + Vite + TS      |
                 |     TanStack Router & Query    |
                 +---------------+----------------+
                                 |
                                 | Secure JSON REST
                                 v
                 +--------------------------------+
                 |            Backend             |
                 |        FastAPI (Python)        |
                 |       Memory/Redis Cache       |
                 +---------------+----------------+
                                 |
           +---------------------+---------------------+
           |                                           |
           v SQL / ORM                                 v HTTPS REST
+--------------------+                       +--------------------+
|  Supabase Postgres |                       |      NASA APIs     |
|   (Auth & Data)    |                       | (APOD, NeoWs, etc) |
+--------------------+                       +--------------------+
```

### Backend (FastAPI)
*   **FastAPI**: Asynchronous routing, lifespan events, and CORS middleware.
*   **SQLAlchemy + asyncpg**: Asynchronous ORM database connection and querying.
*   **Supabase Python Client**: Auth helper client and direct database sync operations.
*   **SlowAPI**: Rate limiting decorator (5 requests/minute on authentication routes, 100/minute on data endpoints).
*   **Pytest & pytest-asyncio**: Test suite utilizing mocked clients and RESPX for NASA endpoints.

### Frontend (TanStack React)
*   **Vite**: Frontend build system.
*   **React 19**: Modern UI rendering engine.
*   **TanStack Start**: Server-side routing, SSR, and function loader middleware.
*   **TanStack Router**: Type-safe client-side routing.
*   **TanStack Query (React Query) v5**: Cache lifetimes (`staleTime` of 1 hour for NASA endpoints), pagination, and optimistic mutations.
*   **Tailwind CSS v4**: Futuristic, glassmorphism-focused styling utilizing a tailored HSL dark palette.

---

## 💾 Database Schema & Tables

All data tables reside inside your Supabase PostgreSQL database under the `public` schema.

### `public.users`
Stores synchronized user profiles. Updated automatically upon signup or Google login.
```sql
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL DEFAULT 'supabase-auth-managed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS ix_users_email ON public.users (email);
```

### `public.favorites`
Saves user-specific bookmarks for asteroids, photos, and APOD images. Uses a JSONB payload to provide polymorphic compatibility without extra tables.
```sql
CREATE TABLE public.favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    item_type VARCHAR(50) NOT NULL, -- 'apod' | 'asteroid' | 'mars_photo' | 'earth_event'
    item_payload JSONB NOT NULL,    -- Detailed item telemetry
    saved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS ix_favorites_user_id ON public.favorites (user_id);
```

---

## 🛰️ API Endpoint Design

All API responses are normalized and require a Bearer token in the `Authorization` header.

### Authentication Endpoints
*   `POST /auth/signup` - Register a new user using email & password.
*   `POST /auth/login` - Authenticate with credentials. Returns access & refresh tokens.
*   `POST /auth/refresh` - Rotate session and generate a new access token.
*   `POST /auth/logout` - Revoke current refresh token and clear session.
*   `GET /auth/me` - Retrieve current user profile.
*   `GET /auth/google/url` - Generate a state-proof Google OAuth PKCE authorization URL.
*   `POST /auth/google/token` - Exchange Google code + verifier for backend session.

### Space Telemetry Endpoints
*   `GET /space/dashboard` - Fetches APOD, asteroids, Mars photos, and Earth events in parallel.
*   `GET /space/apod?date=YYYY-MM-DD` - Astronomy Picture of the Day (with target date fallback).
*   `GET /space/asteroids?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD` - NeoWs tracking data.
*   `GET /space/mars-photos?rover=curiosity&camera=all&sol=1000` - Mars rover photographs.
*   `GET /space/earth-events?limit=50` - Active EONET natural disasters feed.

### User Favorites Endpoints
*   `GET /favorites` - Fetch user's saved items.
*   `POST /favorites` - Save a telemetry item.
*   `DELETE /favorites/{id}` - Remove a saved item.

---

## 🔧 Local Setup & Installation

### Prerequisite 1: Supabase Setup
1. Create a new project on [Supabase](https://supabase.com/).
2. Run the SQL schema found in `backend/supabase_setup.sql` inside the Supabase SQL Editor to initialize the database tables and indexes.
3. Under **Authentication -> URL Configuration** in the Supabase Console:
    * Set **Site URL** to `http://localhost:8081`
    * Add **Redirect URLs**: `http://localhost:8081/auth/google/callback` and `http://localhost:8080/auth/google/callback`

### Prerequisite 2: Google OAuth Client Setup
1. Open the [Google Cloud Console Credentials Screen](https://console.cloud.google.com/apis/credentials).
2. Create an **OAuth Client ID** of type **Web Application**.
3. Configure the following **Authorized JavaScript origins**:
    * `http://localhost:8080`
    * `http://localhost:8081`
    * `https://<your-supabase-project-id>.supabase.co`
4. Configure the following **Authorized redirect URIs**:
    * `https://<your-supabase-project-id>.supabase.co/auth/v1/callback`
5. Save the generated **Client ID** and **Client Secret**.
6. Enter these credentials in your Supabase Console under **Authentication -> Providers -> Google**.

---

### Backend Local Setup
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   # Windows:
   python -m venv .venv
   .venv\Scripts\activate

   # macOS/Linux:
   python3 -m venv .venv
   source .venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file:
   ```bash
   # Windows:
   copy .env.example .env

   # macOS/Linux:
   cp .env.example .env
   ```
5. Configure the environment variables inside `backend/.env`:
   ```env
   SUPABASE_URL=https://<your-project>.supabase.co
   SUPABASE_KEY=<your-service-role-key>
   DATABASE_URL=postgresql+asyncpg://postgres.<your-project-id>:<your-password>@aws-1-<your-region>.pooler.supabase.com:5432/postgres
   NASA_API_KEY=<your-nasa-developer-key>
   REDIS_URL=  # Leave empty for MemoryCache
   JWT_SECRET_KEY=<generate-a-secure-random-256-bit-key>
   ALLOWED_ORIGINS=http://localhost:8081,http://localhost:5173
   APP_ENV=development
   ```
6. Run database migrations:
   ```bash
   python create_tables_supabase.py
   # Or using Alembic:
   alembic upgrade head
   ```
7. Start the development server:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

---

### Frontend Local Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend/stellar-command
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Create a `.env` file containing the local backend API endpoint:
   ```env
   VITE_API_BASE_URL=http://localhost:8000
   ```
4. Start the development server on port 8081 (to match OAuth settings):
   ```bash
   npm run dev -- --port 8081
   ```

---

### Running Local Tests
To run the full backend unit and integration test suite:
```bash
cd backend
.venv\Scripts\activate # On Windows
python -m pytest
```

---

## ☁️ Production Deployment

### Frontend (Vercel)
1. Import your repository into **Vercel**.
2. Set **Root Directory** to `frontend/stellar-command`.
3. Set **Framework Preset** to `TanStack Start`.
4. Configure **Build Command**: `npm run build`
5. Configure **Output Directory**: `.vercel/output` (Vercel automatically sets this for TanStack Start).
6. Set the **Environment Variables**:
   * `VITE_API_BASE_URL`: `https://<your-render-backend-url>.onrender.com`

### Backend (Render)
1. Create a new **Web Service** on **Render**.
2. Connect your Git repository.
3. Configure the following settings:
   * **Root Directory**: `backend`
   * **Runtime**: `Python`
   * **Build Command**: `pip install -r requirements.txt`
   * **Start Command**: `alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Set the **Environment Variables**:
   * `APP_ENV`: `production`
   * `DATABASE_URL`: `postgresql+asyncpg://postgres.<your-project-id>:<your-password>@aws-1-<your-region>.pooler.supabase.com:5432/postgres` (Verified Session Pooler URL)
   * `ALLOWED_ORIGINS`: `http://localhost:8081,https://<your-vercel-domain>.vercel.app` (add your production Vercel URL)
   * `SUPABASE_URL`: `https://<your-project-id>.supabase.co`
   * `SUPABASE_KEY`: `<your-supabase-service-role-key>`
   * `NASA_API_KEY`: `<your-nasa-developer-key>`
   * `JWT_SECRET_KEY`: `<your-secure-jwt-key>`

---

## 🛠️ Troubleshooting & Deployment Fixes (Historical Log)

During the deployment of this project to production, several compatibility and networking issues were resolved. Here is the historical log of these issues and how to fix them if they recur:

### 1. Vercel deployment returns "Page Not Found" (404)
*   **The Issue**: After importing the project, visiting the Vercel site returned a 404.
*   **The Cause**: `@lovable.dev/vite-tanstack-config` was configured to skip the Nitro build step unless it detected a Lovable sandbox or an explicit `nitro` toggle. As a result, the serverless functions and SSR entry points were never compiled during the Vercel build.
*   **The Fix**: Modified `frontend/stellar-command/vite.config.ts` to explicitly set `nitro: true` in the `defineConfig` options:
    ```typescript
    export default defineConfig({
      nitro: true, // Force Nitro compilation
      tanstackStart: {
        server: { entry: "server" },
      },
      // ...
    });
    ```

### 2. Render build failure (`pydantic-core` metadata compilation)
*   **The Issue**: The Render Python build crashed during package metadata generation for `pydantic-core`.
*   **The Cause**: Render was defaulting to Python 3.14 (experimental/pre-release) for the runtime. Because precompiled wheels of `pydantic-core` did not exist for Python 3.14, `pip` tried to compile it from source via Rust/maturin, which failed in Render's read-only builder container.
*   **The Fix**: Created a `.python-version` file containing `3.11.9` in both the repository root and `backend/` directories. This forced Render to build using a stable Python 3.11.9 runtime, allowing it to download the precompiled binary wheel instantly.

### 3. Database connection: `OperationalError: Network is unreachable` on Render
*   **The Issue**: The backend crashed on startup when trying to run migrations directly on `db.<your-project-id>.supabase.co`.
*   **The Cause**: Supabase's direct database domains are IPv6-only. Render's build servers and web services do not have outbound IPv6 routing enabled on their container hosts, making the direct host completely unreachable.
*   **The Fix**: Switched from the direct database domain to Supabase's connection pooler hosts, which resolve to IPv4 addresses.

### 4. Pooler connection: `FATAL: (ENOTFOUND) tenant/user postgres.<your-project-id> not found`
*   **The Issue**: Connecting to `aws-0-ap-south-1.pooler.supabase.com` or `aws-0-ap-northeast-2.pooler.supabase.com` threw a routing error.
*   **The Cause**: 
    1.  **Region/Host mismatch**: Supabase has migrated newer projects to their new `aws-1` routing networks. The correct host is `aws-1-ap-northeast-2.pooler.supabase.com` (Seoul region, `aws-1` cluster).
    2.  **Special characters in password**: The database password originally contained `@` (written as URL-encoded `%40` in the connection string). The pooler proxy fails to parse or authenticate URL-encoded strings correctly, throwing a generic "tenant not found" error.
*   **The Fix**: 
    1.  Reset the database password in the Supabase settings page to a new alphanumeric password (removing all special characters to avoid URL-encoding issues).
    2.  Updated the connection string host to the exact `aws-1-ap-northeast-2.pooler.supabase.com` domain shown in the Connect sheet.

### 5. SQLAlchemy transaction pooling error: `DuplicatePreparedStatementError`
*   **The Issue**: Connecting to the transaction pooler on port `6543` failed with a prepared statement error on query execution.
*   **The Cause**: SQLAlchemy and the `asyncpg` driver use prepared statements to execute queries. Transaction poolers (like PgBouncer/Supavisor in transaction mode) do not support prepared statements because they reuse server connections across different clients.
*   **The Fix**: Switched the connection port to `5432` (Session Pooler mode). Session poolers assign a dedicated database connection for the duration of the client session, which fully supports prepared statements without throwing errors.

---

*Signed,*
**saiprasad**
