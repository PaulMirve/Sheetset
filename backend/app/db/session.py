import os
import sqlite3

from ..core.config import DB_PATH

# ponytail: one shared connection, no pool; sqlite serializes writes anyway
db = sqlite3.connect(DB_PATH, check_same_thread=False)
db.row_factory = sqlite3.Row
db.execute("PRAGMA foreign_keys = ON")

with open(os.path.join(os.path.dirname(__file__), "schema.sql")) as f:
    db.executescript(f.read())
db.commit()
