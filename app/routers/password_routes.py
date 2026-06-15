from fastapi import APIRouter, BackgroundTasks, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.database import get_db
from app.dals.user_dal import UserDAL
from app.schemas.password import (
    ForgetPasswordRequest,
    ResetForegetPassword,
    SuccessMessage,
)
from app.services.password_service import PasswordService
from app.services.user_service import UserService

router = APIRouter()


@router.post("/forget-password", response_model=SuccessMessage)
async def forget_password(
    request: ForgetPasswordRequest,
    background: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    user_dal = UserDAL(db)
    user_service = UserService(user_dal)
    password_service = PasswordService(user_service)

    return await password_service.forget_password(
        forget_password_request=request,
        background=background,
    )


@router.post("/reset-password", response_model=SuccessMessage)
async def reset_password(
    request: ResetForegetPassword,
    db: AsyncSession = Depends(get_db),
):
    user_dal = UserDAL(db)
    user_service = UserService(user_dal)
    password_service = PasswordService(user_service)

    return await password_service.reset_password(request)