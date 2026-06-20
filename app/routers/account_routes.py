from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.auth.dependencies import get_current_user
from app.dals.account_dal import AccountDAL
from app.dals.status_dal import StatusDAL
from app.database.database import get_db
from app.models.user import User
from app.schemas.account import AccountCreate, AccountResponse
from app.services.account_service import AccountService


router = APIRouter()

@router.get("/user", response_model=list[AccountResponse])
async def get_accounts_by_user(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    account_dal = AccountDAL(db)
    status_dal = StatusDAL(db)
    account_service = AccountService(account_dal, status_dal)
    return await account_service.get_by_current_user(current_user)

@router.post("/",response_model=AccountResponse)
async def create_account(
    account: AccountCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    account_dal = AccountDAL(db)
    status_dal = StatusDAL(db)
    account_service = AccountService(account_dal, status_dal)
    return await account_service.create_account(account, current_user)