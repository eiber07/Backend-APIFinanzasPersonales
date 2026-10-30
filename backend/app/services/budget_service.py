from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError

from app.dals.account_dal import AccountDAL
from app.dals.budget_dal import BudgetDAL
from app.dals.group_account_member_dal import GroupAccountMemberDAL
from app.dals.transaction_category_dal import TransactionCategoryDAL
from app.models.budget import Budget, BudgetItem
from app.models.account import Account
from app.models.transaction_category import TransactionCategory
from app.models.user import User
from app.schemas.budget import (
    BudgetCategoryAmount,
    BudgetCreate,
    BudgetItemCreate,
    BudgetItemResponse,
    BudgetItemUpdate,
    BudgetResponse,
    BudgetUpdate,
)
from app.constants.transaction_types import TRANSACTION_TYPE_EXPENSE


class BudgetService:
    def __init__(
        self,
        budget_dal: BudgetDAL,
        account_dal: AccountDAL,
        category_dal: TransactionCategoryDAL,
        group_member_dal: GroupAccountMemberDAL,
    ):
        self.budget_dal = budget_dal
        self.account_dal = account_dal
        self.category_dal = category_dal
        self.group_member_dal = group_member_dal

    async def _validate_account_access(
        self,
        account_id: int,
        current_user: User,
    ) -> Account:
        account = await self.account_dal.get_account_by_id(account_id)
        if account is None:
            raise HTTPException(status_code=404, detail="La cuenta no existe.")
        if account.id_admin_user == current_user.id:
            return account
        if account.account_type_id == 2:
            members = await self.group_member_dal.get_by_account_id(account_id)
            if current_user.id in {member.user_id for member in members}:
                return account
        raise HTTPException(
            status_code=403,
            detail="No tienes permiso para acceder a esta cuenta.",
        )

    async def _validate_category(
        self,
        category_id: int,
        account: Account,
        current_user: User,
    ) -> TransactionCategory:
        category = await self.category_dal.get_by_id(category_id)
        if category is None:
            raise HTTPException(status_code=404, detail="La categoría no existe.")
        if category.transaction_type != TRANSACTION_TYPE_EXPENSE:
            raise HTTPException(
                status_code=400,
                detail="Solo se pueden presupuestar categorías de egreso.",
            )

        is_global = (
            category.owner_id is None
            and category.group_id is None
            and category.account_id is None
        )
        if is_global:
            return category
        if category.account_id is not None:
            if account.account_type_id == 1 and category.account_id == account.id:
                return category
        elif category.group_id is not None:
            if account.account_type_id == 2 and category.group_id == account.id:
                return category
        elif account.account_type_id == 1 and category.owner_id == current_user.id:
            return category
        raise HTTPException(
            status_code=403,
            detail="La categoría no está disponible para esta cuenta.",
        )

    def _response(self, budget: Budget) -> BudgetResponse:
        return BudgetResponse(
            id=budget.id,
            account_id=budget.account_id,
            items=[
                BudgetItemResponse(
                    id=item.id,
                    category_id=item.category_id,
                    category_name=item.category.name,
                    parent_category_id=item.category.parent_category_id,
                    target_amount=item.target_amount,
                )
                for item in budget.items
            ],
        )

    async def _validate_items(
        self,
        items: list[BudgetItemCreate],
        account: Account,
        current_user: User,
    ) -> None:
        for item in items:
            await self._validate_category(
                item.category_id,
                account,
                current_user,
            )

    async def create(self, data: BudgetCreate, current_user: User):
        account = await self._validate_account_access(data.account_id, current_user)
        await self._validate_items(data.items, account, current_user)
        budget = Budget(
            account_id=account.id,
            items=[
                BudgetItem(
                    category_id=item.category_id,
                    target_amount=item.target_amount,
                )
                for item in data.items
            ],
        )
        try:
            created = await self.budget_dal.create(budget)
        except IntegrityError as error:
            await self.budget_dal.db.rollback()
            raise HTTPException(
                status_code=409,
                detail="Ya existe un presupuesto para esta cuenta.",
            ) from error
        return self._response(created)

    async def list_for_account(
        self,
        account_id: int,
        current_user: User,
    ):
        await self._validate_account_access(account_id, current_user)
        budget = await self.budget_dal.get_by_account(account_id)
        return [self._response(budget)] if budget is not None else []

    async def _get_accessible_budget(self, budget_id: int, current_user: User):
        budget = await self.budget_dal.get_by_id(budget_id)
        if budget is None:
            raise HTTPException(status_code=404, detail="El presupuesto no existe.")
        await self._validate_account_access(budget.account_id, current_user)
        return budget

    async def get_by_id(self, budget_id: int, current_user: User):
        budget = await self._get_accessible_budget(budget_id, current_user)
        return self._response(budget)

    async def add_item(
        self,
        budget_id: int,
        data: BudgetItemCreate,
        current_user: User,
    ):
        budget = await self._get_accessible_budget(budget_id, current_user)
        account = await self._validate_account_access(
            budget.account_id,
            current_user,
        )
        category = await self._validate_category(
            data.category_id,
            account,
            current_user,
        )
        if any(item.category_id == category.id for item in budget.items):
            raise HTTPException(
                status_code=409,
                detail="La categoría ya tiene un objetivo en este presupuesto.",
            )

        budget.items.append(
            BudgetItem(
                category_id=category.id,
                target_amount=data.target_amount,
                category=category,
            )
        )
        try:
            updated = await self.budget_dal.update(budget)
        except IntegrityError as error:
            await self.budget_dal.db.rollback()
            raise HTTPException(
                status_code=409,
                detail="La categoría ya tiene un objetivo en este presupuesto.",
            ) from error
        return self._response(updated)

    async def update(
        self,
        budget_id: int,
        data: BudgetUpdate,
        current_user: User,
    ):
        budget = await self._get_accessible_budget(budget_id, current_user)
        account = await self._validate_account_access(budget.account_id, current_user)

        try:
            if data.items is not None:
                await self._validate_items(data.items, account, current_user)
                budget.items.clear()
                await self.budget_dal.db.flush()
                budget.items.extend(
                    BudgetItem(
                        category_id=item.category_id,
                        target_amount=item.target_amount,
                    )
                    for item in data.items
                )
            updated = await self.budget_dal.update(budget)
        except IntegrityError as error:
            await self.budget_dal.db.rollback()
            raise HTTPException(
                status_code=409,
                detail="No se pudo actualizar el presupuesto por un conflicto de datos.",
            ) from error
        return self._response(updated)

    async def update_item(
        self,
        budget_id: int,
        item_id: int,
        data: BudgetItemUpdate,
        current_user: User,
    ):
        budget = await self._get_accessible_budget(budget_id, current_user)
        item = await self.budget_dal.get_item(budget_id, item_id)
        if item is None:
            raise HTTPException(status_code=404, detail="El ítem no existe.")
        if data.category_id is not None:
            account = await self._validate_account_access(
                budget.account_id,
                current_user,
            )
            category = await self._validate_category(
                data.category_id,
                account,
                current_user,
            )
            if any(
                current_item.id != item_id
                and current_item.category_id == data.category_id
                for current_item in budget.items
            ):
                raise HTTPException(
                    status_code=409,
                    detail="La categoría ya está presupuestada en esta cuenta.",
                )
            item.category = category
            item.category_id = category.id
        if data.target_amount is not None:
            item.target_amount = data.target_amount
        try:
            await self.budget_dal.update(budget)
        except IntegrityError as error:
            await self.budget_dal.db.rollback()
            raise HTTPException(
                status_code=409,
                detail="No se pudo actualizar el ítem del presupuesto.",
            ) from error
        return self._response(await self.budget_dal.get_by_id(budget_id))

    async def delete_item(
        self,
        budget_id: int,
        item_id: int,
        current_user: User,
    ):
        await self._get_accessible_budget(budget_id, current_user)
        item = await self.budget_dal.get_item(budget_id, item_id)
        if item is None:
            raise HTTPException(status_code=404, detail="El ítem no existe.")
        await self.budget_dal.delete_item(item)
        return {"success": True, "message": "Ítem del presupuesto eliminado."}

    async def delete(self, budget_id: int, current_user: User):
        budget = await self._get_accessible_budget(budget_id, current_user)
        await self.budget_dal.delete(budget)
        return {"success": True, "message": "Presupuesto eliminado."}

    async def get_categories(
        self,
        account_id: int,
        current_user: User,
    ):
        await self._validate_account_access(account_id, current_user)
        budget = await self.budget_dal.get_by_account(account_id)
        if budget is None:
            return {
                "has_budget": False,
                "account_id": account_id,
                "categories": [],
            }
        return {
            "has_budget": True,
            "account_id": account_id,
            "categories": [
                BudgetCategoryAmount(
                    category_id=item.category_id,
                    category_name=item.category.name,
                    parent_category_id=item.category.parent_category_id,
                    target_amount=item.target_amount,
                )
                for item in budget.items
            ],
        }
