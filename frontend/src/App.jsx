import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";


import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import OtpVerifyPage from "./pages/OtpVerifyPage";
import AuthCallback from "./pages/AuthCallback";
import DashboardPage from "./pages/DashboardPage";
import ChatPage from "./pages/ChatPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import NotFoundPage from "./pages/NotFoundPage";

/** Wraps protected routes: shows spinner while loading, redirects if not authed. */
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="global-loading">
        <div className="spinner" />
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>

      <BrowserRouter>
        <Routes>
          {/* ── Public routes ──────────────────────────────────────────── */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/verify-otp" element={<OtpVerifyPage />} />
          {/* Google OAuth lands here after Flask redirect */}
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* ── Protected routes ───────────────────────────────────────── */}
          <Route path="/" element={
            <PrivateRoute><DashboardPage /></PrivateRoute>
          } />
          <Route path="/dashboard" element={
            <PrivateRoute><DashboardPage /></PrivateRoute>
          } />
          <Route path="/chat/:roomId" element={
            <PrivateRoute><ChatPage /></PrivateRoute>
          } />
          <Route path="/profile/:username" element={
            <PrivateRoute><ProfilePage /></PrivateRoute>
          } />
          <Route path="/chat/:roomId/settings" element={
            <PrivateRoute><SettingsPage /></PrivateRoute>
          } />

          {/* ── 404 ────────────────────────────────────────────────────── */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </ThemeProvider>
  );
}
