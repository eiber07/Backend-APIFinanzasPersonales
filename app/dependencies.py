from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from .auth.utils import verify_password, SECRET_KEY, ALGORITHM
from .auth.model import TokenData
from .models.user import User
from .database.database import engine, Base, get_db

oath2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

def get_user(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()

def authentication_user(db: Session, username: str, password: str):
    user = get_user(db, username)
    if not user:
        return False
    if not verify_password(password, user.password):
        return False
    return user

def get_current_user(db: Session = Depends(get_db), token: str = Depends(oath2_scheme)):
    credentials_exception = HTTPException(
        status_code = status.HTTP_401_UNAUTHORIZED,
        detail = "No se logro validar las credenciales de usuario.",
        headers = {"WWW-Authenticate": "Bearer"}
        )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms = [ALGORITHM])
        username : str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = get_user(db, username = token_data.username)
    if user is None:
        raise credentials_exception
    return user