from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.budget import Budget, BudgetItem


class BudgetDAL:
    def __init__(self, db: AsyncSession):
        self.db = db

    def _budget_options(self):
        return selectinload(Budget.items).selectinload(BudgetItem.category)

    async def get_by_account(self, account_id: int):
        result = await self.db.execute(
            select(Budget)
            .options(self._budget_options())
            .where(Budget.account_id == account_id)
        )
        return result.scalars().first()

    async def get_by_id(self, budget_id: int):
        result = await self.db.execute(
            select(Budget)
            .options(self._budget_options())
            .where(Budget.id == budget_id)
        )
        return result.scalars().first()

    async def get_item(self, budget_id: int, item_id: int):
        result = await self.db.execute(
            select(BudgetItem)
            .options(selectinload(BudgetItem.category))
            .where(
                BudgetItem.budget_id == budget_id,
                BudgetItem.id == item_id,
            )
        )
        return result.scalars().first()

    async def create(self, budget: Budget):
        self.db.add(budget)
        await self.db.commit()
        return await self.get_by_id(budget.id)

    async def update(self, budget: Budget):
        await self.db.commit()
        return await self.get_by_id(budget.id)

    async def delete(self, budget: Budget):
        await self.db.delete(budget)
        await self.db.commit()

    async def delete_item(self, item: BudgetItem):
        await self.db.delete(item)
        await self.db.commit()
