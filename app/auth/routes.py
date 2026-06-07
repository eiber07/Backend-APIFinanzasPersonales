# Defines authentication rputes
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from ..dependecies import authentication_user, get_user
from ..database.database import get_db
from .utils import create_access_token , get_password_hash
from ..auth.model import Token
from .schemas import UserCreate, UserResponse
from ..models.user import User

router = APIRouter()

@router.post("token", response_model=Token)
def login_for_access_token(form_fata: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authentication_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrecta",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/signup", response_model=UserResponse)
def signup(user: UserCreate, db: Session = Depends(get_db)):
    db_user = get_user(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Usuario ya se encuentra registrado")
    hashed_password = get_password_hash(user.password)
    db_user = User(username=user.username, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user