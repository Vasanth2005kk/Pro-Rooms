"""
models/star_member.py
─────────────────────
Star and Member ORM models. Migrated unchanged from rooms/Models.py.
"""

from datetime import datetime
from extensions import db


class Star(db.Model):
    """Tracks which users have starred which rooms."""

    __tablename__ = "stars"

    id         = db.Column(db.Integer,    primary_key=True)
    user_id    = db.Column(db.Integer,    db.ForeignKey("users.id"), nullable=False)
    room_id    = db.Column(db.BigInteger, db.ForeignKey("rooms.id"), nullable=False)
    created_at = db.Column(db.DateTime,   default=datetime.utcnow,  nullable=False)

    __table_args__ = (
        db.UniqueConstraint("user_id", "room_id", name="unique_user_room_star"),
    )

    def to_dict(self):
        return {"user_id": self.user_id, "room_id": self.room_id}


class Member(db.Model):
    """Tracks which users are members of which rooms."""

    __tablename__ = "members"

    id        = db.Column(db.Integer,    primary_key=True)
    user_id   = db.Column(db.Integer,    db.ForeignKey("users.id"), nullable=False)
    room_id   = db.Column(db.BigInteger, db.ForeignKey("rooms.id"), nullable=False)
    joined_at = db.Column(db.DateTime,   default=datetime.utcnow,  nullable=False)

    __table_args__ = (
        db.UniqueConstraint("user_id", "room_id", name="unique_user_room_membership"),
    )

    def to_dict(self):
        return {"user_id": self.user_id, "room_id": self.room_id}
