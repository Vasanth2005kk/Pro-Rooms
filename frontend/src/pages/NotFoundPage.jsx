import { Link, useNavigate } from "react-router-dom";

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <>
      <style>{`
        .error-container {
            height: 80vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            perspective: 1000px;
        }

        .error-code {
            font-size: 15rem;
            font-weight: 900;
            background: linear-gradient(135deg, var(--primary) 0%, #fff 100%);
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
            line-height: 1;
            margin-bottom: 0;
            animation: float 6s ease-in-out infinite, glow 3s ease-in-out infinite alternate;
            filter: drop-shadow(0 0 30px rgba(0, 255, 136, 0.3));
        }

        .error-message {
            font-size: 2rem;
            color: #fff;
            margin-bottom: 2rem;
            font-weight: 300;
            letter-spacing: 2px;
            opacity: 0;
            animation: fadeIn 1s ease-out 0.5s forwards;
        }

        .error-description {
            color: var(--text-muted);
            max-width: 500px;
            margin-bottom: 3rem;
            font-size: 1.1rem;
            opacity: 0;
            animation: fadeIn 1s ease-out 1s forwards;
        }

        .glass-btn {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            padding: 1rem 2.5rem;
            border-radius: 50px;
            color: #fff;
            text-decoration: none;
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            display: inline-flex;
            align-items: center;
            gap: 10px;
            opacity: 0;
            animation: fadeIn 1s ease-out 1.5s forwards;
        }

        .glass-btn:hover {
            background: var(--primary);
            color: #000;
            transform: translateY(-5px) scale(1.05);
            box-shadow: 0 10px 30px rgba(0, 255, 136, 0.4);
        }

        @keyframes float {
            0%,
            100% {
                transform: translateY(0) rotateX(0deg);
            }
            50% {
                transform: translateY(-30px) rotateX(10deg);
            }
        }

        @keyframes glow {
            from {
                filter: drop-shadow(0 0 20px rgba(0, 255, 136, 0.2));
            }
            to {
                filter: drop-shadow(0 0 40px rgba(0, 255, 136, 0.5));
            }
        }

        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .background-shapes {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: -1;
            overflow: hidden;
        }

        .shape {
            position: absolute;
            border-radius: 50%;
            filter: blur(80px);
            opacity: 0.15;
        }

        .shape-1 {
            width: 500px;
            height: 500px;
            background: var(--primary);
            top: -10%;
            right: -10%;
            animation: move 20s linear infinite;
        }

        .shape-2 {
            width: 400px;
            height: 400px;
            background: #00f2fe;
            bottom: -10%;
            left: -10%;
            animation: move 25s linear infinite reverse;
        }

        @keyframes move {
            0% {
                transform: translate(0, 0);
            }
            50% {
                transform: translate(100px, 50px);
            }
            100% {
                transform: translate(0, 0);
            }
        }
      `}</style>

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
