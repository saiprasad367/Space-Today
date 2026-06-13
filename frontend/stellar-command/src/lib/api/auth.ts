import { api, apiFetch, tokenStore } from "./client";

export interface SignupData {
  name: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export async function signup(data: SignupData): Promise<AuthResponse> {
  const resp = await api.post<AuthResponse>("/auth/signup", data);
  tokenStore.setAccess(resp.access_token);
  tokenStore.setRefresh(resp.refresh_token);
  return resp;
}

export async function login(data: LoginData): Promise<AuthResponse> {
  const resp = await api.post<AuthResponse>("/auth/login", data);
  tokenStore.setAccess(resp.access_token);
  tokenStore.setRefresh(resp.refresh_token);
  return resp;
}

export async function logout(): Promise<void> {
  const refreshToken = tokenStore.getRefresh();
  try {
    await api.post("/auth/logout", { refresh_token: refreshToken });
  } catch {
    // Swallow errors — always clear local state
  } finally {
    tokenStore.clear();
  }
}

export async function getMe(): Promise<User> {
  return api.get<User>("/auth/me");
}

export async function refreshTokens(): Promise<TokenResponse> {
  const refreshToken = tokenStore.getRefresh();
  if (!refreshToken) throw new Error("No refresh token");
  const resp = await api.post<TokenResponse>("/auth/refresh", { refresh_token: refreshToken });
  tokenStore.setAccess(resp.access_token);
  tokenStore.setRefresh(resp.refresh_token);
  return resp;
}

// ─── Google OAuth (popup flow) ────────────────────────────────────────────────

function getGoogleRedirectUri(): string {
  return `${window.location.origin}/auth/google/callback`;
}

export async function googleLogin(): Promise<AuthResponse> {
  const redirectUri = getGoogleRedirectUri();

  // 1. Get Google consent URL from backend
  const { url, code_verifier } = await apiFetch<{ url: string; code_verifier: string; state: string }>(
    `/auth/google/url?redirect_uri=${encodeURIComponent(redirectUri)}`,
  );

  // 2. Open popup centered on screen
  return new Promise((resolve, reject) => {
    const width = 500;
    const height = 620;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      url,
      "google_oauth",
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes`,
    );

    if (!popup) {
      reject(new Error("Popup blocked — please allow popups for this site."));
      return;
    }

    let timer: any = null;

    // Use BroadcastChannel to handle browser COOP security issues (window.opener = null)
    const channel = new BroadcastChannel("google_oauth_channel");

    const cleanup = () => {
      channel.close();
      if (timer) clearTimeout(timer);
    };

    channel.onmessage = (event) => {
      const { code, error } = event.data as { code?: string; error?: string };
      cleanup();

      if (error || !code) {
        reject(new Error(error || "Google sign-in was cancelled."));
        return;
      }

      // 4. Exchange code for Space Today tokens
      apiFetch<AuthResponse>("/auth/google/token", {
        method: "POST",
        body: JSON.stringify({ code, redirect_uri: redirectUri, code_verifier }),
      })
        .then((resp) => {
          tokenStore.setAccess(resp.access_token);
          tokenStore.setRefresh(resp.refresh_token);
          resolve(resp);
        })
        .catch(reject);
    };

    // Safety timeout of 5 minutes to automatically clean up listeners
    timer = setTimeout(() => {
      cleanup();
      reject(new Error("Google sign-in timed out."));
    }, 5 * 60 * 1000);
  });
}
