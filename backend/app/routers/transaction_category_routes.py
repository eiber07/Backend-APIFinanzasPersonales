from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.dals.transaction_category_dal import TransactionCategoryDAL
from app.database.database import get_db
from app.models.user import User
from app.schemas.transaction_category import (
    TransactionCategoryCreate,
    TransactionCategoryResponse,
    TransactionCategoryUpdate,
)
from app.services.transaction_category_service import TransactionCategoryService


router = APIRouter()


def get_transaction_category_service(
    db: AsyncSession = Depends(get_db),
) -> TransactionCategoryService:
    return TransactionCategoryService(TransactionCategoryDAL(db))


@router.get("/", response_model=list[TransactionCategoryResponse])
async def get_transaction_categories(
    current_user: User = Depends(get_current_user),
    service: TransactionCategoryService = Depends(get_transaction_category_service),
):
    return await service.get_all(current_user)


@router.get("/{category_id}", response_model=TransactionCategoryResponse)
async def get_transaction_category(
    category_id: int,
    current_user: User = Depends(get_current_user),
    service: TransactionCategoryService = Depends(get_transaction_category_service),
):
    return await service.get_by_id(category_id, current_user)


@router.post(
    "/",
    response_model=TransactionCategoryResponse,
    status_code=201,
)
async def create_transaction_category(
    data: TransactionCategoryCreate,
    current_user: User = Depends(get_current_user),
    service: TransactionCategoryService = Depends(get_transaction_category_service),
):
    return await service.create(data, current_user)


@router.put("/{category_id}", response_model=TransactionCategoryResponse)
async def update_transaction_category(
    category_id: int,
    data: TransactionCategoryUpdate,
    current_user: User = Depends(get_current_user),
    service: TransactionCategoryService = Depends(get_transaction_category_service),
):
    return await service.update(category_id, data, current_user)


@router.delete("/{category_id}", response_model=dict)
async def delete_transaction_category(
    category_id: int,
    current_user: User = Depends(get_current_user),
    service: TransactionCategoryService = Depends(get_transaction_category_service),
):
    return await service.delete(category_id, current_user)
