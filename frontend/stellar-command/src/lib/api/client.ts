/**
 * Space Today API Client
 *
 * Features:
 * - All requests attach Authorization: Bearer <access_token> from memory
 * - On 401: auto-refresh once, then retry original request
 * - On refresh failure: clears tokens, redirects to /login
 * - Standard error parsing: { error: { code, message } }
 * - Access token stored in module-level ref (memory only — never localStorage)
 * - Refresh token stored in localStorage (documented tradeoff: survives page refresh)
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

// ─── Token Storage ────────────────────────────────────────────────────────────
// Access token: in-memory only (not in localStorage for security)
let _accessToken: string | null = null;

// Refresh token: localStorage so session survives page reload
// Tradeoff: XSS risk vs UX. Acceptable for this app; httpOnly cookie preferred in production.
const REFRESH_KEY = "space_today_refresh_token";

export const tokenStore = {
  getAccess: () => _accessToken,
  setAccess: (t: string | null) => { _accessToken = t; },
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  setRefresh: (t: string | null) => {
    if (t) localStorage.setItem(REFRESH_KEY, t);
    else localStorage.removeItem(REFRESH_KEY);
  },
  clear: () => {
    _accessToken = null;
    localStorage.removeItem(REFRESH_KEY);
  },
};

// ─── API Error ────────────────────────────────────────────────────────────────

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export class SpaceApiError extends Error {
  code: string;
  status: number;
  details?: unknown;

  constructor(status: number, error: ApiError) {
    super(error.message);
    this.name = "SpaceApiError";
    this.code = error.code;
    this.status = status;
    this.details = error.details;
  }
}

// ─── Core Fetch ───────────────────────────────────────────────────────────────

let _isRefreshing = false;
let _refreshCallbacks: Array<(token: string | null) => void> = [];

function onRefreshed(token: string | null) {
  _refreshCallbacks.forEach((cb) => cb(token));
  _refreshCallbacks = [];
}

async function _doRefresh(): Promise<string | null> {
  const refreshToken = tokenStore.getRefresh();
  if (!refreshToken) return null;

  const resp = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!resp.ok) {
    tokenStore.clear();
    return null;
  }

  const data = await resp.json();
  tokenStore.setAccess(data.access_token);
  tokenStore.setRefresh(data.refresh_token);
  return data.access_token;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const token = tokenStore.getAccess();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const resp = await fetch(url, { ...options, headers });

  // ── 401 → silent refresh ──
  if (resp.status === 401 && path !== "/auth/refresh" && path !== "/auth/login") {
    if (_isRefreshing) {
      // Queue this request until refresh completes
      return new Promise((resolve, reject) => {
        _refreshCallbacks.push(async (newToken) => {
          if (!newToken) {
            reject(new SpaceApiError(401, { code: "SESSION_EXPIRED", message: "Session expired" }));
            return;
          }
          try {
            const result = await apiFetch<T>(path, options);
            resolve(result);
          } catch (e) {
            reject(e);
          }
        });
      });
    }

    _isRefreshing = true;
    const newToken = await _doRefresh().catch(() => null);
    _isRefreshing = false;
    onRefreshed(newToken);

    if (!newToken) {
      // Refresh failed — redirect to login
      window.location.href = "/login";
      throw new SpaceApiError(401, { code: "SESSION_EXPIRED", message: "Session expired. Please log in again." });
    }

    // Retry original request with new token
    const retryHeaders = { ...headers, Authorization: `Bearer ${newToken}` };
    const retryResp = await fetch(url, { ...options, headers: retryHeaders });
    if (!retryResp.ok) {
      await _throwApiError(retryResp);
    }
    return retryResp.json() as Promise<T>;
  }

  if (!resp.ok) {
    await _throwApiError(resp);
  }

  // 204 No Content
  if (resp.status === 204) return undefined as T;

  return resp.json() as Promise<T>;
}

async function _throwApiError(resp: Response): Promise<never> {
  let error: ApiError;
  try {
    const body = await resp.json();
    error = body.error ?? { code: "HTTP_ERROR", message: `HTTP ${resp.status}` };
  } catch {
    error = { code: "PARSE_ERROR", message: `HTTP ${resp.status}` };
  }
  throw new SpaceApiError(resp.status, error);
}

// ─── Convenience Methods ──────────────────────────────────────────────────────

export const api = {
  get: <T>(path: string) => apiFetch<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: "POST", body: JSON.stringify(body) }),
  delete: <T>(path: string) => apiFetch<T>(path, { method: "DELETE" }),
};
