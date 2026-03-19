import { Link, useNavigate } from "react-router-dom";
import "../css/notfound.css";

export default function NotFoundPage() {
    const navigate = useNavigate();
    return (
        <>
            <div className="background-shapes">
                <div className="shape shape-1"></div>
                <div className="shape shape-2"></div>
            </div>

            <div className="container">
                <div className="error-container">
                    <h1 className="error-code">404</h1>
                    <h2 className="error-message">Oops! Room Not Found</h2>
                    <p className="error-description">
                        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
                        Or maybe the user doesn't exist yet!
                    </p>
                    <div className="d-flex gap-3 mt-4">
                        <Link to="/dashboard" className="glass-btn">
                            <i className="fas fa-home"></i> Back to Dashboard
                        </Link>
                        <a href="#" onClick={(e) => { e.preventDefault(); navigate(-1); }} className="glass-btn">
                            <i className="fas fa-arrow-left"></i> Go Back
                        </a>
                    </div>
                </div>
            </div>
        </>
    );
}
