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
      <div className="container">
        <Link className="navbar-brand" to="/dashboard">PRO ROOMS</Link>

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

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            {/* <li className="nav-item">
              <Link className="nav-link" to="/dashboard">
                <i className="fas fa-th-large me-1"></i> Dashboard
              </Link>
            </li> */}
          </ul>

          {user ? (
            <div className="nav-actions d-flex align-items-center gap-3">
              <Link className="d-flex align-items-center gap-2 text-decoration-none" to={`/profile/${user.username}`}>
                <img
                  src={avatarUrl}
                  alt="avatar"
                  width={32}
                  height={32}
                  className="rounded-circle nav-avatar"
                />
                <span className="text-white fw-medium d-none d-sm-inline">{user.username || user.name || "Account"}</span>
              </Link>
              
              <div className="nav-icons d-flex align-items-center gap-3 ms-2">
                <i 
                  className={`fa-solid ${theme === "dark" ? "fa-sun" : "fa-moon"} cursor-pointer theme-toggle-btn`} 
                  onClick={() => toggleTheme(theme === "dark" ? "light" : "dark")}
                  title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
                ></i>


                <button 
                  onClick={handleLogout}
                  className="btn btn-link nav-link p-0 d-flex align-items-center sign-out-btn"
                >
                  <i className="fas fa-sign-out-alt me-2"></i>
                  <span className="d-none d-sm-inline">Sign out</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="nav-actions d-flex align-items-center gap-3">
              <div className="nav-icons d-flex align-items-center gap-3 me-2">
                <i 
                  className={`fa-solid ${theme === "dark" ? "fa-sun" : "fa-moon"} cursor-pointer theme-toggle-btn`} 
                  onClick={() => toggleTheme(theme === "dark" ? "light" : "dark")}
                  title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
                ></i>
              </div>


              <Link to="/login" className="nav-link text-white text-decoration-none">Login</Link>
              <Link to="/signup" className="btn btn-primary px-4 rounded-pill fw-bold">Sign Up</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
