from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from app.dals.user_dal import UserDAL
from app.database.database import get_db
from app.core.config import settings
from ..schemas.token import TokenData
from ..models.user import User

oath2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

def get_current_user(
        db: Session = Depends(get_db),
        token: str = Depends(oath2_scheme)):
    credentials_exception = HTTPException(
        status_code = status.HTTP_401_UNAUTHORIZED,
        detail = "No se logro validar las credenciales de usuario.",
        headers = {"WWW-Authenticate": "Bearer"}
        )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms = [settings.ALGORITHM])
        username : str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    
    user_dal = UserDAL(db)
    user = user_dal.get_by_username(token_data.username)
    if user is None:
        raise credentials_exception
    return user