from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.auth.dependencies import get_current_user
from app.dals.transaction_dal import TransactionDAL
from app.dals.status_dal import StatusDAL
from app.dals.account_dal import AccountDAL
from app.dals.group_account_member_dal import GroupAccountMemberDAL
from app.database.database import get_db
from app.models.user import User
from app.schemas.transaction import TransactionCreate, TransactionRequest, TransactionResponse
from app.services.transaction_service import TransactionService
from app.services.group_settlement_service import GroupSettlementService

router = APIRouter()

def get_transaction_service(db: AsyncSession = Depends(get_db)) -> TransactionService:
    return TransactionService(
        TransactionDAL(db),
        StatusDAL(db),
        AccountDAL(db)
    )


def get_group_settlement_service(db: AsyncSession = Depends(get_db)) -> GroupSettlementService:
    return GroupSettlementService(
        TransactionDAL(db),
        GroupAccountMemberDAL(db),
        AccountDAL(db),
    )

@router.get("/account/{account_id}", response_model=list[TransactionResponse])
async def get_transactions_by_account(
    account_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    service: TransactionService = Depends(get_transaction_service)
):
    return await service.get_by_account_id(account_id, current_user)

@router.get("/{transaction_id}", response_model=TransactionResponse)
async def get_transaction_by_id(
    transaction_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    service: TransactionService = Depends(get_transaction_service)
):
    return await service.get_by_id(transaction_id, current_user)

@router.post("/", response_model=TransactionResponse)
async def create_transaction(
    transaction: TransactionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    service: TransactionService = Depends(get_transaction_service)
):
    return await service.create_transaction(transaction, current_user)

@router.put("/", response_model=TransactionResponse)
async def update_transaction(
    transaction: TransactionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    service: TransactionService = Depends(get_transaction_service)
):
    return await service.update_transaction(transaction, current_user)

@router.put("/deactivate/{transaction_id}", response_model=dict)
async def deactivate_transaction(
    transaction_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    service: TransactionService = Depends(get_transaction_service)
):
    return await service.deactivate_transaction(transaction_id, current_user)


@router.get("/group-settlement/{account_id}", response_model=dict)
async def get_group_settlement(
    account_id: int,
    month: int | None = None,
    year: int | None = None,
    current_user: User = Depends(get_current_user),
    service: GroupSettlementService = Depends(get_group_settlement_service),
):
    return await service.calculate_settlement(account_id, current_user, month=month, year=year)