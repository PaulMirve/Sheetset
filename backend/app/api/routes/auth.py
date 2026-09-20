from fastapi import APIRouter, Depends, HTTPException

from ...core.config import MIN_PASSWORD_LENGTH
from ...core.security import create_token, verify_password
from ...crud import user as user_crud
from ...schemas.user import Credentials, SignUp, Token, User
from ..deps import current_user

router = APIRouter(tags=["auth"])


@router.post("/signup", status_code=201, response_model=Token)
def signup(body: SignUp):
    if len(body.password) < MIN_PASSWORD_LENGTH:
        raise HTTPException(400, f"password must be at least {MIN_PASSWORD_LENGTH} characters")
    user_id = user_crud.create(body.email, body.password, body.first_name, body.last_name)
    if user_id is None:
        raise HTTPException(409, "email already registered")
    return Token(token=create_token(user_id))


@router.post("/login", response_model=Token)
def login(body: Credentials):
    row = user_crud.get_by_email(body.email)
    if row is None or not verify_password(body.password, row["pw"]):
        raise HTTPException(401, "bad credentials")
    if not row["is_active"]:
        raise HTTPException(403, "account is inactive")
    return Token(token=create_token(row["id"]))


@router.get("/me", response_model=User)
def me(user: User = Depends(current_user)):
    return user
