import time
from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from ...core.config import MIN_PASSWORD_LENGTH
from ...core.security import create_token, hash_password, verify_password
from ...crud import user as user_crud
from ...db.models import User as UserModel
from ...db.session import get_db
from ...schemas.user import Credentials, SignUp, Token, User
from ..deps import current_user

router = APIRouter(tags=["auth"])

# Checked against when the email is unknown, so a miss takes as long as a wrong password.
_DUMMY_HASH = hash_password("not-a-real-password")

# ponytail: failure counts live in this process's memory; move to the DB or Redis if it runs on several workers.
MAX_FAILURES, WINDOW = 10, 5 * 60
_failures: dict[str, list[float]] = defaultdict(list)


def _throttle(*keys: str) -> None:
    """429 once any key has MAX_FAILURES in the last WINDOW seconds."""
    now = time.time()
    for k in keys:
        _failures[k] = [t for t in _failures[k] if now - t < WINDOW]
        if len(_failures[k]) >= MAX_FAILURES:
            raise HTTPException(429, "too many attempts, try again in a few minutes")


def _ip(request: Request) -> str:
    return f"ip:{request.client.host if request.client else ''}"


def _fail(*keys: str) -> None:
    for k in keys:
        _failures[k].append(time.time())


@router.post("/signup", status_code=201, response_model=Token)
def signup(body: SignUp, request: Request, db: Session = Depends(get_db)):
    ip = _ip(request)
    _throttle(ip)
    if len(body.password) < MIN_PASSWORD_LENGTH:
        raise HTTPException(400, f"password must be at least {MIN_PASSWORD_LENGTH} characters")
    user = user_crud.create(db, body.email, body.password, body.first_name, body.last_name)
    if user is None:
        _fail(ip)  # repeated 409s are someone probing which emails exist
        raise HTTPException(409, "email already registered")
    return Token(token=create_token(user.id))


@router.post("/login", response_model=Token)
def login(body: Credentials, request: Request, db: Session = Depends(get_db)):
    keys = (_ip(request), f"email:{body.email.lower()}")
    _throttle(*keys)
    user = user_crud.get_by_email(db, body.email)
    if not verify_password(body.password, user.pw if user else _DUMMY_HASH) or user is None:
        _fail(*keys)
        raise HTTPException(401, "bad credentials")
    if not user.is_active:
        raise HTTPException(403, "account is inactive")
    return Token(token=create_token(user.id))


@router.get("/me", response_model=User)
def me(user: UserModel = Depends(current_user)):
    return user
