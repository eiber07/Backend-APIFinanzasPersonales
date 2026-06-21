from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.planned_expense import PlannedExpense

class PlannedExpenseDAL:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_planned_expense_by_account_id(self, account_id: int):
        result = await self.db.execute(
            select(PlannedExpense).where(PlannedExpense.account_id == account_id, PlannedExpense.status_id ==1)
        )
        return result.scalars().all()
    
    async def get_planned_expense_by_id(self, planned_expense_id: int):
        result = await self.db.execute(
            select(PlannedExpense).where(PlannedExpense.id == planned_expense_id)
        )
        return result.scalars().first()

    async def create_planned_expense(self, planned_expense: PlannedExpense):
        self.db.add(planned_expense)
        await self.db.commit()
        await self.db.refresh(planned_expense)
        return planned_expense
    
    async def update_planned_expense(self, planned_expense: PlannedExpense):
        await self.db.merge(planned_expense)
        await self.db.commit()
        return planned_expense
    
    async def deactivate_planned_expense(self, planned_expense: PlannedExpense):
        planned_expense.status_id = 2
        await self.db.commit()
        return planned_expense
    