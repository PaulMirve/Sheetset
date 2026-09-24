import hmac

from fastapi import Depends, Header, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from ..core import config
from ..core.security import read_token
from ..crud import user as user_crud
from ..db.models import User
from ..db.session import get_db

bearer = HTTPBearer(auto_error=False)


def current_user(
    cred: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    """Auth dependency for protected routes: `user: User = Depends(current_user)`."""
    user_id = read_token(cred.credentials) if cred else None
    user = user_crud.get_by_id(db, user_id) if user_id else None
    if user is None:
        raise HTTPException(401, "invalid token")
    if not user.is_active:
        raise HTTPException(403, "account is inactive")
    return user


def n8n_key(x_api_key: str = Header("")) -> None:
    """Auth dependency for machine-to-machine routes called by n8n."""
    if not config.N8N_API_KEY or not hmac.compare_digest(x_api_key, config.N8N_API_KEY):
        raise HTTPException(401, "invalid api key")
