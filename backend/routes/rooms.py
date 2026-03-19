"""
routes/rooms.py
───────────────
Rooms blueprint. Registered at /api/rooms/*.

All endpoints migrated from app.py /api/rooms/* — only the auth
decorator changed from @login_required (session) to @jwt_required() (JWT).

  GET  /api/rooms           ← list rooms (with search + filter)
  POST /api/rooms           ← create room
  GET  /api/rooms/<id>      ← get single room details
  POST /api/rooms/join      ← join a room
  POST /api/rooms/star      ← toggle star on a room
"""

import os
import secrets

from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from extensions import db
from helpers.roomid import roomidGen
from models.room import Room
from models.star_member import Member, Star
from models.user import User

rooms_bp = Blueprint("rooms", __name__)


def _current_user() -> User:
    """Fetch the User record from the JWT identity claim."""
    return User.query.get(int(get_jwt_identity()))


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/rooms
# ─────────────────────────────────────────────────────────────────────────────
@rooms_bp.route("", methods=["GET"])
@jwt_required()
def get_rooms():
    """
    List all rooms, optionally filtered by ?search=, ?category=, ?privacy=
    Each room dict is enriched with star_count, is_starred_by_me, is_member.
    """
    me       = _current_user()
    search   = request.args.get("search",   "").strip()
    category = request.args.get("category", "").strip()
    privacy  = request.args.get("privacy",  "").strip()

    q = Room.query
    if search:
        q = q.filter(
            Room.name.ilike(f"%{search}%") | Room.description.ilike(f"%{search}%")
        )
    if category:
        q = q.filter(Room.category == category)
    if privacy:
        q = q.filter(Room.privacy == privacy)

    rooms      = q.order_by(Room.created_at.desc()).all()
    rooms_data = []
    for r in rooms:
        d = r.to_dict()
        d["star_count"]       = Star.query.filter_by(room_id=r.id).count()
        d["is_starred_by_me"] = Star.query.filter_by(user_id=me.id, room_id=r.id).first() is not None
        d["is_member"]        = Member.query.filter_by(user_id=me.id, room_id=r.id).first() is not None
        d["is_owner"]         = me.id == r.creator_id
        rooms_data.append(d)

    return jsonify(rooms_data), 200


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/rooms
# ─────────────────────────────────────────────────────────────────────────────
@rooms_bp.route("", methods=["POST"])
@jwt_required()
def create_room():
    """
    Create a new room. Accepts multipart/form-data because of optional
    room icon file upload. Automatically adds creator as a member.
    """
    me = _current_user()

    name        = request.form.get("name",         "").strip()
    description = request.form.get("description",  "").strip()
    topic       = request.form.get("topic",        "").strip()
    category    = request.form.get("category",     "").strip()
    privacy     = request.form.get("privacy",      "Public").strip()
    password    = request.form.get("password",     "").strip()
    usercount   = request.form.get("members_limit","1").strip()

    if not name:
        return jsonify({"error": "Room name is required"}), 400

    if privacy == "Private" and (len(password) != 6 or not password.isdigit()):
        return jsonify({"error": "Private rooms require a 6-digit numeric password"}), 400

    # ── Handle optional room icon upload ─────────────────────────────────────
    icon_path = "/static/images/roomicons/default_roomicon.png"
    if "room_icon" in request.files:
        file = request.files["room_icon"]
        if file and file.filename:
            ext = os.path.splitext(file.filename)[1].lower()
            if ext in [".jpg", ".jpeg", ".png", ".gif"]:
                filename   = f"room_{secrets.token_hex(8)}{ext}"
                upload_dir = "/home/vasanth/Desktop/Projects/Pro-Rooms/frontend/public/static/images/roomicons"
                os.makedirs(upload_dir, exist_ok=True)
                file.save(os.path.join(upload_dir, filename))
                icon_path = f"/static/images/roomicons/{filename}"

    try:
        capacity = max(1, int(usercount)) if usercount.isdigit() else 1
        new_room = Room(
            id=roomidGen(),
            name=name,
            description=description,
            topic=topic,
            category=category,
            privacy=privacy,
            password=password if privacy == "Private" else None,
            icon=icon_path,
            usercount=capacity,
            creator_id=me.id,
        )
        db.session.add(new_room)
        db.session.flush()  # Persist the room to get its ID

        # Auto-add creator as a member
        db.session.add(Member(user_id=me.id, room_id=new_room.id))
        db.session.commit()

        return jsonify({"success": True, "room": new_room.to_dict()}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/rooms/<room_id>
# ─────────────────────────────────────────────────────────────────────────────
@rooms_bp.route("/<int:room_id>", methods=["GET"])
@jwt_required()
def get_room(room_id):
    """Fetch full details of a single room, including creator name and counts."""
    me   = _current_user()
    room = Room.query.get_or_404(room_id)
    data = room.to_dict()

    creator = User.query.get(room.creator_id)
    data["creator_name"]     = creator.username or creator.name or "Unknown"
    data["star_count"]       = Star.query.filter_by(room_id=room.id).count()
    data["is_starred_by_me"] = Star.query.filter_by(user_id=me.id, room_id=room.id).first() is not None
    data["member_count"]     = Member.query.filter_by(room_id=room.id).count()
    data["is_member"]        = Member.query.filter_by(user_id=me.id, room_id=room.id).first() is not None
    data["is_owner"]         = me.id == room.creator_id

    return jsonify(data), 200


# ─────────────────────────────────────────────────────────────────────────────
# PUT /api/rooms/<room_id>   ← Edit room (creator only)
# ─────────────────────────────────────────────────────────────────────────────
@rooms_bp.route("/<int:room_id>", methods=["PUT"])
@jwt_required()
def update_room(room_id):
    """Update a room's details. Only the creator can do this."""
    me   = _current_user()
    room = Room.query.get_or_404(room_id)

    if me.id != room.creator_id:
        return jsonify({"error": "Forbidden: only the room creator can edit this room"}), 403

    is_multipart = request.content_type and request.content_type.startswith("multipart")
    data         = request.form if is_multipart else (request.get_json() or {})

    room.name        = data.get("name",        room.name)
    room.description = data.get("description", room.description)
    room.topic       = data.get("topic",       room.topic)
    room.category    = data.get("category",    room.category)

    new_privacy = data.get("privacy", room.privacy)
    if new_privacy == "Private":
        new_pass = data.get("password", "").strip()
        if new_pass and (len(new_pass) != 6 or not new_pass.isdigit()):
            return jsonify({"error": "Private rooms require a 6-digit numeric password"}), 400
        room.password = new_pass or room.password
    else:
        room.password = None
    room.privacy = new_privacy

    members_limit = data.get("members_limit", "")
    if members_limit:
        try:
            room.usercount = max(1, int(members_limit))
        except ValueError:
            pass

    # Handle optional new room icon
    if "room_icon" in request.files:
        file = request.files["room_icon"]
        if file and file.filename:
            ext = os.path.splitext(file.filename)[1].lower()
            if ext in [".jpg", ".jpeg", ".png", ".gif"]:
                filename   = f"room_{secrets.token_hex(8)}{ext}"
                upload_dir = "/home/vasanth/Desktop/Projects/Pro-Rooms/frontend/public/static/images/roomicons"
                os.makedirs(upload_dir, exist_ok=True)
                file.save(os.path.join(upload_dir, filename))
                room.icon = f"/static/images/roomicons/{filename}"
            else:
                return jsonify({"error": "Unsupported image format"}), 400

    db.session.commit()
    return jsonify({"success": True, "room": room.to_dict()}), 200


# ─────────────────────────────────────────────────────────────────────────────
# DELETE /api/rooms/<room_id>   ← Delete room (creator only)
# ─────────────────────────────────────────────────────────────────────────────
@rooms_bp.route("/<int:room_id>", methods=["DELETE"])
@jwt_required()
def delete_room(room_id):
    """Delete a room and all its messages/members. Only the creator can do this."""
    me   = _current_user()
    room = Room.query.get_or_404(room_id)

    if me.id != room.creator_id:
        return jsonify({"error": "Forbidden: only the room creator can delete this room"}), 403

    # Delete members and stars manually (messages cascade automatically)
    Member.query.filter_by(room_id=room.id).delete()
    Star.query.filter_by(room_id=room.id).delete()
    db.session.delete(room)
    db.session.commit()

    return jsonify({"success": True, "message": "Room deleted successfully"}), 200


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/rooms/join
# ─────────────────────────────────────────────────────────────────────────────
@rooms_bp.route("/join", methods=["POST"])
@jwt_required()
def join_room():
    """
    Join a room. Public rooms need no password.
    Private rooms require the 6-digit password matching Room.password.
    Already-members get a 200 without duplicate insertion.
    """
    me       = _current_user()
    data     = request.get_json()
    room_id  = data.get("room_id")
    password = data.get("password", "").strip()

    room = Room.query.get(room_id)
    if not room:
        return jsonify({"error": "Room not found"}), 404

    if room.privacy == "Private" and room.password != password:
        return jsonify({"error": "Incorrect room password"}), 403

    if not Member.query.filter_by(user_id=me.id, room_id=room.id).first():
        db.session.add(Member(user_id=me.id, room_id=room.id))
        db.session.commit()

    return jsonify({"success": True, "room_id": room.id}), 200


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/rooms/star
# ─────────────────────────────────────────────────────────────────────────────
@rooms_bp.route("/star", methods=["POST"])
@jwt_required()
def toggle_star():
    """
    Toggle star status on a room for the current user.
    Returns the new starred state and updated total count.
    """
    me      = _current_user()
    data    = request.get_json()
    room_id = data.get("room_id")

    if not room_id:
        return jsonify({"error": "room_id is required"}), 400

    star = Star.query.filter_by(user_id=me.id, room_id=room_id).first()
    if star:
        db.session.delete(star)
        starred = False
    else:
        db.session.add(Star(user_id=me.id, room_id=room_id))
        starred = True

    db.session.commit()

    return jsonify({
        "success":    True,
        "starred":    starred,
        "star_count": Star.query.filter_by(room_id=room_id).count(),
    }), 200
