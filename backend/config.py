"""
config.py
─────────
Flask application configuration loaded from environment variables.
Extends the original rooms/Config.py with JWT + CORS settings
required for the React frontend decoupling.
"""

import os
import secrets
from dotenv import load_dotenv
from urllib.parse import quote_plus

env_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


load_dotenv(dotenv_path=os.path.join(env_path, ".env"))
 
class Config:
    """Flask application configuration."""

    # ── Flask secret key for session management ──────────────────────────────
    SECRET_KEY = os.getenv("SECRET_KEY") or secrets.token_hex(32)

    # ── JWT (new — required for stateless React auth) ────────────────────────
    JWT_SECRET_KEY           = os.getenv("JWT_SECRET_KEY") or secrets.token_hex(32)
    JWT_ACCESS_TOKEN_EXPIRES = int(os.getenv("JWT_EXPIRES", 86400))  # 24 hours
    JWT_TOKEN_LOCATION       = ["headers"]

    # ── Database Configuration (PostgreSQL via psycopg2) ─────────────────────
    _db_user     = os.getenv("DB_USER",     "postgres")
    _db_password = os.getenv("DB_PASSWORD", "postgres")
    _db_host     = os.getenv("DB_HOST",     "localhost")
    _db_port     = os.getenv("DB_PORT",     "5432")
    _db_name     = os.getenv("DB_NAME",     "rooms_db")
    
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        f"postgresql+psycopg2://{_db_user}:{quote_plus(_db_password)}@{_db_host}:{_db_port}/{_db_name}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # ── Google OAuth credentials ──────────────────────────────────────────────
    GOOGLE_CLIENT_ID     = os.getenv("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")

    # ── CORS (new — allowlist the React dev server) ───────────────────────────
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")

    # ── Session (kept for Google OAuth redirect flow) ────────────────────────
    SESSION_COOKIE_NAME      = "prorooms_session"
    SESSION_COOKIE_HTTPONLY  = True
    SESSION_COOKIE_SAMESITE  = "Lax"
    PERMANENT_SESSION_LIFETIME = 86400  # 24 hours

    @staticmethod
    def validate():
        """Validate optional but important config at startup."""
        if not Config.GOOGLE_CLIENT_ID or not Config.GOOGLE_CLIENT_SECRET:
            print(
                "⚠️  Warning: Google OAuth credentials missing "
                "(GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET). "
                "Google Login will not function."
            )
