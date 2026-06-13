# Space Today 🌌

Space Today is a real-time space intelligence dashboard and NASA telemetry aggregator. It connects securely to official NASA endpoints (APOD, NeoWs, Mars Rover, and EONET), provides resilient caching with an in-memory or Redis backend, offers user authentication via Supabase Auth (including Google OAuth PKCE sign-in), and synchronizes user preferences and favorites.

---

## 🚀 Key Features

*   **Astronomy Picture of the Day (APOD)**: Daily high-resolution cosmic imagery with robust timezone fallback. If the current day's image is not yet published, the app gracefully falls back to the latest available APOD.
*   **Near-Earth Objects (NeoWs)**: Real-time asteroid tracking with hazard scoring, approach windows, relative velocity, and miss distance.
*   **Mars Photos Feed**: Interactive search engine pulling latest photography from Curiosity and Perseverance rovers, filterable by Sol and camera type.
*   **EONET Earth Events Monitor**: Tracks global natural events (wildfires, storms, volcanoes) from orbit in real time.
*   **Persisted Sessions & Auto-Redirect**: Intelligent session restoration on app load. Automatically redirects already authenticated users to the dashboard if they visit the landing, login, or signup screens.
*   **Stateless OAuth Exchange**: Monitored PKCE Google Sign-In with popup BroadcastChannel communication to bypass Cross-Origin-Opener-Policy (COOP) browser blocks.

---

## 🛠️ Technology Stack & Architecture

```
                 +--------------------------------+
                 |            Frontend            |
                 |     React 19 + Vite + TS       |
                 |   TanStack Router & Query      |
                 +---------------+----------------+
                                 |
                                 | Secure JSON REST
                                 v
                 +--------------------------------+
                 |            Backend             |
                 |       FastAPI (Python)         |
                 |      Memory/Redis Cache        |
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
*   **FastAPI**: Async routing and validation.
*   **SQLAlchemy + asyncpg**: Asynchronous ORM database connection.
*   **Supabase Python Client**: Session management and sync operations.
*   **SlowAPI**: Rate limiting decorators (e.g., 5/min on auth, 60/min on general).
*   **Pytest**: Integration test suite using mocked clients and RESPX for NASA endpoints.

### Frontend (TanStack React)
*   **Vite**: Lightning-fast build tool.
*   **React 19**: Modern UI rendering.
*   **TanStack Router**: Type-safe client-side routing.
*   **TanStack Query**: Cache management, optimistic updates, and loading states.
*   **Tailwind CSS**: Styling system for high-end modern dark aesthetics.

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
```

### `public.favorites`
Saves user-specific bookmarks for asteroids, photos, and APOD images.
```sql
CREATE TABLE public.favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    item_type VARCHAR(50) NOT NULL, -- 'apod' | 'asteroid' | 'mars_photo' | 'earth_event'
    item_payload JSONB NOT NULL,    -- Detailed item telemetry
    saved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
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

## 🔧 Setup & Installation

### Prerequisite: Supabase Setup
1. Create a new project on [Supabase](https://supabase.com/).
2. Run the SQL schema found in [supabase_setup.sql](file:///c:/Users/saipr/Videos/space_today/backend/supabase_setup.sql) inside the Supabase SQL Editor to initialize the database tables and enable Row-Level Security (RLS).
3. Copy your **Project URL** and **Service Role API Key** (or API Key) for environment configuration.
4. Go to **Authentication -> URL Configuration** in Supabase Console:
   * **Site URL**: `http://localhost:8081`
   * **Redirect URLs**: Add `http://localhost:8081/auth/google/callback` and `http://localhost:8080/auth/google/callback`.

### Prerequisite: Google OAuth Credentials
1. Go to the [Google Cloud Console Credentials Screen](https://console.cloud.google.com/apis/credentials).
2. Create an **OAuth Client ID** of type **Web Application**.
3. Add the following **Authorized JavaScript origins**:
   * `http://localhost:8080`
   * `http://localhost:8081`
   * `https://<your-supabase-project-id>.supabase.co`
4. Add the following **Authorized redirect URIs**:
   * `https://<your-supabase-project-id>.supabase.co/auth/v1/callback`
5. Save the generated **Client ID** and **Client Secret**.
6. Enter these credentials in your Supabase Console under **Authentication -> Providers -> Google**.

---

### Backend Installation
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv .venv
   .venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file from the example:
   ```bash
   copy .env.example .env
   ```
5. Set your environment variables in `.env`:
   ```env
   SUPABASE_URL=https://<your-project>.supabase.co
   SUPABASE_KEY=<your-anon-or-service-role-key>
   DATABASE_URL=postgresql+asyncpg://postgres.<your-project-id>:<your-password>@aws-0-<region>.pooler.supabase.com:5432/postgres
   NASA_API_KEY=<your-nasa-developer-key>
   REDIS_URL=  # Leave empty for MemoryCache
   ```
6. Run migrations (or DB sync):
   ```bash
   python create_tables_supabase.py
   ```
7. Start the FastAPI uvicorn server:
   ```bash
   uvicorn app.main:app --reload
   ```

---

### Frontend Installation
1. Navigate to the frontend directory:
   ```bash
   cd frontend/stellar-command
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Create a `.env` file:
   ```env
   VITE_API_BASE_URL=http://localhost:8000
   ```
4. Run the development server:
   ```bash
   npm run dev -- --port 8081
   ```

---

### Running Tests
To verify all operations and NASA proxy endpoints, run the backend test suite:
```bash
cd backend
.venv\Scripts\activate
python -m pytest
```

---

*Signed,*
**saiprasad**
