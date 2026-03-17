"""
routes/auth.py
──────────────
Authentication blueprint. Registered at /api/auth/*.

Replaces all auth routes from the original monolithic app.py:
  POST /api/auth/login       ← was GET+POST /login
  POST /api/auth/signup      ← was GET+POST /signup
  POST /api/auth/verify_otp  ← was GET+POST /verify_otp
  POST /api/auth/resend_otp  ← was POST /resend_otp
  GET  /api/auth/google      ← was GET /auth/google
  GET  /api/auth/google/callback ← was GET /auth/google/callback
  POST /api/auth/logout      ← was GET /logout
  GET  /api/auth/me          ← NEW: fetch current user info from JWT
"""

import hashlib
import random
import urllib.parse
from datetime import datetime

from authlib.integrations.base_client.errors import OAuthError
from flask import Blueprint, jsonify, redirect, request, session, url_for
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required

from config import Config
from extensions import db, oauth_client
from models.user import User

auth_bp = Blueprint("auth", __name__)

# React dev server base URL — override via REACT_BASE_URL env var in production
REACT_BASE_URL = "http://localhost:5173"


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/auth/login
# ─────────────────────────────────────────────────────────────────────────────
@auth_bp.route("/login", methods=["POST"])
def login():
    """
    Authenticate with username/email + password.
    Returns a JWT access token on success.
    If email is unverified, triggers the OTP flow instead.
    """
    data       = request.get_json()
    identifier = data.get("identifier", "").strip()
    password   = data.get("password",   "").strip()

    if not identifier or not password:
        return jsonify({"error": "Username/email and password are required"}), 400

    user = User.query.filter(
        (User.username == identifier) | (User.email == identifier)
    ).first()

    if not user or not user.password:
        return jsonify({"error": "Invalid credentials or SSO-only account"}), 401

    hashed_input = hashlib.sha256(password.encode()).hexdigest()
    if hashed_input != user.password:
        return jsonify({"error": "Incorrect password"}), 401

    # Account exists but email not verified — restart OTP flow
    if not user.is_verified:
        otp = str(random.randint(100000, 999999))
        session["otp"]               = otp
        session["user_id_to_verify"] = user.id
        print(f"DEBUG OTP for {user.email}: {otp}")
        return jsonify({
            "requires_verification": True,
            "email":   user.email,
            "message": "Email not verified. OTP sent to your email.",
        }), 403

    # Issue JWT
    access_token = create_access_token(identity=str(user.id))
    return jsonify({
        "access_token": access_token,
        "user":         user.to_dict(),
    }), 200


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/auth/signup
# ─────────────────────────────────────────────────────────────────────────────
@auth_bp.route("/signup", methods=["POST"])
def signup():
    """
    Register a new local user.
    On success, stores an OTP in the session and tells the client to
    redirect to the OTP verification page.
    """
    data       = request.get_json()
    username   = data.get("username",   "").strip()
    email      = data.get("email",      "").strip()
    password   = data.get("password",   "").strip()
    c_password = data.get("c_password", "").strip()

    if not username or not email or not password:
        return jsonify({"error": "All fields are required"}), 400

    if password != c_password:
        return jsonify({"error": "Passwords do not match"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "An account with that email already exists"}), 409

    hashed   = hashlib.sha256(password.encode()).hexdigest()
    new_user = User(
        username=username, email=email,
        password=hashed, is_verified=False
    )
    db.session.add(new_user)
    db.session.commit()

    # Generate & store OTP (in production: send via email)
    otp = str(random.randint(100000, 999999))
    session["otp"]               = otp
    session["user_id_to_verify"] = new_user.id
    print(f"DEBUG OTP for {email}: {otp}")

    return jsonify({
        "message": "Account created! OTP sent to your email.",
        "email":   email,
    }), 201


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/auth/verify_otp
# ─────────────────────────────────────────────────────────────────────────────
@auth_bp.route("/verify_otp", methods=["POST"])
def verify_otp():
    """
    Verify the 6-digit OTP stored in the server session.
    Returns a JWT on success.
    """
    data         = request.get_json()
    print(data)
    otp_received = data.get("otp", "").strip()
    otp_stored   = session.get("otp")
    user_id      = session.get("user_id_to_verify")

    if not user_id:
        return jsonify({"error": "Session expired. Please log in or sign up again."}), 400

    if otp_received != otp_stored:
        return jsonify({"error": "Invalid OTP. Please try again."}), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    user.is_verified = True
    db.session.commit()
    session.pop("otp",               None)
    session.pop("user_id_to_verify", None)

    access_token = create_access_token(identity=str(user.id))
    return jsonify({
        "access_token": access_token,
        "user":         user.to_dict(),
    }), 200


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/auth/resend_otp
# ─────────────────────────────────────────────────────────────────────────────
@auth_bp.route("/resend_otp", methods=["POST"])
def resend_otp():
    """Re-generate and (debug-)print a new OTP for the pending user."""
    user_id = session.get("user_id_to_verify")
    if not user_id:
        return jsonify({"error": "Session expired"}), 400

    otp = str(random.randint(100000, 999999))
    session["otp"] = otp

    user = User.query.get(user_id)
    print(f"DEBUG Resent OTP for {user.email}: {otp}")
    return jsonify({"message": "New OTP sent to your email"}), 200


# ─────────────────────────────────────────────────────────────────────────────
# Google OAuth  (browser-redirect flow — these two routes must stay redirect-based)
# GET  /api/auth/google
# GET  /api/auth/google/callback
# ─────────────────────────────────────────────────────────────────────────────
@auth_bp.route("/google")
def google_login():
    """Redirect the browser to Google's OAuth consent screen."""
    if not Config.GOOGLE_CLIENT_ID:
        return jsonify({"error": "Google Login is not configured on this server"}), 503
    redirect_uri = url_for("auth.google_callback", _external=True)
    return oauth_client.google.authorize_redirect(redirect_uri)


@auth_bp.route("/google/callback")
def google_callback():
    """
    Process the token returned by Google, create/update the user,
    issue a JWT, then redirect the browser back to the React app
    with the token embedded in the URL: /auth/callback?token=<JWT>
    """
    try:
        token     = oauth_client.google.authorize_access_token()
        user_info = token.get("userinfo")

        if not user_info:
            return _redirect_error("Failed to fetch user info from Google")

        google_id = user_info["sub"]
        email     = user_info["email"]
        name      = user_info.get("name")
        picture   = user_info.get("picture")

        user = User.query.filter_by(email=email).first()
        if user:
            user.google_id  = google_id
            user.last_login = datetime.utcnow()
            user.name       = name
            if not user.picture:
                user.picture = picture
        else:
            user = User(
                google_id=google_id, email=email, name=name,
                picture=picture, last_login=datetime.utcnow(),
                is_verified=True  # Google accounts are pre-verified
            )
            db.session.add(user)

        db.session.commit()

        access_token = create_access_token(identity=str(user.id))
        return redirect(f"{REACT_BASE_URL}/auth/callback?token={access_token}")

    except OAuthError as e:
        return _redirect_error(str(e))
    except Exception as e:
        print(f"[google_callback] Unexpected error: {e}")
        return _redirect_error(f"Authentication failed: {str(e)}")


def _redirect_error(msg: str):
    """Redirect back to the React login page with an error query param."""
    return redirect(f"{REACT_BASE_URL}/login?error={urllib.parse.quote(msg)}")


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/auth/logout
# ─────────────────────────────────────────────────────────────────────────────
@auth_bp.route("/logout", methods=["POST"])
def logout():
    """
    JWT is stateless — the client simply discards the stored token.
    This endpoint exists so the client has a clean API contract.
    """
    return jsonify({"message": "Logged out successfully"}), 200


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/auth/me
# ─────────────────────────────────────────────────────────────────────────────
@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_me():
    """Return the currently authenticated user's profile from the JWT identity."""
    user_id = get_jwt_identity()
    user    = User.query.get(int(user_id))
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify(user.to_dict()), 200
