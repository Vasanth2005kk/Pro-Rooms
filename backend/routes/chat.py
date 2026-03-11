"""
routes/chat.py
──────────────
Chat blueprint. Registered at /api/chat/*.

Migrated from /api/chat/<room_id> in app.py.

  GET  /api/chat/<room_id>  ← fetch last 50 messages
  POST /api/chat/<room_id>  ← post a new message
"""

from flask import Blueprint, jsonify, request, url_for
from flask_jwt_extended import get_jwt_identity, jwt_required

from extensions import db
from models.message import Message
from models.room import Room
from models.user import User

chat_bp = Blueprint("chat", __name__)


@chat_bp.route("/<int:room_id>", methods=["GET"])
@jwt_required()
def get_messages(room_id):
    """
    Return the last 50 messages for a room in ascending timestamp order.
    Each message includes author info and an is_me flag for the React client.
    """
    me   = User.query.get(int(get_jwt_identity()))
    Room.query.get_or_404(room_id)   # 404 if room doesn't exist

    messages = (
        Message.query
        .filter_by(room_id=room_id)
        .order_by(Message.timestamp.asc())
        .limit(50)
        .all()
    )

    results = []
    for m in messages:
        author = User.query.get(m.user_id)
        default_avatar = url_for(
            "static", filename="images/userimages/default-avatar.png", _external=False
        )
        results.append({
            "id":          m.id,
            "content":     m.content,
            "timestamp":   m.timestamp.strftime("%H:%M") if m.timestamp else "",
            "author_name": author.username or author.name if author else "Unknown",
            "author_img":  (author.picture or default_avatar) if author else default_avatar,
            "is_me":       m.user_id == me.id,
        })

    return jsonify(results), 200


@chat_bp.route("/<int:room_id>", methods=["POST"])
@jwt_required()
def post_message(room_id):
    """Post a new message to a room."""
    me      = User.query.get(int(get_jwt_identity()))
    Room.query.get_or_404(room_id)

    data    = request.get_json()
    content = data.get("content", "").strip()

    if not content:
        return jsonify({"error": "Message content cannot be empty"}), 400

    msg = Message(content=content, room_id=room_id, user_id=me.id)
    db.session.add(msg)
    db.session.commit()

    return jsonify({"success": True, "message": msg.to_dict()}), 201
