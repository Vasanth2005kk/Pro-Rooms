"""
models/room.py
──────────────
Room ORM model. Migrated unchanged from rooms/Models.py.
"""

from datetime import datetime
from extensions import db


class Room(db.Model):
    __tablename__ = "rooms"

    id          = db.Column(db.BigInteger, primary_key=True)
    name        = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    topic       = db.Column(db.String(100), nullable=True)
    category    = db.Column(db.String(50),  nullable=True)
    privacy     = db.Column(db.String(20),  default="Public")   # 'Public' | 'Private'
    password    = db.Column(db.String(6),   nullable=True)       # 6-digit pin for private rooms
    icon        = db.Column(
        db.String(255), nullable=True,
        default="/static/images/roomicons/default_roomicon.png"
    )
    usercount  = db.Column(db.Integer, default=1)
    creator_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    messages = db.relationship(
        "Message", backref="room", lazy=True, cascade="all, delete-orphan"
    )

    def to_dict(self):
        return {
            "id":          self.id,
            "name":        self.name,
            "description": self.description,
            "topic":       self.topic,
            "category":    self.category,
            "privacy":     self.privacy,
            "icon":        self.icon,
            "usercount":   self.usercount,
            "created_at":  self.created_at.isoformat() if self.created_at else None,
            "creator_id":  self.creator_id,
        }
