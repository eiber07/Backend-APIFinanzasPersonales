from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.account import Account
from app.models.group_account_member import GroupAccountMember
from app.models.transaction import Transaction
from app.models.transaction_category import TransactionCategory


class TransactionCategoryDAL:
    def __init__(self, db: AsyncSession):
        self.db = db

    def _category_options(self):
        return (
            selectinload(TransactionCategory.parent),
            selectinload(TransactionCategory.children),
        )

    async def get_all_global(self):
        result = await self.db.execute(
            select(TransactionCategory)
            .where(
                TransactionCategory.owner_id.is_(None),
                TransactionCategory.group_id.is_(None),
                TransactionCategory.account_id.is_(None),
            )
            .order_by(TransactionCategory.id)
        )
        return result.scalars().all()

    async def get_visible_categories(self, user_id: int, group_ids: list[int]):
        visible_scope = [
            (TransactionCategory.owner_id.is_(None) & TransactionCategory.group_id.is_(None)),
            TransactionCategory.owner_id == user_id,
        ]
        if group_ids:
            visible_scope.append(TransactionCategory.group_id.in_(group_ids))

        result = await self.db.execute(
            select(TransactionCategory)
            .options(*self._category_options())
            .where(or_(*visible_scope))
            .order_by(TransactionCategory.id)
        )
        return result.scalars().all()

    async def get_by_id(self, transaction_category_id: int):
        result = await self.db.execute(
            select(TransactionCategory)
            .options(*self._category_options())
            .where(TransactionCategory.id == transaction_category_id)
        )
        return result.scalars().first()

    async def get_by_name(self, name: str):
        result = await self.db.execute(
            select(TransactionCategory).where(TransactionCategory.name == name)
        )
        return result.scalars().first()

    async def get_group_ids_for_user(self, user_id: int) -> list[int]:
        result = await self.db.execute(
            select(Account.id)
            .outerjoin(
                GroupAccountMember,
                GroupAccountMember.account_id == Account.id,
            )
            .where(
                Account.account_type_id == 2,
                or_(
                    Account.id_admin_user == user_id,
                    GroupAccountMember.user_id == user_id,
                ),
            )
        )
        return list(result.scalars().all())

    async def user_can_access_group(self, group_id: int, user_id: int) -> bool:
        result = await self.db.execute(
            select(Account.id)
            .outerjoin(
                GroupAccountMember,
                GroupAccountMember.account_id == Account.id,
            )
            .where(
                Account.id == group_id,
                Account.account_type_id == 2,
                or_(
                    Account.id_admin_user == user_id,
                    GroupAccountMember.user_id == user_id,
                ),
            )
        )
        return result.scalar_one_or_none() is not None

    async def get_accessible_account(self, account_id: int, user_id: int):
        result = await self.db.execute(
            select(Account)
            .outerjoin(
                GroupAccountMember,
                GroupAccountMember.account_id == Account.id,
            )
            .where(
                Account.id == account_id,
                or_(
                    Account.id_admin_user == user_id,
                    GroupAccountMember.user_id == user_id,
                ),
            )
        )
        return result.scalars().first()

    async def get_children(self, category_id: int):
        result = await self.db.execute(
            select(TransactionCategory).where(
                TransactionCategory.parent_category_id == category_id
            )
        )
        return result.scalars().all()

    async def has_transactions(self, category_id: int) -> bool:
        result = await self.db.execute(
            select(Transaction.id)
            .where(Transaction.category_id == category_id)
            .limit(1)
        )
        return result.scalar_one_or_none() is not None

    async def create(self, category: TransactionCategory):
        self.db.add(category)
        await self.db.commit()
        await self.db.refresh(category)
        return category

    async def update(self, category: TransactionCategory):
        await self.db.commit()
        await self.db.refresh(category)
        return category

    async def delete(self, category: TransactionCategory):
        await self.db.delete(category)
        await self.db.commit()
