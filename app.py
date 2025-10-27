from flask import Flask, render_template, request, flash, jsonify, redirect, url_for, session
import secrets
import mysql.connector
import hashlib
from dotenv import load_dotenv
import os

app = Flask(__name__)

# ---- Load environment variables ----
load_dotenv()

# ---- Set secret key (for session + flash) ----
# ✅ For production, store this key in .env file (SECRET_KEY=your_random_key)
app.secret_key = os.getenv("SECRET_KEY") or secrets.token_hex(16)

# ---- Database connection function ----
def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME")
    )

# -------------------------------
# LOGIN ROUTE
# -------------------------------
@app.route("/")
@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        identifier = request.form.get("identifier")  # username or email
        password = request.form.get("password")

        # ✅ Check input validity
        if not identifier or not password:
            flash("Please enter username/email and password ❗", "error")
            return redirect(url_for("login"))

        conn = None
        cursor = None
        try:
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)

            # ✅ Search by username or email
            cursor.execute(
                "SELECT * FROM users WHERE username = %s OR email = %s",
                (identifier, identifier)
            )
            user = cursor.fetchone()

            if not user:
                flash("No account found with that username or email 📧", "error")
                return redirect(url_for("login"))

            # ✅ Password check
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

# -------------------------------
# SIGNUP ROUTE
# -------------------------------
@app.route("/signup", methods=["GET", "POST"])
def signup():
    if request.method == "POST":
        username = request.form.get("username")
        email = request.form.get("email")
        password = request.form.get("password")
        c_password = request.form.get("ConfirmPassword")

        if password != c_password:
            flash("Password is Mismatch !!!", "error")
            return redirect(url_for("signup", username=username, email=email))

        conn = None
        cursor = None
        try:
            conn = get_db_connection()
            cursor = conn.cursor()

            random_id = secrets.randbelow(900000) + 100000
            hashed = hashlib.sha256(password.encode()).hexdigest()

            sql = "INSERT INTO users (id, username, email, password) VALUES (%s, %s, %s, %s)"
            cursor.execute(sql, (random_id, username, email, hashed))
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

# -------------------------------
# DASHBOARD (after login)
# -------------------------------
@app.route("/dashboard")
def dashboard():
    return render_template('index.html')

# -------------------------------
# LOGOUT
# -------------------------------
@app.route("/logout")
def logout():
    session.clear()
    flash("Logged out successfully 👋", "success")
    return redirect(url_for("login"))

# -------------------------------
# MAIN
# -------------------------------
if __name__ == "__main__":
    app.run(port=4000, debug=True)
