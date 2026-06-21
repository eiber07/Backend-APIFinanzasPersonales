from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.auth.dependencies import get_current_user
from app.dals.planned_expense_dal import PlannedExpenseDAL
from app.dals.status_dal import StatusDAL
from app.dals.account_dal import AccountDAL
from app.database.database import get_db
from app.models.user import User
from app.schemas.planned_expense import PlannedExpenseCreate, PlannedExpenseRequest, PlannedExpenseResponse
from app.services.planned_expense_service import PlannedExpenseService

router = APIRouter()

def get_planned_expense_service(db: AsyncSession = Depends(get_db)) -> PlannedExpenseService:
    return PlannedExpenseService(
        PlannedExpenseDAL(db),
        StatusDAL(db),
        AccountDAL(db)
    )

@router.get("/account/{account_id}", response_model=list[PlannedExpenseResponse])
async def get_planned_expense_by_account(
    account_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    service: PlannedExpenseService = Depends(get_planned_expense_service)
):
    return await service.get_by_account_id(account_id, current_user)

@router.get("/{planned_expense_id}", response_model=PlannedExpenseResponse)
async def get_planned_expense_by_id(
    planned_expense_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    service: PlannedExpenseService = Depends(get_planned_expense_service)
):
    return await service.get_by_id(planned_expense_id, current_user)

@router.post("/", response_model=PlannedExpenseResponse)
async def create_planned_expenses(
    planned_expense: PlannedExpenseCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    service: PlannedExpenseService = Depends(get_planned_expense_service)
):
    return await service.create_planed_expense(planned_expense, current_user)

@router.put("/", response_model=PlannedExpenseResponse)
async def update_planned_expense(
    planned_expense: PlannedExpenseRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    service: PlannedExpenseService = Depends(get_planned_expense_service)
):
    return await service.update_planned_expense(planned_expense, current_user)

@router.put("/deactivate/{planned_expense_id}", response_model=dict)
async def deactivate_planned_expense(
    planned_expense_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    service: PlannedExpenseService = Depends(get_planned_expense_service)
):
    return await service.deactivate_planned_expense(planned_expense_id, current_user)