from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.dals.account_dal import AccountDAL
from app.dals.account_type_dal import AccountTypeDAL
from app.dals.status_dal import StatusDAL
from app.dals.user_dal import UserDAL
from app.services.user_service import UserService
from ..auth.dependencies import get_current_user
from ..database.database import get_db
from ..schemas.user import UserResponse
from ..models.user import User as UserModel

router = APIRouter()

def get_user_service(db: AsyncSession = Depends(get_db)) -> UserService:
    return UserService(
        UserDAL(db),
        AccountDAL(db),
        StatusDAL(db),
        AccountTypeDAL(db)
    )

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: UserModel = Depends(get_current_user)):
    return current_user

@router.get("/by_id", response_model=UserResponse)
async def read_users_me(
    id: int,
    service: UserService= Depends(get_user_service)
    ):
    return await service.get_by_id(id)