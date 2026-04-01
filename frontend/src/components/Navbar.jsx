import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import "../css/navbar.css";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const avatarUrl = user?.picture || "/static/images/userimages/default-avatar.png";

  return (
    <nav className="navbar navbar-expand-md sticky-top" id="mainNavbar">
      <div className="container-nav">

        {/* Brand */}
        <Link className="navbar-brand" to="/dashboard">PRO ROOMS</Link>

        {/* Mobile Hamburger */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <i className="fas fa-bars"></i>
        </button>

        {/* Collapsible Area */}
        <div className="collapse navbar-collapse" id="navbarNav">
          {user ? (
            <div className="nav-user-controls">
              {/* Profile */}
              <Link className="user-profile-link" to={`/profile/${user.username}`}>
                <img
                  src={avatarUrl}
                  alt="avatar"
                  width={42}
                  height={42}
                  className="rounded-circle nav-avatar"
                />
                <span className="text-white fw-medium">{user.username || user.name || "Account"}</span>
              </Link>

              {/* Theme Toggle */}
              <i
                className={`fa-solid ${theme === "dark" ? "fa-sun" : "fa-moon"} cursor-pointer theme-toggle-btn`}
                onClick={() => toggleTheme(theme === "dark" ? "light" : "dark")}
                title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
              ></i>

              {/* Sign Out */}
              <button
                onClick={handleLogout}
                className="btn btn-link nav-link p-0 d-flex align-items-center sign-out-btn"
              >
                <i className="fas fa-sign-out-alt me-1"></i>
                <span>Sign out</span>
              </button>
            </div>
          ) : (
            <div className="nav-user-controls">
              {/* Theme Toggle */}
              <i
                className={`fa-solid ${theme === "dark" ? "fa-sun" : "fa-moon"} cursor-pointer theme-toggle-btn`}
                onClick={() => toggleTheme(theme === "dark" ? "light" : "dark")}
                title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
              ></i>

              <Link to="/login" className="nav-link text-white text-decoration-none">Login</Link>
              <Link to="/signup" className="btn btn-primary px-4 rounded-pill fw-bold">Sign Up</Link>
            </div>
          )}
        </div>

      </div>
    </nav>
  );
}
