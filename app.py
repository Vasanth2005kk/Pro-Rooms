from flask import Flask, render_template, request, flash, jsonify, redirect, url_for, session
import secrets
import hashlib
from dotenv import load_dotenv
from rooms.Config import Config, init_oauth
from rooms.Models import db, get_db_connection, User, SSO_User
from datetime import datetime
import mysql.connector

# ---------------------------------------
# Flask App Initialization
# ---------------------------------------
app = Flask(__name__)
app.config.from_object(Config)
Config.validate()
load_dotenv()

# Secret key setup
app.secret_key = Config.SECRET_KEY

# Initialize SQLAlchemy
db.init_app(app)

# Initialize OAuth
oauth = init_oauth(app)
google = oauth.google

# ---------------------------------------
# LOGIN ROUTE
# ---------------------------------------
@app.route("/")
@app.route("/login", methods=["GET", "POST"])
def login():
    """Handle user login (local user)"""
    if request.method == "POST":
        identifier = request.form.get("identifier")
        password = request.form.get("password")

        if not identifier or not password:
            flash("Please enter username/email and password ❗", "error")
            return redirect(url_for("login"))

        conn, cursor = None, None
        try:
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)

            cursor.execute(
                "SELECT * FROM users WHERE username = %s OR email = %s",
                (identifier, identifier)
            )
            user = cursor.fetchone()

            if not user:
                flash("No account found with that username or email 📧", "error")
                return redirect(url_for("login"))

            hashed_input = hashlib.sha256(password.encode()).hexdigest()
            if hashed_input == user["password"]:
                session["user_id"] = user["id"]
                session["username"] = user["username"]
                flash(f"Welcome back, {user['username']} 👋", "success")
                return redirect(url_for("dashboard"))
            else:
                flash("Incorrect password ❌", "error")

        except mysql.connector.Error as err:
            flash(f"Database Error: {err}", "error")
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()

    return render_template("login.html")


# ---------------------------------------
# SIGNUP ROUTE
# ---------------------------------------
@app.route("/signup", methods=["GET", "POST"])
def signup():
    """Handle new user registration"""
    if request.method == "POST":
        username = request.form.get("username")
        email = request.form.get("email")
        password = request.form.get("password")
        c_password = request.form.get("ConfirmPassword")

        print("request all data :",request.get_data())
        if not username or not email or not password:
            flash("All fields are required ❗", "error")
            return redirect(url_for("signup"))

        if password != c_password:
            flash("Passwords do not match ⚠️", "error")
            return redirect(url_for("signup", username=username, email=email))

        conn, cursor = None, None
        try:
            conn = get_db_connection()
            cursor = conn.cursor()

            random_id = secrets.randbelow(900000) + 100000
            hashed = hashlib.sha256(password.encode()).hexdigest()

            cursor.execute(
                "INSERT INTO users (id, username, email, password) VALUES (%s, %s, %s, %s)",
                (random_id, username, email, hashed)
            )
            conn.commit()

            flash("Account created successfully ✅", "success")
            return redirect(url_for("login"))

        except mysql.connector.Error as err:
            flash(f"Database Error: {err}", "error")
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()

    username = request.args.get("username", "")
    email = request.args.get("email", "")
    return render_template("signup.html", username=username, email=email)


# ---------------------------------------
# GOOGLE OAUTH LOGIN
# ---------------------------------------
@app.route("/auth/google")
def google_login():
    """Initiate Google OAuth flow"""
    redirect_uri = url_for("google_callback", _external=True)
    print("redirect_uri :",redirect_uri)
    return google.authorize_redirect(redirect_uri)


@app.route("/auth/google/callback")
def google_callback():
    """Handle Google OAuth callback"""
    try:
        token = google.authorize_access_token()
        user_info = token.get("userinfo")
        print(user_info)

        if not user_info:
            flash("Failed to fetch user info from Google", "error")
            return redirect(url_for("login"))

        google_id = user_info.get("sub")
        email = user_info.get("email")
        name = user_info.get("name")
        picture = user_info.get("picture")

        # ✅ Check if user exists in SSO_User table
        user = SSO_User.query.filter_by(google_id=google_id).first()

        if user:
            # Existing user - update info
            user.last_login = datetime.utcnow()
            user.name = name
            user.picture = picture
            db.session.commit()

            session["user_id"] = user.id
            session["user_email"] = user.email
            session["is_new_user"] = False

            flash(f"Welcome back, {user.name}!", "success")

        else:
            # New user - create record
            new_user = SSO_User(
                google_id=google_id,
                email=email,
                name=name,
                picture=picture,
                created_at=datetime.utcnow(),
                last_login=datetime.utcnow(),
            )
            db.session.add(new_user)
            db.session.commit()

            session["user_id"] = new_user.id
            session["user_email"] = new_user.email
            session["is_new_user"] = True

            flash(f"Account created successfully! Welcome, {new_user.name}!", "success")

        return redirect(url_for("dashboard"))

    except Exception as e:
        print(f"Error during callback: {e}")
        flash(f"Authentication failed: {str(e)}", "error")
        return redirect(url_for("login"))


# ---------------------------------------
# DASHBOARD
# ---------------------------------------
@app.route("/dashboard")
def dashboard():
    if "user_id" not in session:
        flash("Please log in first ❗", "error")
        return redirect(url_for("login"))
    return render_template("index.html")


# ---------------------------------------
# LOGOUT
# ---------------------------------------
@app.route("/logout")
def logout():
    session.clear()
    flash("Logged out successfully 👋", "success")
    return redirect(url_for("login"))


# ---------------------------------------
# MAIN ENTRY POINT
# ---------------------------------------
if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        print("✅ Tables created successfully!")
    app.run(port=5000, debug=True)
