"""
models/message.py
─────────────────
Message ORM model. Migrated unchanged from rooms/Models.py.
"""

from datetime import datetime
from extensions import db


class Message(db.Model):
    """Stores internal chat messages for rooms."""

    __tablename__ = "messages"

    id        = db.Column(db.Integer, primary_key=True)
    content   = db.Column(db.Text,    nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    user_id = db.Column(db.Integer,    db.ForeignKey("users.id"), nullable=False)
    room_id = db.Column(db.BigInteger, db.ForeignKey("rooms.id"), nullable=False)

    def to_dict(self):
        return {
            "id":        self.id,
            "content":   self.content,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "user_id":   self.user_id,
            "room_id":   self.room_id,
        }
