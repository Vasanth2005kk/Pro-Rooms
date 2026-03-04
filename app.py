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
import random
import os

import psycopg2
import psycopg2.extras
from authlib.integrations.base_client.errors import OAuthError
from datetime import datetime
from dotenv import load_dotenv
from flask import (
    Flask, flash, jsonify, redirect,
    render_template, request, session, url_for, abort
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
            if not user.is_verified:
                flash("Please verify your email address first. 📧", "warning")
                # Generate new OTP and redirect to verification
                otp = str(random.randint(100000, 999999))
                session['otp'] = otp
                session['user_id_to_verify'] = user.id
                print(f"DEBUG: New OTP for {user.email}: {otp}")
                return redirect(url_for("verify_otp", email=user.email))
            
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
            password=hashed,
            is_verified=False
        )
        db.session.add(new_user)
        db.session.commit()

        # Generate OTP
        otp = str(random.randint(100000, 999999))
        session['otp'] = otp
        session['user_id_to_verify'] = new_user.id
        
        print(f"DEBUG: OTP for {email}: {otp}") # In production, send via email

        flash("One-time password sent to your email! ✅", "success")
        return redirect(url_for("verify_otp", email=email))

    username = request.args.get("username", "")
    email    = request.args.get("email",    "")
    return render_template("signup.html", username=username, email=email)


@app.route("/verify_otp", methods=["GET", "POST"])
def verify_otp():
    """Handle OTP verification."""
    email = request.args.get("email")
    user_id = session.get("user_id_to_verify")
    
    if not user_id:
        flash("Session expired. Please log in or sign up again.", "error")
        return redirect(url_for("login"))

    if request.method == "POST":
        # Combine OTP digits from form
        otp_received = "".join([request.form.get(f"otp{i}", "") for i in range(1, 7)])
        otp_stored = session.get("otp")

        if otp_received == otp_stored:
            user = User.query.get(user_id)
            if user:
                user.is_verified = True
                db.session.commit()
                login_user(user)
                session.pop("otp", None)
                session.pop("user_id_to_verify", None)
                flash(f"Successfully verified! Welcome, {user.username} 🎉", "success")
                return redirect(url_for("dashboard"))
            else:
                flash("User not found.", "error")
                return redirect(url_for("signup"))
        else:
            flash("Invalid OTP code. Please try again. ❌", "error")
            return redirect(url_for("verify_otp", email=email))

    return render_template("otp_verify.html", email=email)


@app.route("/resend_otp", methods=["POST"])
def resend_otp():
    """Handle OTP resending."""
    email = request.args.get("email")
    user_id = session.get("user_id_to_verify")

    if not user_id:
        flash("Session expired.", "error")
        return redirect(url_for("login"))

    otp = str(random.randint(100000, 999999))
    session['otp'] = otp
    print(f"DEBUG: Resent OTP for {email}: {otp}")
    
    flash("New OTP has been sent! 📧", "success")
    return redirect(url_for("verify_otp", email=email))


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
@app.route("/profile/<username>", methods=["GET", "POST"])
def profile(username=None):
    if not username:
        if current_user.is_authenticated and current_user.username:
            return redirect(url_for("profile", username=current_user.username))
        elif current_user.is_authenticated:
            # If user has no username yet, use current_user
            user = current_user
        else:
            flash("Please log in to view your profile.", "info")
            return redirect(url_for("login"))
    else:
        user = User.query.filter_by(username=username).first()
        if not user:
            abort(404)

    is_own_profile = current_user.is_authenticated and current_user.id == user.id

    if request.method == "POST":
        if not is_own_profile:
            abort(403)
            
        user.name     = request.form.get("name",     "")
        new_username = request.form.get("username", user.username).strip()
        
        # Simple check for username uniqueness if changed
        if new_username != user.username:
            existing = User.query.filter_by(username=new_username).first()
            if existing:
                flash("Username already taken! ⚠️", "error")
                return redirect(url_for("profile", username=user.username))
            user.username = new_username

        user.email    = request.form.get("email",    user.email)
        user.bio      = request.form.get("bio",      "")
        user.link1 = request.form.get("link1", "")
        user.link2 = request.form.get("link2", "")
        user.link3 = request.form.get("link3", "")
        user.link4 = request.form.get("link4", "")
        
        user.company         = request.form.get("company", "")
        user.job_title       = request.form.get("job_title", "")
        user.location        = request.form.get("location", "")
        user.company_website = request.form.get("company_website", "")
        
        # Handle Profile Picture Upload
        print(f"request.files: {request.files}")
        if 'picture_url' in request.files:
            file = request.files['picture_url']
            if file and file.filename != '':
                ext = os.path.splitext(file.filename)[1].lower()
                if ext in ['.jpg', '.jpeg', '.png', '.gif']:
                    filename = f"{secrets.token_hex(8)}{ext}"
                    upload_dir = os.path.join(app.root_path, 'static', 'images', 'userimages')
                    os.makedirs(upload_dir, exist_ok=True)
                    
                    filepath = os.path.join(upload_dir, filename)
                    file.save(filepath)
                    user.picture = f"/static/images/userimages/{filename}"
                else:
                    flash("Unsupported image format! 📸", "error")

        db.session.commit()
        flash("Profile updated successfully! ✨", "success")
        return redirect(url_for("profile", username=user.username))

    # Fetch rooms created by the user
    user_rooms = Room.query.filter_by(creator_id=user.id).order_by(Room.created_at.desc()).all()
    
    # Mock some stats
    stats = {
        "rooms_count": len(user_rooms),
        "messages_count": Message.query.filter_by(user_id=user.id).count(),
        "followers": random.randint(50, 200) # Mock data
    }

    return render_template("profile.html", user=user, rooms=user_rooms, stats=stats, is_own_profile=is_own_profile)


@app.errorhandler(404)
def page_not_found(e):
    return render_template("404.html"), 404


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
            "author_img": author.picture or url_for('static', filename='images/userimages/default-avatar.png'),
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
