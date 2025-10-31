import os
import secrets
from dotenv import load_dotenv
from authlib.integrations.flask_client import OAuth

# Load environment variables from .env file
load_dotenv()

class Config:
    """Flask application configuration"""

    # Flask secret key for session management
    SECRET_KEY = os.getenv("SECRET_KEY") or secrets.token_hex(16)

    # --- Database Configuration (MySQL) ---
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        "mysql+pymysql://root:root@localhost/rooms_db"  # fallback
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # --- Google OAuth credentials ---
    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")

    # --- Session Configuration ---
    SESSION_COOKIE_NAME = "google_sso_session"
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    PERMANENT_SESSION_LIFETIME = 86400  # 24 hours

    # Optional: enable for HTTPS production
    # SESSION_COOKIE_SECURE = True

    @staticmethod
    def validate():
        """Validate required configuration values"""
        if not Config.SQLALCHEMY_DATABASE_URI:
            raise ValueError("❌ DATABASE_URL is not set in environment variables")
        if not Config.GOOGLE_CLIENT_ID:
            raise ValueError("❌ GOOGLE_CLIENT_ID is not set in environment variables")
        if not Config.GOOGLE_CLIENT_SECRET:
            raise ValueError("❌ GOOGLE_CLIENT_SECRET is not set in environment variables")


# ---- OAuth configuration helper ----
def init_oauth(app):
    """Initialize and configure Google OAuth with Flask app."""
    oauth = OAuth(app)

    oauth.register(
        name="google",
        client_id=app.config["GOOGLE_CLIENT_ID"],
        client_secret=app.config["GOOGLE_CLIENT_SECRET"],
        server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
        client_kwargs={"scope": "openid email profile"},
    )

    return oauth
