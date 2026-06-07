from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..dependecies import get_current_user
from ..database.database import get_db
from ..schemas.user import User
from .user import User as UserModel

router = APIRouter()

@router.get("/me", response_model=User)
def read_users_me(current_user: UserModel = Depends(get_current_user)):
    return current_user