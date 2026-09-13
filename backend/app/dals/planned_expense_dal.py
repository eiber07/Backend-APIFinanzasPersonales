from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.planned_expense import PlannedExpense
from sqlalchemy import update
from sqlalchemy import func

class PlannedExpenseDAL:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_account_id(self, account_id: int):
        result = await self.db.execute(
            select(PlannedExpense).where(PlannedExpense.account_id == account_id)
        )
        return result.scalars().all()

    async def get_by_group_id(self, id_planned_expense: int):
        result = await self.db.execute(
            select(PlannedExpense).where(PlannedExpense.id_planned_expense == id_planned_expense)
        )
        return result.scalars().all()
    
    async def get_by_group_and_installment(self, id_planned_expense: int, installment_number: int):
        result = await self.db.execute(
            select(PlannedExpense).where(
                PlannedExpense.id_planned_expense == id_planned_expense,
                PlannedExpense.installment_number == installment_number
            )
        )
        return result.scalars().first()

    async def get_planned_expense_by_id(self, id_planned_expense: int, installment_number: int):
        # helper que hace lo mismo que get_by_group_and_installment para compatibilidad
        return await self.get_by_group_and_installment(id_planned_expense, installment_number)

    async def create_planned_expense(self, planned_expense: PlannedExpense):
        self.db.add(planned_expense)
        await self.db.commit()
        await self.db.refresh(planned_expense)
        return planned_expense
    
    async def get_next_group_id(self) -> int:
        from sqlalchemy import func
        result = await self.db.execute(
            select(func.max(PlannedExpense.id_planned_expense))
        )
        max_id = result.scalar()
        return (max_id or 0) + 1
    
    async def mark_installment_as_paid(self, id_planned_expense: int, installment_number: int):
        result = await self.db.execute(
            select(PlannedExpense).where(
                PlannedExpense.id_planned_expense == id_planned_expense,
                PlannedExpense.installment_number == installment_number
            )
        )
        installment = result.scalars().first()

        if installment:
            installment.status_id = 2
            await self.db.commit()
            await self.db.refresh(installment)
            return installment
        return None

    async def deactivate_by_group_id(self, id_planned_expense: int):
        result = await self.db.execute(
            select(PlannedExpense).where(PlannedExpense.id_planned_expense == id_planned_expense)
        )
        expenses = result.scalars().all()
        for expense in expenses:
            expense.status_id = 2
        await self.db.commit()

    async def deactivate_by_account(self, account_id: int, status_id: int):
        await self.db.execute(
            update(PlannedExpense)
            .where(PlannedExpense.account_id == account_id)
            .values(status_id=status_id)
        )
        await self.db.commit()

    async def get_total_installments(self, id_planned_expense: int) -> int:
        result = await self.db.execute(
        select(func.count())
        .select_from(PlannedExpense)
        .where(
            PlannedExpense.id_planned_expense == id_planned_expense
        )
    )

        return result.scalar()