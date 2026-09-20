from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from ..core.security import read_token
from ..crud import user as user_crud
from ..schemas.user import User

bearer = HTTPBearer(auto_error=False)


def current_user(cred: HTTPAuthorizationCredentials | None = Depends(bearer)) -> User:
    """Auth dependency for protected routes: `user: User = Depends(current_user)`."""
    user_id = read_token(cred.credentials) if cred else None
    row = user_crud.get_by_id(user_id) if user_id else None
    if row is None:
        raise HTTPException(401, "invalid token")
    if not row["is_active"]:
        raise HTTPException(403, "account is inactive")
    return User(**dict(row))
