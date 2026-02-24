"""
app.py
──────
Pro-Rooms Flask application entry-point.

Routes:
    GET  /  or  /login   → Login page
    POST /login           → Authenticate local user
    GET  /signup          → Registration page
    POST /signup          → Create new local user
    GET  /auth/google     → Redirect to Google OAuth
    GET  /auth/google/callback → Process Google OAuth token
    GET  /dashboard       → Main chat page (auth required)
    GET  /logout          → Clear session
"""

import hashlib
import secrets

import psycopg2
import psycopg2.extras
from authlib.integrations.base_client.errors import OAuthError
from datetime import datetime
from dotenv import load_dotenv
from flask import (
    Flask, flash, jsonify, redirect,
    render_template, request, session, url_for
)
from flask_login import (
    LoginManager, login_user, logout_user, 
    login_required, current_user
)

from rooms.Config import Config, init_oauth
from rooms.Models import db, get_db_connection, User, Room, Message

# ── App Initialisation ────────────────────────────────────────────────────────
load_dotenv()

app = Flask(__name__)
app.config.from_object(Config)
Config.validate()

app.secret_key = Config.SECRET_KEY

# Initialise SQLAlchemy
db.init_app(app)

# Initialise Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = "login"

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Initialise Google OAuth
oauth  = init_oauth(app)
google = oauth.google


# ─────────────────────────────────────────────────────────────────────────────
# LOGIN
# ─────────────────────────────────────────────────────────────────────────────
@app.route("/")
@app.route("/login", methods=["GET", "POST"])
def login():
    """Handle local username/email + password login."""
    if current_user.is_authenticated:
        return redirect(url_for("dashboard"))

    if request.method == "POST":
        identifier = request.form.get("identifier", "").strip()
        password   = request.form.get("password",   "").strip()

        if not identifier or not password:
            flash("Please enter your username/email and password ❗", "error")
            return redirect(url_for("login"))

        user = User.query.filter((User.username == identifier) | (User.email == identifier)).first()
        print(user)
        if not user or not user.password:
            flash("Invalid credentials or SSO-only account 📧", "error")
            return redirect(url_for("login"))

        hashed_input = hashlib.sha256(password.encode()).hexdigest()
        if hashed_input == user.password:
            login_user(user)
            flash(f"Welcome back, {user.username or user.name} 👋", "success")
            return redirect(url_for("dashboard"))
        else:
            flash("Incorrect password ❌", "error")

    return render_template("login.html")


# ─────────────────────────────────────────────────────────────────────────────
# SIGNUP
# ─────────────────────────────────────────────────────────────────────────────
@app.route("/signup", methods=["GET", "POST"])
def signup():
    """Handle new user registration."""
    if current_user.is_authenticated:
        return redirect(url_for("dashboard"))

    if request.method == "POST":
        username   = request.form.get("username",        "").strip()
        email      = request.form.get("email",           "").strip()
        password   = request.form.get("password",        "").strip()
        c_password = request.form.get("ConfirmPassword", "").strip()

        if not username or not email or not password:
            flash("All fields are required ❗", "error")
            return redirect(url_for("signup"))

        if password != c_password:
            flash("Passwords do not match ⚠️", "error")
            return redirect(url_for("signup", username=username, email=email))

        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            flash("An account with that email already exists 📧", "error")
            return redirect(url_for("signup", username=username))

        hashed = hashlib.sha256(password.encode()).hexdigest()
        new_user = User(
            username=username,
            email=email,
            password=hashed
        )
        db.session.add(new_user)
        db.session.commit()

        flash("Account created successfully ✅ Please log in.", "success")
        return redirect(url_for("login"))

    username = request.args.get("username", "")
    email    = request.args.get("email",    "")
    return render_template("signup.html", username=username, email=email)


# ─────────────────────────────────────────────────────────────────────────────
# GOOGLE OAUTH
# ─────────────────────────────────────────────────────────────────────────────
@app.route("/auth/google")
def google_login():
    """Redirect user to Google's OAuth consent screen."""
    if not Config.GOOGLE_CLIENT_ID:
        flash("Google Login is not configured on this server 🛑", "error")
        return redirect(url_for("login"))
    redirect_uri = url_for("google_callback", _external=True)
    return google.authorize_redirect(redirect_uri)


@app.route("/auth/google/callback")
def google_callback():
    """Process the token returned by Google and create/update the user record."""
    try:
        token     = google.authorize_access_token()
        user_info = token.get("userinfo")

        if not user_info:
            flash("Failed to fetch user info from Google 😞", "error")
            return redirect(url_for("login"))

        google_id = user_info.get("sub")
        email     = user_info.get("email")
        name      = user_info.get("name")
        picture   = user_info.get("picture")

        user = User.query.filter_by(email=email).first()

        if user:
            # Update existing user with Google details
            user.google_id = google_id
            user.last_login = datetime.utcnow()
            user.name = name
            if not user.picture:
                user.picture = picture
            db.session.commit()
            login_user(user)
            flash(f"Welcome back, {user.name or user.username}! 👋", "success")
        else:
            # Create new user via Google
            new_user = User(
                google_id=google_id,
                email=email,
                name=name,
                picture=picture,
                last_login=datetime.utcnow()
            )
            db.session.add(new_user)
            db.session.commit()
            login_user(new_user)
            flash(f"Welcome to Pro Rooms, {new_user.name}! 🎉", "success")

        return redirect(url_for("dashboard"))

    except OAuthError as e:
        flash(f"OAuth error: {str(e)}", "error")
        return redirect(url_for("login"))
    except Exception as e:
        print(f"[google_callback] Unexpected error: {e}")
        flash(f"Authentication failed: {str(e)}", "error")
        return redirect(url_for("login"))


# ─────────────────────────────────────────────────────────────────────────────
# DASHBOARD
# ─────────────────────────────────────────────────────────────────────────────
@app.route("/dashboard")
@login_required
def dashboard():
    """Main dashboard page."""
    rooms = Room.query.order_by(Room.created_at.desc()).all()
    return render_template("index.html", rooms=rooms)


# ─ Profile ───────────────────────────────────────────────────────────────────
@app.route("/profile", methods=["GET", "POST"])
@login_required
def profile():
    """GitHub-style profile editing."""
    if request.method == "POST":
        current_user.username = request.form.get("username", current_user.username)
        current_user.email    = request.form.get("email",    current_user.email)
        current_user.bio      = request.form.get("bio",      "")
        current_user.github   = request.form.get("github",   "")
        current_user.linkedin = request.form.get("linkedin", "")
        
        picture_url = request.form.get("picture_url", "")
        if picture_url:
            current_user.picture = picture_url

        db.session.commit()
        flash("Profile updated successfully! ✨", "success")
        return redirect(url_for("profile"))

    return render_template("profile.html")


# ─ Chat ──────────────────────────────────────────────────────────────────────
@app.route("/chat/<int:room_id>")
@login_required
def chat_room(room_id):
    """WhatsApp-style chat interface."""
    room = Room.query.get_or_404(room_id)
    return render_template("chat.html", room=room)


# ── API ──────────────────────────────────────────────────────────────────────

@app.route("/api/rooms", methods=["GET"])
@login_required
def get_rooms():
    """Fetch rooms with search and filtering."""
    search_query = request.args.get("search", "").strip()
    category     = request.args.get("category", "").strip()
    privacy      = request.args.get("privacy", "").strip()

    query = Room.query
    if search_query:
        query = query.filter(Room.name.ilike(f"%{search_query}%") | 
                           Room.description.ilike(f"%{search_query}%"))
    if category:
        query = query.filter(Room.category == category)
    if privacy:
        query = query.filter(Room.privacy == privacy)

    rooms = query.order_by(Room.created_at.desc()).all()
    return jsonify([room.to_dict() for room in rooms])


@app.route("/api/rooms", methods=["POST"])
@login_required
def create_room():
    """Create a new room."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid data"}), 400
    
    name        = data.get("name", "").strip()
    description = data.get("description", "").strip()
    topic       = data.get("topic", "").strip()
    category    = data.get("category", "").strip()
    privacy     = data.get("privacy", "Public").strip()
    password    = data.get("password", "").strip()
    whatsapp    = data.get("whatsapp_link", "").strip()
    
    if not name:
        return jsonify({"error": "Room name is required"}), 400
    
    if privacy == "Private" and (len(password) != 6 or not password.isdigit()):
        return jsonify({"error": "Private rooms require a 6-digit password"}), 400
    
    try:
        new_room = Room(
            name=name,
            description=description,
            topic=topic,
            category=category,
            privacy=privacy,
            password=password if privacy == "Private" else None,
            whatsapp_link=whatsapp,
            creator_id=current_user.id
        )
        db.session.add(new_room)
        db.session.commit()
        return jsonify({"success": True, "room": new_room.to_dict()})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@app.route("/api/rooms/join", methods=["POST"])
@login_required
def join_room():
    """Verify password and return WhatsApp link."""
    data = request.get_json()
    room_id = data.get("room_id")
    password = data.get("password", "").strip()
    
    room = Room.query.get(room_id)
    if not room:
        return jsonify({"error": "Room not found"}), 404
        
    if room.privacy == "Public" or room.password == password:
        return jsonify({"success": True, "link": room.whatsapp_link})
    else:
        return jsonify({"error": "Incorrect password"}), 403


@app.route("/api/chat/<int:room_id>", methods=["GET", "POST"])
@login_required
def chat_api(room_id):
    """Handle message history and sending."""
    room = Room.query.get_or_404(room_id)
    
    if request.method == "POST":
        data = request.get_json()
        content = data.get("content", "").strip()
        if not content:
            return jsonify({"error": "Message content is empty"}), 400
            
        msg = Message(
            content=content,
            room_id=room_id,
            user_id=current_user.id
        )
        db.session.add(msg)
        db.session.commit()
        return jsonify({"success": True, "message": msg.to_dict()})

    # GET: Return last 50 messages
    messages = Message.query.filter_by(room_id=room_id).order_by(Message.timestamp.asc()).limit(50).all()
    results = []
    for m in messages:
        author = User.query.get(m.user_id)
        results.append({
            "id": m.id,
            "content": m.content,
            "timestamp": m.timestamp.strftime("%H:%M"),
            "author_name": author.username if author.username else author.name,
            "author_img": author.picture or url_for('static', filename='img/default-avatar.png'),
            "is_me": m.user_id == current_user.id
        })
    return jsonify(results)


# ─────────────────────────────────────────────────────────────────────────────
# LOGOUT
# ─────────────────────────────────────────────────────────────────────────────
@app.route("/logout")
@login_required
def logout():
    logout_user()
    flash("Logged out successfully 👋", "success")
    return redirect(url_for("login"))


# ─────────────────────────────────────────────────────────────────────────────
# ENTRY POINT
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        print("✅ Database tables verified.")
    app.run(port=5000, debug=True)
