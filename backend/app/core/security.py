"""Password hashing and bearer tokens. No third-party crypto: stdlib scrypt + HMAC."""

import base64
import hashlib
import hmac
import json
import os
import time

from .config import SECRET_KEY, TOKEN_TTL


def hash_password(password: str, salt: bytes | None = None) -> str:
    salt = salt or os.urandom(16)
    h = hashlib.scrypt(password.encode(), salt=salt, n=16384, r=8, p=1)
    return f"{salt.hex()}:{h.hex()}"


def verify_password(password: str, stored: str) -> bool:
    salt, _ = stored.split(":")
    return hmac.compare_digest(hash_password(password, bytes.fromhex(salt)), stored)


def _b64(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode().rstrip("=")


def _unb64(s: str) -> bytes:
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))


def _sign(payload: str) -> str:
    return _b64(hmac.new(SECRET_KEY, payload.encode(), hashlib.sha256).digest())


def create_token(user_id: int) -> str:
    # ponytail: HMAC-signed token, not JWT; swap for PyJWT if a third party must verify it
    payload = _b64(json.dumps({"sub": user_id, "exp": int(time.time()) + TOKEN_TTL}).encode())
    return f"{payload}.{_sign(payload)}"


def read_token(token: str) -> int | None:
    """Return the user id, or None if the token is malformed, forged or expired."""
    try:
        payload, sig = token.split(".")
        if not hmac.compare_digest(sig, _sign(payload)):
            return None
        claims = json.loads(_unb64(payload))
        return claims["sub"] if claims["exp"] > time.time() else None
    except Exception:
        return None
