from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ...core.config import MIN_PASSWORD_LENGTH
from ...core.security import create_token, verify_password
from ...crud import user as user_crud
from ...db.models import User as UserModel
from ...db.session import get_db
from ...schemas.user import Credentials, SignUp, Token, User
from ..deps import current_user

router = APIRouter(tags=["auth"])


@router.post("/signup", status_code=201, response_model=Token)
def signup(body: SignUp, db: Session = Depends(get_db)):
    if len(body.password) < MIN_PASSWORD_LENGTH:
        raise HTTPException(400, f"password must be at least {MIN_PASSWORD_LENGTH} characters")
    user = user_crud.create(db, body.email, body.password, body.first_name, body.last_name)
    if user is None:
        raise HTTPException(409, "email already registered")
    return Token(token=create_token(user.id))


@router.post("/login", response_model=Token)
def login(body: Credentials, db: Session = Depends(get_db)):
    user = user_crud.get_by_email(db, body.email)
    if user is None or not verify_password(body.password, user.pw):
        raise HTTPException(401, "bad credentials")
    if not user.is_active:
        raise HTTPException(403, "account is inactive")
    return Token(token=create_token(user.id))


@router.get("/me", response_model=User)
def me(user: UserModel = Depends(current_user)):
    return user
