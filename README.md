# Pro-Rooms 🚀

Pro-Rooms is a premium platform for students and professionals to discover, create, and join exclusive group rooms. Each room is protected by a 6-digit access code to ensure community quality.

**Architecture Update:** Pro-Rooms has been refactored from a monolithic Flask application into a modern, decoupled architecture featuring a Flask REST API backend and a React single-page application (SPA) frontend.

## Features ✨

- **Room Discovery**: Search through a curated list of professional and student groups.
- **Secure Access**: Join rooms only if you have the 6-digit access code.
- **Create Your Own**: Easily create and manage your own group rooms.
- **Real-Time Chat**: Live chat functionality within each room.
- **Premium Design**: Sleek, modern, and dark-themed UI built with React & CSS.
- **User Authentication**: Secure stateless JWT login via local accounts or Google OAuth.

## Tech Stack 🛠️

- **Backend**: Python, Flask, Flask-REST API, PostgreSQL, SQLAlchemy ORM, Flask-JWT-Extended
- **Frontend**: React, Vite, Axios, React Router Dom, Vanilla CSS (Glassmorphism)
- **Authentication**: JWT (JSON Web Tokens) & Authlib (Google OAuth)

---

## Setup & Installation 🚀

The project is split into two directories: `backend/` and `frontend/`. You must run both concurrently.

### 1. Backend Setup

1. **Navigate to the backend folder**:
   ```bash
   cd backend
   ```

2. **Set up a Virtual Environment & Install Dependencies**:
   ```bash
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env` and configure it:
   ```bash
   cp .env.example .env
   ```
   *Make sure `DB_NAME` and your credentials point to a valid PostgreSQL database.*

4. **Initialize the Database**:
   ```bash
   flask db upgrade
   ```

5. **Run the Flask Development Server**:
   ```bash
   flask run --port=5000 --debug
   ```
   The API will be available at `http://localhost:5000`.

---

### 2. Frontend Setup

1. **Navigate to the frontend folder** (in a new terminal window):
   ```bash
   cd frontend
   ```

2. **Install Node Utilities**:
   Ensure you have Node.js installed, then install the React dependencies:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the `frontend` folder:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

4. **Run the React Development Server**:
   ```bash
   npm run dev
   ```
   The UI will be available at `http://localhost:5173`.

---

## Old Monolith Note
The files at the root of the repository (e.g., the old `app.py`, `templates/`, `static/`, etc.) belong to the legacy monolithic architecture. All new active development occurs inside `/backend` and `/frontend`.

---
Built with ❤️ by [Vasanth](https://github.com/Vasanth2005kk)