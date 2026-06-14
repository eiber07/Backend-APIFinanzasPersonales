from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..auth.dependencies import get_current_user
from ..database.database import get_db
from ..schemas.user import UserResponse
from ..models.user import User as UserModel

router = APIRouter()

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: UserModel = Depends(get_current_user)):
    return current_user