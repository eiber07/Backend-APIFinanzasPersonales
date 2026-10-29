
from datetime import datetime, timedelta, timezone
import hashlib
import hmac

from jose import JWTError, jwt
from app.core.config import settings


def _password_marker(password_hash: str) -> str:
    return hmac.new(
        settings.FORGET_PWD_SECRET_KEY.encode("utf-8"),
        password_hash.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()


def create_reset_password_token(email: str, password_hash: str):
    data = {
        "sub": email,
        "purpose": "password_reset",
        "pwdv": _password_marker(password_hash),
        "exp": datetime.now(timezone.utc) + timedelta(
            minutes=settings.FORGET_PASSWORD_LINK_EXPIRE_MINUTES
        )
    }

    return jwt.encode(
        data,
        settings.FORGET_PWD_SECRET_KEY,
        algorithm=settings.ALGORITHM
    )


def decode_reset_password_token(token: str):
    try:
        payload = jwt.decode(
            token,
            settings.FORGET_PWD_SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )

        email = payload.get("sub")

        if payload.get("purpose") != "password_reset":
            return None

        return email if isinstance(email, str) and email else None

    except JWTError:
        return None


def validate_reset_password_token(token: str, password_hash: str):
    try:
        payload = jwt.decode(
            token,
            settings.FORGET_PWD_SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )

        marker = payload.get("pwdv")

        if not isinstance(marker, str):
            return False

        return (
            payload.get("purpose") == "password_reset"
            and hmac.compare_digest(
                marker,
                _password_marker(password_hash)
            )
        )

    except JWTError:
        return False
