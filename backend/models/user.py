"""
models/user.py
──────────────
User ORM model. Migrated unchanged from rooms/Models.py.
Supports both local (password) and Google SSO (google_id) authentication.
"""

from datetime import datetime
from flask_login import UserMixin
from extensions import db


class User(db.Model, UserMixin):
    """Unified user model for local and Google SSO authentication."""

    __tablename__ = "users"

    id       = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), nullable=True)
    email    = db.Column(db.String(150), unique=True, nullable=False, index=True)
    password = db.Column(db.String(255), nullable=True)  # SHA-256 hex digest

    # SSO Profile Fields
    google_id = db.Column(db.String(255), unique=True, nullable=True, index=True)
    name      = db.Column(db.String(255), nullable=True)  # Full name from Google

    # Common Profile Fields
    picture = db.Column(db.String(500), nullable=True)
    bio     = db.Column(db.String(500), nullable=True)

    # Generic Social Links
    link1 = db.Column(db.String(500), nullable=True)
    link2 = db.Column(db.String(500), nullable=True)
    link3 = db.Column(db.String(500), nullable=True)
    link4 = db.Column(db.String(500), nullable=True)

    # Corporate Profile Fields
    company         = db.Column(db.String(255), nullable=True)
    job_title       = db.Column(db.String(255), nullable=True)
    location        = db.Column(db.String(255), nullable=True)
    company_website = db.Column(db.String(255), nullable=True)

    created_at  = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    last_login  = db.Column(db.DateTime, default=datetime.utcnow, nullable=True)
    is_verified = db.Column(db.Boolean, default=False)

    # Relationships
    messages = db.relationship("Message", backref="author", lazy=True)

    def __repr__(self):
        return f"<User {self.email}>"

    def to_dict(self):
        """Serialize user to a JSON-safe dict. Excludes sensitive fields."""
        return {
            "id":         self.id,
            "username":   self.username,
            "email":      self.email,
            "name":       self.name,
            "picture":    self.picture,
            "bio":        self.bio,
            "link1":      self.link1,
            "link2":      self.link2,
            "link3":      self.link3,
            "link4":      self.link4,
            "company":    self.company,
            "job_title":  self.job_title,
            "location":   self.location,
            "company_website": self.company_website,
            "is_verified": self.is_verified,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
