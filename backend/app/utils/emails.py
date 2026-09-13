from datetime import datetime, timedelta
from jose import JWTError, jwt
from app.core.config import settings    

def create_reset_password_token(email: str):
    data = {"sub": email, "exp": datetime.utcnow() + timedelta(minutes=10)}
    return jwt.encode(data, settings.FORGET_PWD_SECRET_KEY, algorithm=settings.ALGORITHM)

def decode_reset_password_token(token: str):
    try:
        payload = jwt.decode(token, settings.FORGET_PWD_SECRET_KEY,
                             algorithms=[settings.ALGORITHM])
        return payload.get("sub")
    except JWTError:
        return None