/**
 * context/AuthContext.jsx
 * ────────────────────────
 * Global authentication state provider.
 *
 * - On mount, tries to restore the user from the stored JWT via GET /api/auth/me
 * - Exposes login(token, user), logout() helpers to all children
 * - PrivateRoute in App.jsx uses this context to guard protected routes
 */

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { authAPI } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Restore session on full-page refresh ────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setLoading(false);
      return;
    }

    authAPI
      .getMe()
      .then(({ data }) => setUser(data))
      .catch(() => {
        // Token is invalid / expired — clear it
        localStorage.removeItem("access_token");
      })
      .finally(() => setLoading(false));
  }, []);

  /** Store token and update user state after a successful login/signup. */
  const login = useCallback((token, userData) => {
    localStorage.setItem("access_token", token);
    setUser(userData);
  }, []);

  /** Clear token and user state on logout. */
  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch {
      // Ignore logout errors — token is client-side anyway
    }
    localStorage.removeItem("access_token");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Convenience hook — use this in any component. */
export const useAuth = () => useContext(AuthContext);
