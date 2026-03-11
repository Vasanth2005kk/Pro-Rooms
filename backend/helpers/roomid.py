"""
helpers/roomid.py
─────────────────
Generates a unique numeric room ID based on the current datetime.
Unchanged from the original rooms/helper.py.
"""

from datetime import datetime


def roomidGen() -> int:
    """Return a unique integer room ID derived from the current timestamp."""
    now = datetime.now()
    return int(str(now.strftime("%Y%m%d%f"))[2::])
