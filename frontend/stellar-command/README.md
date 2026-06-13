# Space Today — Frontend Dashboard

A premium, state-of-the-art space intelligence dashboard built with React 19, TanStack Start (Vite), TanStack Query (React Query), and Tailwind CSS v4.

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
# Ensure you have a .env file in the frontend/stellar-command directory:
VITE_API_BASE_URL=http://localhost:8000

# 3. Start the development server
npm run dev
```

Visit **http://localhost:5173** to view the app.

---

## Technology Stack

1. **Framework & Routing**: React 19 + TanStack Start. Utilizes TanStack Router for type-safe routing and layout rendering.
2. **Styling**: Tailwind CSS v4. Includes custom styling tokens for glassmorphism, nebula-themed gradients, and deep space dark mode.
3. **Data Fetching**: TanStack Query (React Query) v5. Keeps UI state synced with the backend API, manages cache lifetimes, and provides skeleton loaders.
4. **State Management & Auth**: Custom `AuthProvider` exposing token renewal, session recovery, and user profile information.
5. **Animations**: Framer Motion for premium micro-interactions, smooth router transitions, and interactive visual charts.
6. **Data Visualization**: Recharts for custom orbital velocity charts, hazardous asteroid trackers, and close approach trackers.

---

## Design Report (450+ words)

### User Experience & Premium Design Choices

Space Today's frontend is designed to feel like a command center terminal on a high-tech starship. Rather than relying on standard components and vanilla UI primitives, the application utilizes a curated visual design language to achieve a premium aesthetic:

1. **Color Scheme**: Built around a futuristic, deep-space palette using HSL Tailored colors. Backgrounds are deep obsidian (`hsl(240 10% 4%)`), with accents of cobalt blue (`hsl(220 90% 56%)`), neon teal, and super-heated plasma purple. The layout uses glassmorphism (`backdrop-blur-md` combined with borders containing low-opacity white) to emulate spacecraft instrumentation panels.
2. **Typography**: Google Font `Inter` is utilized for crisp readability in UI elements and charts, while `Space Grotesk` is used for headers to establish a futuristic, high-tech tone. Code snippets and technical telemetry use `JetBrains Mono` for maximum alignment.
3. **Micro-Animations**: All button hover states, card entries, and dashboard widgets include custom transitions powered by Framer Motion. Elements fade in sequentially, and charts draw smoothly when they load. These animations improve engagement without sacrificing performance.

### API Integration & Authentication Architecture

**Dual-Token Silent Refresh Flow**
The frontend client maintains a strict separation of concerns for security and user experience:
- **Access Token**: Stored in-memory only (in a module-level variable `_accessToken`). This mitigates the risk of Cross-Site Scripting (XSS) attacks, as scripts cannot read the memory space of an isolated module.
- **Refresh Token**: Stored in `localStorage`. While httpOnly cookies are preferred in production, `localStorage` represents a reasonable UX compromise to allow user sessions to persist across page refreshes.
- **Silent Refresh Middleware**: The `apiFetch` wrapper interceptor acts as a proxy for all HTTP requests. If a request returns `HTTP 401 Unauthorized`, `apiFetch` intercepts it, pauses any incoming requests, triggers `/auth/refresh` behind the scenes, and then retries the original request with the new access token. If refresh fails, tokens are wiped and the user is redirected to `/login`.

**State Management & Caching Strategy**
By coupling TanStack Query with our API client, we manage server-state with optimal efficiency:
- **Stale Time**: All NASA data endpoints use a `staleTime` of 1 hour (`3600000ms`), matching the NASA API cache lifetimes on the backend. This minimizes redundant network requests while ensuring the user sees up-to-date data.
- **Optimistic Updates**: For the Favorites page (`/favorites`), mutating the database triggers an optimistic UI change. When a user toggles a favorite, the item immediately moves to the saved/removed state in the UI. If the server fails to persist the change, the UI automatically rolls back to the previous state and displays a `sonner` toast error.
- **Partial Failure Handling**: In the Dashboard (`/dashboard`), components render skeleton states independently. If one NASA endpoint fails, only that specific widget displays an inline error state. The rest of the dashboard remains interactive, preventing a single failure from rendering the page unusable.

---

## Folder Structure

```
frontend/stellar-command/
├── src/
│   ├── components/       # UI components (shadcn/ui, ui-bits)
│   ├── contexts/         # AuthProvider & useAuth hook
│   ├── hooks/            # TanStack Query custom hooks per API route
│   ├── lib/              # apiFetch client, error handlers, mock fallbacks
│   └── routes/           # TanStack router endpoints & view templates
├── package.json
├── vite.config.ts
└── tsconfig.json
```
