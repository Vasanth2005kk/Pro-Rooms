import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../services/api";
import { TypeAnimation } from 'react-type-animation';


export default function SignupPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "", ConfirmPassword: "" });
  const [error, setError] = useState(null);
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
    if (form.password !== form.ConfirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError(null);

    // API expects c_password right now, so we map it over
    try {
      const { data } = await authAPI.signup({ ...form, c_password: form.ConfirmPassword });
      navigate(`/verify-otp?email=${encodeURIComponent(data.email)}`);
    } catch (err) {
      setError(err.response?.data?.error || "Signup failed. Please try again.");
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
              <span className="welcome-line-1">Join the</span>
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
              <h2>Create Account</h2>
              <h3>Start your journey</h3>
              <p className="auth-subtitle">Join the Pro Rooms community today</p>
            </div>

            {error && <div className="alert alert-danger p-2 mb-3">{error}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-input-group">
                <input
                  type="text"
                  name="username"
                  id="signup-username"
                  placeholder="johndoe"
                  required
                  autoComplete="username"
                  value={form.username}
                  onChange={handleChange}
                />
              </div>

              <div className="auth-input-group">
                <input
                  type="email"
                  name="email"
                  id="signup-email"
                  placeholder="john@example.com"
                  required
                  autoComplete="email"
                  value={form.email}
                  onChange={handleChange}
                />
              </div>

              <div className="auth-input-row" style={{ display: 'flex', gap: '10px' }}>
                <div className="auth-input-group m-0">
                  <input
                    type="password"
                    name="password"
                    id="signup-password"
                    placeholder="Password"
                    required
                    autoComplete="new-password"
                    value={form.password}
                    onChange={handleChange}
                  />
                </div>
                <div className="auth-input-group m-0">
                  <input
                    type="password"
                    name="ConfirmPassword"
                    id="signup-confirm"
                    placeholder="Confirm"
                    required
                    autoComplete="new-password"
                    value={form.ConfirmPassword}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <button type="submit" className="auth-btn-primary mt-3" id="signup-submit-btn" disabled={loading}>
                {loading ? "Signing up..." : "Sign Up"}
              </button>
            </form>

            <div className="auth-separator">
              <span>OR</span>
            </div>

            <a href="/api/auth/google" className="auth-google-btn" id="google-signup-btn">
              <img src="https://www.gstatic.com/images/branding/product/1x/googleg_48dp.png" width="20" height="20" alt="Google Logo" />
              Sign up with Google
            </a>

            <p className="auth-switch-link">
              Already have an account? <Link to="/login" id="goto-login">Login</Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
