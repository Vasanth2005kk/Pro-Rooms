"""
routes/profile.py
─────────────────
Profile blueprint. Registered at /api/profile/*.

Migrated from the /profile and /profile/<username> routes in app.py.

  GET /api/profile/<username>  ← fetch user profile + stats + rooms
  PUT /api/profile/<username>  ← update own profile (multipart for avatar)
"""

import os
import random
import secrets

from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from extensions import db
from models.message import Message
from models.room import Room
from models.star_member import Member, Star
from models.user import User

profile_bp = Blueprint("profile", __name__)


def _enrich_room(r, me_id: int) -> dict:
    """Add star and membership data to a room dict."""
    d = r.to_dict()
    d["star_count"]       = Star.query.filter_by(room_id=r.id).count()
    d["is_starred_by_me"] = Star.query.filter_by(user_id=me_id, room_id=r.id).first() is not None
    d["is_member"]        = Member.query.filter_by(user_id=me_id, room_id=r.id).first() is not None
    d["is_owner"]         = me_id == r.creator_id
    return d


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/profile/<username>
# ─────────────────────────────────────────────────────────────────────────────
@profile_bp.route("/<username>", methods=["GET"])
@jwt_required()
def get_profile(username):
    """
    Return the full profile for a user, including:
      - user data
      - rooms created by them
      - rooms they joined (but didn't create)
      - rooms they starred
      - activity stats
    """
    me_id = int(get_jwt_identity())
    user  = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    is_own_profile = me_id == user.id

    # Rooms created by this user
    user_rooms = Room.query.filter_by(creator_id=user.id).order_by(Room.created_at.desc()).all()

    # Rooms joined (excluding own)
    joined_ids   = [m.room_id for m in Member.query.filter_by(user_id=user.id).all()]
    joined_rooms = (
        Room.query.filter(Room.id.in_(joined_ids), Room.creator_id != user.id).all()
        if joined_ids else []
    )

    # Rooms starred (excluding own)
    starred_ids   = [s.room_id for s in Star.query.filter_by(user_id=user.id).all()]
    starred_rooms = (
        Room.query.filter(Room.id.in_(starred_ids), Room.creator_id != user.id).all()
        if starred_ids else []
    )

    # Sort user rooms into public and private
    public_rooms  = [r for r in user_rooms if r.privacy == "Public"]
    private_rooms = [r for r in user_rooms if r.privacy == "Private"]

    stats = {
        "rooms_count":    len(user_rooms),
        "joined_count":   len(joined_rooms),
        "messages_count": Message.query.filter_by(user_id=user.id).count(),
        "stars_count":    len(starred_rooms),
        "followers":      random.randint(50, 200),  # Mock — replace with real data later
    }

    return jsonify({
        "user":          user.to_dict(),
        "rooms": {
            "public":  [_enrich_room(r, me_id) for r in public_rooms],
            "private": [_enrich_room(r, me_id) for r in private_rooms],
            "joined":  [_enrich_room(r, me_id) for r in joined_rooms],
            "starred": [_enrich_room(r, me_id) for r in starred_rooms],
        },
        "stats":         stats,
        "is_own_profile": is_own_profile,
    }), 200


# ─────────────────────────────────────────────────────────────────────────────
# PUT /api/profile/<username>
# ─────────────────────────────────────────────────────────────────────────────
@profile_bp.route("/<username>", methods=["PUT"])
@jwt_required()
def update_profile(username):
    """
    Update own profile. Accepts either JSON or multipart/form-data
    (multipart required when uploading a new profile picture).
    Only the owner of the profile can update it.
    """
    me_id = int(get_jwt_identity())
    user  = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({"error": "User not found"}), 404
    if me_id != user.id:
        return jsonify({"error": "Forbidden: you can only edit your own profile"}), 403

    # Resolve data source: multipart (file upload) vs plain JSON
    is_multipart = request.content_type and request.content_type.startswith("multipart")
    data         = request.form if is_multipart else (request.get_json() or {})
    print(data)
    # ── Update text fields ────────────────────────────────────────────────────
    user.name            = data.get("name",            user.name)
    user.bio             = data.get("bio",             user.bio)
    user.link1           = data.get("link1",           user.link1)
    user.link2           = data.get("link2",           user.link2)
    user.link3           = data.get("link3",           user.link3)
    user.link4           = data.get("link4",           user.link4)
    user.company         = data.get("company",         user.company)
    user.job_title       = data.get("job_title",       user.job_title)
    user.location        = data.get("location",        user.location)
    user.company_website = data.get("company_website", user.company_website)
    user.email           = data.get("email",           user.email)

    # ── Username uniqueness check ──────────────────────────────────────────────
    new_username = data.get("username", user.username)
    if new_username and new_username != user.username:
        if User.query.filter_by(username=new_username).first():
            return jsonify({"error": "Username already taken"}), 409
        user.username = new_username

    # ── Handle profile picture upload ─────────────────────────────────────────
    if "picture" in request.files:
        file = request.files["picture"]
        if file and file.filename:
            ext = os.path.splitext(file.filename)[1].lower()
            if ext in [".jpg", ".jpeg", ".png", ".gif"]:
                filename   = f"{secrets.token_hex(8)}{ext}"
                upload_dir = "/home/vasanth/Desktop/Projects/Pro-Rooms/frontend/public/static/images/userimages"
                os.makedirs(upload_dir, exist_ok=True)
                file.save(os.path.join(upload_dir, filename))
                user.picture = f"/static/images/userimages/{filename}"
            else:
                return jsonify({"error": "Unsupported image format"}), 400

    db.session.commit()
    return jsonify({
        "message": "Profile updated successfully",
        "user":    user.to_dict(),
    }), 200
