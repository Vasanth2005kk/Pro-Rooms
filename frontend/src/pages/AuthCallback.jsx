/**
 * pages/AuthCallback.jsx
 * ───────────────────────
 * Handles the browser redirect from Flask after Google OAuth.
 * Flask redirects to: http://localhost:5173/auth/callback?token=<JWT>
 *
 * This page reads the token from the URL, stores it, fetches the user,
 * and navigates to the dashboard.
 */

import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../services/api";

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const { login }      = useAuth();
  const navigate       = useNavigate();

  useEffect(() => {
    const token = searchParams.get("token");
    const error = searchParams.get("error");

    if (error) {
      navigate(`/login?error=${encodeURIComponent(error)}`);
      return;
    }

    if (!token) {
      navigate("/login");
      return;
    }

    // Temporarily store the token so the API interceptor can use it for /auth/me
    localStorage.setItem("access_token", token);

    authAPI
      .getMe()
      .then(({ data }) => {
        login(token, data);
        navigate("/dashboard", { replace: true });
      })
      .catch(() => {
        localStorage.removeItem("access_token");
        navigate("/login?error=Google+authentication+failed");
      });
  }, []);

  return (
    <div className="global-loading">
      <div className="spinner" />
      <p style={{ marginTop: 16, color: "var(--text-secondary)" }}>
        Completing Google Sign-In…
      </p>
    </div>
  );
}
