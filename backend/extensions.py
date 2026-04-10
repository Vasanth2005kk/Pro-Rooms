"""
extensions.py
─────────────
All Flask extension singletons in one place.
Importing from here instead of app.py prevents circular import issues
when blueprints need access to db, jwt, etc.
"""

from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_login import LoginManager
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from authlib.integrations.flask_client import OAuth
from flask_socketio import SocketIO

db            = SQLAlchemy()
migrate       = Migrate()
login_manager = LoginManager()
jwt           = JWTManager()
cors          = CORS()
oauth_client  = OAuth()
socketio      = SocketIO()
