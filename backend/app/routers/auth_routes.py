# Defines authentication rputes
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.dals.account_dal import AccountDAL
from app.dals.account_type_dal import AccountTypeDAL
from app.dals.status_dal import StatusDAL
from app.services.auth_service import AuthService
from app.database.database import get_db
from app.auth.password import verify_password, get_password_hash
from app.auth.jwt import create_access_token
from app.schemas.token import Token
from app.schemas.user import UserCreate, UserLogin, UserResponse
from app.models.user import User
from app.services.user_service import UserService
from app.dals.user_dal import UserDAL

router = APIRouter()

@router.post("/signup")
async def signup(user: UserCreate, db: AsyncSession = Depends(get_db)):
    user_dal = UserDAL(db)
    account_dal = AccountDAL(db)
    status_dal = StatusDAL(db)
    account_type_dal = AccountTypeDAL(db)
    user_service = UserService(user_dal,account_dal,status_dal,account_type_dal)
    return await user_service.create(user)

@router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    user_dal = UserDAL(db)
    account_dal = AccountDAL(db)
    status_dal = StatusDAL(db)
    account_type_dal = AccountTypeDAL(db)
    user_service = UserService(user_dal,account_dal,status_dal,account_type_dal)
    auth_service = AuthService(user_service)
    
    return await auth_service.authenticate_user(form_data.username, form_data.password)