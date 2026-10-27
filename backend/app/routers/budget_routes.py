from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.dals.account_dal import AccountDAL
from app.dals.budget_dal import BudgetDAL
from app.dals.group_account_member_dal import GroupAccountMemberDAL
from app.dals.transaction_category_dal import TransactionCategoryDAL
from app.database.database import get_db
from app.models.user import User
from app.schemas.budget import (
    BudgetCategoriesResponse,
    BudgetCreate,
    BudgetItemCreate,
    BudgetItemUpdate,
    BudgetResponse,
    BudgetUpdate,
)
from app.services.budget_service import BudgetService


router = APIRouter()


def get_budget_service(db: AsyncSession = Depends(get_db)) -> BudgetService:
    return BudgetService(
        BudgetDAL(db),
        AccountDAL(db),
        TransactionCategoryDAL(db),
        GroupAccountMemberDAL(db),
    )


@router.post("/", response_model=BudgetResponse, status_code=201)
async def create_budget(
    data: BudgetCreate,
    current_user: User = Depends(get_current_user),
    service: BudgetService = Depends(get_budget_service),
):
    return await service.create(data, current_user)


@router.get("/account/{account_id}", response_model=list[BudgetResponse])
async def list_budgets(
    account_id: int,
    current_user: User = Depends(get_current_user),
    service: BudgetService = Depends(get_budget_service),
):
    return await service.list_for_account(account_id, current_user)


@router.get(
    "/account/{account_id}/categories",
    response_model=BudgetCategoriesResponse,
)
async def get_budget_categories(
    account_id: int,
    current_user: User = Depends(get_current_user),
    service: BudgetService = Depends(get_budget_service),
):
    return await service.get_categories(account_id, current_user)


@router.get("/{budget_id}", response_model=BudgetResponse)
async def get_budget(
    budget_id: int,
    current_user: User = Depends(get_current_user),
    service: BudgetService = Depends(get_budget_service),
):
    return await service.get_by_id(budget_id, current_user)


@router.post("/{budget_id}/items", response_model=BudgetResponse, status_code=201)
async def add_budget_item(
    budget_id: int,
    data: BudgetItemCreate,
    current_user: User = Depends(get_current_user),
    service: BudgetService = Depends(get_budget_service),
):
    return await service.add_item(budget_id, data, current_user)


@router.put("/{budget_id}", response_model=BudgetResponse)
async def update_budget(
    budget_id: int,
    data: BudgetUpdate,
    current_user: User = Depends(get_current_user),
    service: BudgetService = Depends(get_budget_service),
):
    return await service.update(budget_id, data, current_user)


@router.put("/{budget_id}/items/{item_id}", response_model=BudgetResponse)
async def update_budget_item(
    budget_id: int,
    item_id: int,
    data: BudgetItemUpdate,
    current_user: User = Depends(get_current_user),
    service: BudgetService = Depends(get_budget_service),
):
    return await service.update_item(budget_id, item_id, data, current_user)


@router.delete("/{budget_id}/items/{item_id}", response_model=dict)
async def delete_budget_item(
    budget_id: int,
    item_id: int,
    current_user: User = Depends(get_current_user),
    service: BudgetService = Depends(get_budget_service),
):
    return await service.delete_item(budget_id, item_id, current_user)


@router.delete("/{budget_id}", response_model=dict)
async def delete_budget(
    budget_id: int,
    current_user: User = Depends(get_current_user),
    service: BudgetService = Depends(get_budget_service),
):
    return await service.delete(budget_id, current_user)
