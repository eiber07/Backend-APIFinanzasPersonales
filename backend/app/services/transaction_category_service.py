from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError

from app.dals.transaction_category_dal import TransactionCategoryDAL
from app.models.transaction_category import TransactionCategory
from app.models.user import User
from app.schemas.transaction_category import (
    TransactionCategoryCreate,
    TransactionCategoryResponse,
    TransactionCategorySummary,
    TransactionCategoryUpdate,
)


class TransactionCategoryService:
    def __init__(self, category_dal: TransactionCategoryDAL):
        self.category_dal = category_dal

    async def _visible_categories(self, current_user: User):
        group_ids = await self.category_dal.get_group_ids_for_user(current_user.id)
        account_ids = (
            await self.category_dal.get_personal_account_ids_for_user(
                current_user.id
            )
        )
        categories = await self.category_dal.get_visible_categories(
            current_user.id,
            group_ids,
            account_ids,
        )
        return categories, {category.id: category for category in categories}

    def _summary(self, category: TransactionCategory) -> TransactionCategorySummary:
        return TransactionCategorySummary(
            id=category.id,
            name=category.name,
            parent_category_id=category.parent_category_id,
            owner_id=category.owner_id,
            group_id=category.group_id,
            account_id=category.account_id,
        )

    def _response(
        self,
        category: TransactionCategory,
        visible_by_id: dict[int, TransactionCategory],
    ) -> TransactionCategoryResponse:
        parent = visible_by_id.get(category.parent_category_id)
        children = [
            self._summary(child)
            for child in visible_by_id.values()
            if child.parent_category_id == category.id
        ]
        return TransactionCategoryResponse(
            id=category.id,
            name=category.name,
            parent_category_id=category.parent_category_id,
            owner_id=category.owner_id,
            group_id=category.group_id,
            account_id=category.account_id,
            parent=self._summary(parent) if parent is not None else None,
            children=children,
        )

    async def get_all(self, current_user: User):
        categories, visible_by_id = await self._visible_categories(current_user)
        return [
            self._response(category, visible_by_id)
            for category in categories
        ]

    async def get_by_id(self, category_id: int, current_user: User):
        _, visible_by_id = await self._visible_categories(current_user)
        category = visible_by_id.get(category_id)
        if category is None:
            raise HTTPException(status_code=404, detail="La categoría no existe.")
        return self._response(category, visible_by_id)

    async def _get_parent(
        self,
        parent_category_id: int,
        current_user: User,
        category_id: int | None,
        group_id: int | None,
        account_id: int | None,
    ) -> TransactionCategory:
        if parent_category_id == category_id:
            raise HTTPException(
                status_code=400,
                detail="Una categoría no puede ser su propia categoría padre.",
            )

        parent = await self.category_dal.get_by_id(parent_category_id)
        if parent is None:
            raise HTTPException(status_code=404, detail="La categoría padre no existe.")

        group_ids = await self.category_dal.get_group_ids_for_user(current_user.id)
        account_ids = (
            await self.category_dal.get_personal_account_ids_for_user(
                current_user.id
            )
        )
        is_visible = (
            (
                parent.owner_id is None
                and parent.group_id is None
                and parent.account_id is None
            )
            or (
                parent.owner_id == current_user.id
                and parent.group_id is None
                and parent.account_id is None
            )
            or parent.group_id in group_ids
            or parent.account_id in account_ids
        )
        if not is_visible:
            raise HTTPException(status_code=404, detail="La categoría padre no existe.")

        if parent.parent_category_id is not None:
            raise HTTPException(
                status_code=400,
                detail="La jerarquía de categorías admite como máximo dos niveles.",
            )

        same_scope = (
            (
                parent.owner_id is None
                and parent.group_id is None
                and parent.account_id is None
            )
            or (
                group_id is not None
                and parent.group_id == group_id
            )
            or (
                account_id is not None
                and parent.account_id == account_id
            )
            or (
                account_id is not None
                and parent.account_id is None
                and parent.group_id is None
                and parent.owner_id == current_user.id
            )
            or (
                group_id is None
                and account_id is None
                and parent.group_id is None
                and parent.account_id is None
                and parent.owner_id == current_user.id
            )
        )
        if not same_scope:
            raise HTTPException(
                status_code=400,
                detail="La categoría padre debe ser global o pertenecer al mismo ámbito.",
            )
        return parent

    async def create(
        self,
        data: TransactionCategoryCreate,
        current_user: User,
    ):
        name = data.name.strip()
        if not name:
            raise HTTPException(status_code=422, detail="El nombre es obligatorio.")

        if await self.category_dal.get_by_name(name) is not None:
            raise HTTPException(status_code=409, detail="Ya existe una categoría con ese nombre.")

        if data.group_id is not None and data.account_id is not None:
            raise HTTPException(
                status_code=422,
                detail="Envía solo uno de los campos group_id o account_id.",
            )

        requested_account_id = (
            data.account_id if data.account_id is not None else data.group_id
        )
        group_id = None
        account_id = None
        if requested_account_id is not None:
            account = await self.category_dal.get_accessible_account(
                requested_account_id,
                current_user.id,
            )
            if account is None:
                raise HTTPException(
                    status_code=404,
                    detail="La cuenta no existe o no tienes acceso.",
                )
            if account.account_type_id == 2:
                group_id = account.id
            elif account.account_type_id == 1:
                account_id = account.id
            else:
                raise HTTPException(
                    status_code=400,
                    detail="Las categorías personalizadas requieren una cuenta personal o grupal.",
                )

        if data.parent_category_id is not None:
            await self._get_parent(
                data.parent_category_id,
                current_user,
                category_id=None,
                group_id=group_id,
                account_id=account_id,
            )

        category = TransactionCategory(
            name=name,
            parent_category_id=data.parent_category_id,
            owner_id=current_user.id,
            group_id=group_id,
            account_id=account_id,
        )
        try:
            await self.category_dal.create(category)
        except IntegrityError as error:
            await self.category_dal.db.rollback()
            raise HTTPException(
                status_code=409,
                detail="No se pudo crear la categoría por un conflicto de datos.",
            ) from error

        return await self.get_by_id(category.id, current_user)

    async def _get_managed_category(
        self,
        category_id: int,
        current_user: User,
    ) -> TransactionCategory:
        category = await self.category_dal.get_by_id(category_id)
        if category is None:
            raise HTTPException(status_code=404, detail="La categoría no existe.")

        if (
            category.owner_id is None
            and category.group_id is None
            and category.account_id is None
        ):
            raise HTTPException(
                status_code=403,
                detail="Las categorías estándar no se pueden modificar.",
            )

        if category.group_id is not None:
            if not await self.category_dal.user_can_access_group(
                category.group_id,
                current_user.id,
            ):
                raise HTTPException(status_code=404, detail="La categoría no existe.")
        elif category.owner_id != current_user.id:
            raise HTTPException(status_code=404, detail="La categoría no existe.")
        if category.account_id is not None:
            account = await self.category_dal.get_accessible_account(
                category.account_id,
                current_user.id,
            )
            if account is None or account.account_type_id != 1:
                raise HTTPException(status_code=404, detail="La categoría no existe.")
        return category

    async def update(
        self,
        category_id: int,
        data: TransactionCategoryUpdate,
        current_user: User,
    ):
        category = await self._get_managed_category(category_id, current_user)
        if data.name is not None:
            name = data.name.strip()
            if not name:
                raise HTTPException(status_code=422, detail="El nombre no puede estar vacío.")
            duplicate = await self.category_dal.get_by_name(name)
            if duplicate is not None and duplicate.id != category.id:
                raise HTTPException(status_code=409, detail="Ya existe una categoría con ese nombre.")
            category.name = name

        if "parent_category_id" in data.model_fields_set:
            if data.parent_category_id is not None:
                if await self.category_dal.get_children(category.id):
                    raise HTTPException(
                        status_code=400,
                        detail="Una categoría con subcategorías no puede convertirse en subcategoría.",
                    )
                await self._get_parent(
                    data.parent_category_id,
                    current_user,
                    category_id=category.id,
                    group_id=category.group_id,
                    account_id=category.account_id,
                )
            category.parent_category_id = data.parent_category_id

        try:
            await self.category_dal.update(category)
        except IntegrityError as error:
            await self.category_dal.db.rollback()
            raise HTTPException(
                status_code=409,
                detail="No se pudo actualizar la categoría por un conflicto de datos.",
            ) from error

        return await self.get_by_id(category.id, current_user)

    async def delete(self, category_id: int, current_user: User):
        category = await self._get_managed_category(category_id, current_user)
        if await self.category_dal.get_children(category_id):
            raise HTTPException(
                status_code=409,
                detail="No se puede eliminar una categoría que tiene subcategorías.",
            )
        if await self.category_dal.has_transactions(category_id):
            raise HTTPException(
                status_code=409,
                detail="No se puede eliminar una categoría asociada a transacciones.",
            )

        try:
            await self.category_dal.delete(category)
        except IntegrityError as error:
            await self.category_dal.db.rollback()
            raise HTTPException(
                status_code=409,
                detail="No se puede eliminar una categoría que está siendo utilizada.",
            ) from error
        return {"message": "Categoría eliminada exitosamente.", "success": True}
