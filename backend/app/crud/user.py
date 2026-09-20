from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..core.security import hash_password
from ..db.models import User


def create(
    db: Session, email: str, password: str, first_name: str, last_name: str
) -> User | None:
    """Insert a user, or return None if the email is taken."""
    user = User(
        email=email,
        pw=hash_password(password),
        first_name=first_name.strip(),
        last_name=last_name.strip(),
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError as e:
        db.rollback()
        if "users.email" not in str(e.orig):
            raise
        return None
    return user


def get_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(User.email == email))


def get_by_id(db: Session, user_id: int) -> User | None:
    return db.get(User, user_id)
