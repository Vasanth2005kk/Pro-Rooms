"""
app.py
──────
Pro-Rooms Flask REST API — Application Factory.

All business logic lives in blueprints under routes/.
This file only wires extensions, blueprints, and error handlers.
"""

from flask import Flask, jsonify

from config     import Config
from extensions import cors, db, jwt, login_manager, migrate, oauth_client

# ── Import models so Flask-Migrate (Alembic) can detect the schema ────────────
from models.user       import User       # noqa: F401
from models.room       import Room       # noqa: F401
from models.message    import Message    # noqa: F401
from models.star_member import Star, Member  # noqa: F401

# ── Import blueprints ─────────────────────────────────────────────────────────
from routes.auth    import auth_bp
from routes.rooms   import rooms_bp
from routes.chat    import chat_bp
from routes.profile import profile_bp


def create_app(config_class=Config):
    """Application factory — creates and configures the Flask app."""
    app = Flask(__name__)
    app.config.from_object(config_class)
    config_class.validate()

    # ── Initialise extensions ────────────────────────────────────────────────
    db.init_app(app)
    migrate.init_app(app, db)

    # CORS: allow the React dev server to call any /api/* endpoint
    cors.init_app(app, resources={
        r"/api/*": {
            "origins":            app.config["CORS_ORIGINS"],
            "supports_credentials": True,  # Required for session (Google OAuth)
            "allow_headers":      ["Content-Type", "Authorization"],
            "methods":            ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        }
    })

    jwt.init_app(app)
    login_manager.init_app(app)

    # ── Google OAuth (needed for /api/auth/google redirect flow) ────────────
    oauth_client.init_app(app)
    if app.config.get("GOOGLE_CLIENT_ID"):
        oauth_client.register(
            name="google",
            client_id=app.config["GOOGLE_CLIENT_ID"],
            client_secret=app.config["GOOGLE_CLIENT_SECRET"],
            server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
            client_kwargs={"scope": "openid email profile"},
        )

    # ── Flask-Login user loader ──────────────────────────────────────────────
    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    # ── Register blueprints ──────────────────────────────────────────────────
    app.register_blueprint(auth_bp,    url_prefix="/api/auth")
    app.register_blueprint(rooms_bp,   url_prefix="/api/rooms")
    app.register_blueprint(chat_bp,    url_prefix="/api/chat")
    app.register_blueprint(profile_bp, url_prefix="/api/profile")

    # ── Global error handlers (JSON responses, no HTML) ─────────────────────
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Resource not found"}), 404

    @app.errorhandler(403)
    def forbidden(e):
        return jsonify({"error": "Forbidden"}), 403

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({"error": "Internal server error"}), 500

    # ── JWT error handlers ───────────────────────────────────────────────────
    @jwt.unauthorized_loader
    def missing_token(reason):
        return jsonify({"error": f"Missing token: {reason}"}), 401

    @jwt.invalid_token_loader
    def invalid_token(reason):
        return jsonify({"error": f"Invalid token: {reason}"}), 422

    @jwt.expired_token_loader
    def expired_token(jwt_header, jwt_data):
        return jsonify({"error": "Token has expired. Please log in again."}), 401

    return app


# ── Entry-point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    app = create_app()
    with app.app_context():
        db.create_all()
        print("✅ Database tables verified.")
    app.run(port=5000, debug=True)
