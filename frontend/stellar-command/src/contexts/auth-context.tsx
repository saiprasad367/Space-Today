"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getMe,
  googleLogin as apiGoogleLogin,
  login as apiLogin,
  logout as apiLogout,
  signup as apiSignup,
  refreshTokens,
} from "@/lib/api/auth";
import { tokenStore } from "@/lib/api/client";
import type { User, LoginData, SignupData } from "@/lib/api/auth";

// ─── Context Types ────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginData) => Promise<User>;
  signup: (data: SignupData) => Promise<User>;
  loginWithGoogle: () => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();
  const initialized = useRef(false);

  // On app load: attempt to restore session via refresh token → /auth/me
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    async function restoreSession() {
      const refreshToken = tokenStore.getRefresh();
      if (!refreshToken) {
        setIsLoading(false);
        return;
      }

      try {
        // Try to get a new access token using stored refresh token
        await refreshTokens();
        const me = await getMe();
        setUser(me);
      } catch {
        // Refresh failed — clear and require login
        tokenStore.clear();
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, []);

  const login = useCallback(async (data: LoginData): Promise<User> => {
    const resp = await apiLogin(data);
    setUser(resp.user);
    return resp.user;
  }, []);

  const signup = useCallback(async (data: SignupData): Promise<User> => {
    const resp = await apiSignup(data);
    setUser(resp.user);
    return resp.user;
  }, []);

  const loginWithGoogle = useCallback(async (): Promise<User> => {
    const resp = await apiGoogleLogin();
    setUser(resp.user);
    return resp.user;
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
    // Clear all cached NASA data and favorites on logout
    queryClient.clear();
  }, [queryClient]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: user !== null,
        login,
        signup,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
