import sqlite3

from ..core.security import hash_password
from ..db.session import db

PUBLIC_COLUMNS = "id, email, first_name, last_name, is_active"


def create(email: str, password: str, first_name: str, last_name: str) -> int | None:
    """Insert a user, or return None if the email is taken."""
    try:
        cur = db.execute(
            "INSERT INTO users (email, pw, first_name, last_name) VALUES (?, ?, ?, ?)",
            (email, hash_password(password), first_name.strip(), last_name.strip()),
        )
        db.commit()
        return cur.lastrowid
    except sqlite3.IntegrityError:
        return None


def get_by_email(email: str) -> sqlite3.Row | None:
    return db.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()


def get_by_id(user_id: int) -> sqlite3.Row | None:
    return db.execute(
        f"SELECT {PUBLIC_COLUMNS} FROM users WHERE id = ?", (user_id,)
    ).fetchone()
