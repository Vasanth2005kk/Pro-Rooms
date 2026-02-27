"""
rooms/Models.py
───────────────
SQLAlchemy ORM models (PostgreSQL) and a raw psycopg2 connection helper.
"""

import os
from datetime import datetime

import psycopg2
import psycopg2.extras
from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from dotenv import load_dotenv

load_dotenv()

# ── SQLAlchemy instance (shared with app.py) ──────────────────────────────────
db = SQLAlchemy()


# ── Raw psycopg2 connection (used for direct queries in routes) ───────────────
def get_db_connection():
    """
    Return a live psycopg2 connection to the PostgreSQL database.
    Credentials are read from environment variables:
        DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
    """
    return psycopg2.connect(
        host=os.getenv("DB_HOST",     "localhost"),
        port=os.getenv("DB_PORT",     "5432"),
        user=os.getenv("DB_USER",     "postgres"),
        password=os.getenv("DB_PASSWORD", "postgres"),
        dbname=os.getenv("DB_NAME",   "rooms_db")
    )


# ── ORM Models ────────────────────────────────────────────────────────────────

class User(db.Model, UserMixin):
    """Unified user model for local and Google SSO authentication."""

    __tablename__ = "users"

    id         = db.Column(db.Integer, primary_key=True)
    username   = db.Column(db.String(100), nullable=True)
    email      = db.Column(db.String(150), unique=True, nullable=False, index=True)
    password   = db.Column(db.String(255), nullable=True)   # SHA-256 hex digest
    
    # SSO Profile Fields
    google_id  = db.Column(db.String(255), unique=True, nullable=True, index=True)
    name       = db.Column(db.String(255), nullable=True) # Full name from Google
    
    # Common Profile Fields
    picture    = db.Column(db.String(500), nullable=True)
    bio        = db.Column(db.String(500), nullable=True)
    
    # Generic Social Links
    link1      = db.Column(db.String(500), nullable=True)
    link2      = db.Column(db.String(500), nullable=True)
    link3      = db.Column(db.String(500), nullable=True)
    link4      = db.Column(db.String(500), nullable=True)
    
    # Corporate Profile Fields
    company         = db.Column(db.String(255), nullable=True)
    job_title       = db.Column(db.String(255), nullable=True)
    location        = db.Column(db.String(255), nullable=True)
    company_website = db.Column(db.String(255), nullable=True)
    
    created_at  = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    last_login  = db.Column(db.DateTime, default=datetime.utcnow, nullable=True)
    is_verified = db.Column(db.Boolean, default=False)

    # Relationships
    messages = db.relationship('Message', backref='author', lazy=True)

    def __repr__(self):
        return f"<User {self.email}>"

    def to_dict(self):
        return {
            "id":         self.id,
            "username":   self.username,
            "email":      self.email,
            "name":       self.name,
            "picture":    self.picture,
            "bio":        self.bio,
            "github":     self.github,
            "linkedin":   self.linkedin,
            "created_at": self.created_at.isoformat()
        }


class Room(db.Model):
    """Stores information about student/pro rooms (Internal Chat or WhatsApp)."""

    __tablename__ = "rooms"

    id            = db.Column(db.Integer, primary_key=True)
    name          = db.Column(db.String(100), nullable=False)
    description   = db.Column(db.Text, nullable=True)
    topic         = db.Column(db.String(100), nullable=True)
    category      = db.Column(db.String(50), nullable=True)
    privacy       = db.Column(db.String(20), default='Public') # 'Public' or 'Private'
    whatsapp_link = db.Column(db.String(500), nullable=True)   # Optional if internal chat used
    password      = db.Column(db.String(6), nullable=True)    # 6-digit password for private
    creator_id    = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at    = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    messages = db.relationship('Message', backref='room', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id":          self.id,
            "name":        self.name,
            "description": self.description,
            "topic":       self.topic,
            "category":    self.category,
            "privacy":     self.privacy,
            "created_at":  self.created_at.isoformat(),
            "creator_id":  self.creator_id
        }


class Message(db.Model):
    """Stores internal chat messages for rooms."""

    __tablename__ = "messages"

    id           = db.Column(db.Integer, primary_key=True)
    content      = db.Column(db.Text, nullable=False)
    timestamp    = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    user_id      = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    room_id      = db.Column(db.Integer, db.ForeignKey('rooms.id'), nullable=False)

    def to_dict(self):
        return {
            "id":        self.id,
            "content":   self.content,
            "timestamp": self.timestamp.isoformat(),
            "user_id":   self.user_id
        }

