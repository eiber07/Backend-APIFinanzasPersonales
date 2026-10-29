from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field


class CategoryTotal(BaseModel):
    category_id: int
    category_name: str
    amount: Decimal
    children: list["CategoryTotal"] = Field(default_factory=list)


class IncomeCategoryTotal(BaseModel):
    category_id: int
    category_name: str
    amount: Decimal


class RealIncomeSummary(BaseModel):
    has_data: bool
    total: Decimal
    fixed: Decimal
    extra: Decimal
    other: Decimal
    by_category: list[IncomeCategoryTotal]


class RealExpenseSummary(BaseModel):
    has_data: bool
    total: Decimal
    by_category: list[CategoryTotal]


class BudgetComparisonItem(BaseModel):
    budget_item_id: int
    category_id: int
    category_name: str
    parent_category_id: Optional[int] = None
    budgeted_amount: Decimal
    actual_amount: Decimal
    remaining_amount: Decimal


class BudgetVsRealSummary(BaseModel):
    has_budget: bool
    budgeted_total: Decimal
    allocated_actual_total: Decimal
    unbudgeted_actual_total: Decimal
    actual_total: Decimal
    items: list[BudgetComparisonItem]


class EstimatedCategoryTotal(CategoryTotal):
    pass


class EstimatedVsRealSummary(BaseModel):
    has_estimated_data: bool
    estimated_total: Decimal
    real_expense_total: Decimal
    estimated_installment_count: int
    unclassified_estimated_total: Decimal
    by_category: list[EstimatedCategoryTotal]


class MonthlyDashboardResponse(BaseModel):
    account_id: int
    year: int
    month: int
    real_income: RealIncomeSummary
    real_expenses: RealExpenseSummary
    budget_vs_real: BudgetVsRealSummary
    estimated_vs_real: EstimatedVsRealSummary
    has_real_transactions: bool
    real_transaction_count: int
