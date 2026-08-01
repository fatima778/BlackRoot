import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { api, CurrentUser } from "../api/client";

interface AuthContextValue {
  user: CurrentUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  /** Returns the one-time recovery code the caller must display to the user. */
  register: (alias: string, email: string, password: string, activationCode?: string) => Promise<string>;
  logout: () => Promise<void>;
  requestVerification: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const res = await api.get<{ user: CurrentUser }>("/auth/me");
      setUser(res.data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<{ user: CurrentUser }>("/auth/login", { email, password });
    setUser(res.data.user);
  }, []);

  const register = useCallback(
    async (alias: string, email: string, password: string, activationCode?: string) => {
      const res = await api.post<{ user: CurrentUser; recoveryCode: string }>("/auth/register", {
        alias,
        email,
        password,
        activationCode,
      });
      setUser(res.data.user);
      return res.data.recoveryCode;
    },
    [],
  );

  const logout = useCallback(async () => {
    await api.post("/auth/logout");
    setUser(null);
  }, []);

  const requestVerification = useCallback(async () => {
    const res = await api.post<{ user: CurrentUser }>("/auth/verify", { agreedToRules: true });
    setUser((prev) => (prev ? { ...prev, role: res.data.user.role } : res.data.user));
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, requestVerification }),
    [user, loading, login, register, logout, requestVerification],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
