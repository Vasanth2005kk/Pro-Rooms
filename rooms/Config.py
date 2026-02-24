"""
rooms/Config.py
───────────────
Flask application configuration loaded from environment variables.
"""

import os
import secrets
from dotenv import load_dotenv
from authlib.integrations.flask_client import OAuth

# Load environment variables from .env file
load_dotenv()


class Config:
    """Flask application configuration"""

    # ── Flask secret key for session management ──────────────────────────────
    SECRET_KEY = os.getenv("SECRET_KEY") or secrets.token_hex(32)

    # ── Database Configuration (PostgreSQL via psycopg2) ─────────────────────
    _db_host     = os.getenv("DB_HOST",     "localhost")
    _db_port     = os.getenv("DB_PORT",     "5432")
    _db_user     = os.getenv("DB_USER",     "postgres")
    _db_password = os.getenv("DB_PASSWORD", "postgres")
    _db_name     = os.getenv("DB_NAME",     "rooms_db")

    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        f"postgresql+psycopg2://{_db_user}:{_db_password}@{_db_host}:{_db_port}/{_db_name}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # ── Google OAuth credentials ──────────────────────────────────────────────
    GOOGLE_CLIENT_ID     = os.getenv("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")

    # ── Session Configuration ─────────────────────────────────────────────────
    SESSION_COOKIE_NAME     = "prorooms_session"
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    PERMANENT_SESSION_LIFETIME = 86400  # 24 hours

    # Uncomment in production (HTTPS only)
    # SESSION_COOKIE_SECURE = True

    @staticmethod
    def validate():
        """Validate required configuration values at startup."""
        missing = []
        if not Config.GOOGLE_CLIENT_ID:
            missing.append("GOOGLE_CLIENT_ID")
        if not Config.GOOGLE_CLIENT_SECRET:
            missing.append("GOOGLE_CLIENT_SECRET")
        if missing:
            print(f"⚠️ Warning: Google OAuth credentials missing ({', '.join(missing)}). "
                  "Google Login will not function.")


# ── OAuth configuration helper ────────────────────────────────────────────────
def init_oauth(app):
    """Initialize and configure Google OAuth with the Flask app."""
    oauth = OAuth(app)
    oauth.register(
        name="google",
        client_id=app.config["GOOGLE_CLIENT_ID"],
        client_secret=app.config["GOOGLE_CLIENT_SECRET"],
        server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
        client_kwargs={"scope": "openid email profile"},
    )
    return oauth
