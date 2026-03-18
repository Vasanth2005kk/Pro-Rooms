import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../css/navbar.css";

export default function Navbar() {
  const { user, logout } = useAuth();
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

          {user && (
            <div className="nav-actions d-flex align-items-center">
              <div className="dropdown">
                <div
                  className="d-flex align-items-center gap-2"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <img
                    src={avatarUrl}
                    alt="avatar"
                    width={32}
                    height={32}
                    className="rounded-circle nav-avatar"
                  />
                  <span>{user.username || user.name || "Account"}</span>
                  <i className="fas fa-chevron-down small text-muted"></i>
                </div>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li>
                    <Link className="dropdown-item" to={`/profile/${user.username}`}>
                      <i className="fas fa-user-circle me-2 text-muted"></i> Profile
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" to="#">
                      <i className="fas fa-cog me-2 text-muted"></i> Settings
                    </Link>
                  </li>
                  <li>
                    <hr className="dropdown-divider" />
                  </li>
                  <li>
                    <button className="dropdown-item bg-transparent border-0 w-100 text-start" onClick={handleLogout}>
                      <i className="fas fa-sign-out-alt me-2 text-muted"></i> Sign out
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
