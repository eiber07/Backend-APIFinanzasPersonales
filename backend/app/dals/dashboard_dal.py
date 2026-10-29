from datetime import datetime

from sqlalchemy import exists, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased

from app.models.planned_expense import PlannedExpense
from app.models.transaction import Transaction
from app.models.transaction_category import TransactionCategory
from app.models.transaction_type import TransactionType
from app.constants.transaction_types import TRANSACTION_TYPE_EXPENSE


class DashboardDAL:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_real_totals(
        self,
        account_id: int,
        period_start: datetime,
        period_end: datetime,
    ):
        parent_category = aliased(TransactionCategory)
        result = await self.db.execute(
            select(
                Transaction.category_id,
                TransactionCategory.name,
                TransactionCategory.parent_category_id,
                parent_category.name.label("parent_category_name"),
                TransactionType.name.label("type_name"),
                func.sum(Transaction.amount).label("amount"),
                func.count(Transaction.id).label("transaction_count"),
            )
            .join(
                TransactionCategory,
                TransactionCategory.id == Transaction.category_id,
            )
            .outerjoin(
                parent_category,
                parent_category.id == TransactionCategory.parent_category_id,
            )
            .join(TransactionType, TransactionType.id == Transaction.type_id)
            .where(
                Transaction.account_id == account_id,
                Transaction.status_id == 1,
                Transaction.transaction_date >= period_start,
                Transaction.transaction_date < period_end,
            )
            .group_by(
                Transaction.category_id,
                TransactionCategory.name,
                TransactionCategory.parent_category_id,
                parent_category.name,
                TransactionType.name,
            )
        )
        return result.all()

    async def get_estimated_totals(
        self,
        account_id: int,
        period_start: datetime,
        period_end: datetime,
    ):
        linked_active_transaction = exists(
            select(Transaction.id).where(
                Transaction.planned_expense_id
                == PlannedExpense.id_planned_expense,
                Transaction.planned_expense_installment_number
                == PlannedExpense.installment_number,
                Transaction.account_id == PlannedExpense.account_id,
                Transaction.status_id == 1,
            )
        )
        parent_category = aliased(TransactionCategory)
        result = await self.db.execute(
            select(
                PlannedExpense.category_id,
                TransactionCategory.name,
                TransactionCategory.parent_category_id,
                parent_category.name.label("parent_category_name"),
                func.sum(PlannedExpense.installment_amount).label("amount"),
                func.count().label("installment_count"),
            )
            .outerjoin(
                TransactionCategory,
                TransactionCategory.id == PlannedExpense.category_id,
            )
            .outerjoin(
                parent_category,
                parent_category.id == TransactionCategory.parent_category_id,
            )
            .where(
                PlannedExpense.account_id == account_id,
                PlannedExpense.status_id == 1,
                PlannedExpense.due_date >= period_start,
                PlannedExpense.due_date < period_end,
                ~linked_active_transaction,
                or_(
                    PlannedExpense.category_id.is_(None),
                    TransactionCategory.transaction_type == TRANSACTION_TYPE_EXPENSE,
                ),
            )
            .group_by(
                PlannedExpense.category_id,
                TransactionCategory.name,
                TransactionCategory.parent_category_id,
                parent_category.name,
            )
        )
        return result.all()
