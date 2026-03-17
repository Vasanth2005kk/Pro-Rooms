import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../services/api";
import { TypeAnimation } from 'react-type-animation';
import "../css/auth.css";

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [error, setError] = useState(searchParams.get("error") || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data } = await authAPI.login(form);
      login(data.access_token, data.user);
      navigate("/dashboard");
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.requires_verification) {
        navigate(`/verify-otp?email=${encodeURIComponent(err.response.data.email)}`);
        return;
      }
      setError(err.response?.data?.error || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page-main">
      <div className="auth-container">
        {/* Left Panel */}
        <div className="auth-left">
          <div className="auth-left-content">
            <div className="auth-welcome-text">
              <span className="welcome-line-1">Welcome to</span>
              <span className="welcome-line-2">
                <TypeAnimation
                  sequence={[
                    "Pro Room's Application",
                    5000,
                  ]}
                  wrapper="span"
                  cursor={false}
                  repeat={Infinity}
                />
              </span>

            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="auth-right">
          <div className="auth-form-wrapper">
            <div className="auth-heading">
              <h2>Welcome back!</h2>
              <h3>Login to your account</h3>
              <p className="auth-subtitle">Let's enter again, share the creativity's</p>
            </div>

            {error && <div className="alert alert-danger p-2 mb-3">{error}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-input-group">
                <input
                  type="text"
                  name="identifier"
                  id="login-identifier"
                  placeholder="Username or Email"
                  required
                  autoComplete="username"
                  value={form.identifier}
                  onChange={handleChange}
                />
              </div>

              <div className="auth-input-group">
                <input
                  type="password"
                  name="password"
                  id="login-password"
                  placeholder="Password"
                  required
                  autoComplete="current-password"
                  value={form.password}
                  onChange={handleChange}
                />
              </div>

              <div className="auth-form-footer">
                <div className="auth-remember">
                  <input type="checkbox" id="rememberMe" name="rememberMe" />
                  <label htmlFor="rememberMe">Remember me</label>
                </div>
                <a href="#" className="auth-forgot">Forgot password?</a>
              </div>

              <button type="submit" className="auth-btn-primary" id="login-submit-btn" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>

            <div className="auth-separator">
              <span>OR</span>
            </div>

            <a href="/api/auth/google" className="auth-google-btn" id="google-login-btn">
              <img src="https://www.gstatic.com/images/branding/product/1x/googleg_48dp.png" width="20" height="20" alt="Google Logo" />
              Continue with Google
            </a>

            <p className="auth-switch-link">
              Don't have an account? <Link to="/signup" id="goto-signup">Sign up</Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
