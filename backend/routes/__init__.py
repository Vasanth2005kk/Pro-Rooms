"""
routes/__init__.py
──────────────────
Exposes all blueprints for easy registration in app.py.
"""

from .auth    import auth_bp
from .rooms   import rooms_bp
from .chat    import chat_bp
from .profile import profile_bp

__all__ = ["auth_bp", "rooms_bp", "chat_bp", "profile_bp"]
