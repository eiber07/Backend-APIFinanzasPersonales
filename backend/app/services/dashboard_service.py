from datetime import datetime
from decimal import Decimal

from fastapi import HTTPException

from app.constants.transaction_types import (
    TRANSACTION_TYPE_EXPENSE,
    TRANSACTION_TYPE_INCOME,
    TRANSACTION_TYPE_PLANNED_EXPENSE,
)
from app.dals.account_dal import AccountDAL
from app.dals.budget_dal import BudgetDAL
from app.dals.dashboard_dal import DashboardDAL
from app.dals.group_account_member_dal import GroupAccountMemberDAL
from app.models.user import User


ZERO = Decimal("0.00")


class DashboardService:
    def __init__(
        self,
        dashboard_dal: DashboardDAL,
        budget_dal: BudgetDAL,
        account_dal: AccountDAL,
        group_member_dal: GroupAccountMemberDAL,
    ):
        self.dashboard_dal = dashboard_dal
        self.budget_dal = budget_dal
        self.account_dal = account_dal
        self.group_member_dal = group_member_dal

    async def _validate_account_access(self, account_id: int, current_user: User):
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

    @staticmethod
    def _build_category_tree(amounts):
        categories = {}
        for row in amounts:
            categories[row["category_id"]] = {
                "category_id": row["category_id"],
                "category_name": row["name"],
                "parent_category_id": row["parent_category_id"],
                "parent_category_name": row["parent_category_name"],
                "amount": Decimal(row["amount"] or ZERO),
            }

        roots = {}
        for category in categories.values():
            parent_id = category["parent_category_id"]
            root_id = parent_id if parent_id is not None else category["category_id"]
            root = roots.setdefault(
                root_id,
                {
                    "category_id": root_id,
                    "category_name": (
                        category["parent_category_name"]
                        if parent_id is not None
                        else category["category_name"]
                    ),
                    "amount": ZERO,
                    "children": [],
                },
            )
            root["amount"] += category["amount"]
            if parent_id is not None:
                root["children"].append(
                    {
                        "category_id": category["category_id"],
                        "category_name": category["category_name"],
                        "amount": category["amount"],
                    }
                )
        for root in roots.values():
            root["children"].sort(key=lambda item: item["category_id"])
        return sorted(roots.values(), key=lambda item: item["category_id"])

    async def get_monthly_summary(
        self,
        account_id: int,
        year: int,
        month: int,
        current_user: User,
    ):
        await self._validate_account_access(account_id, current_user)
        period_start = datetime(year, month, 1)
        if month == 12:
            period_end = datetime(year + 1, 1, 1)
        else:
            period_end = datetime(year, month + 1, 1)

        actual_rows = await self.dashboard_dal.get_real_totals(
            account_id,
            period_start,
            period_end,
        )
        income_rows = []
        expense_rows = []
        income_total = ZERO
        expense_total = ZERO
        fixed_income = ZERO
        extra_income = ZERO
        other_income = ZERO
        real_transaction_count = 0
        direct_expense_amounts = {}
        expense_categories = {}

        for row in actual_rows:
            type_name = row.type_name.strip().casefold()
            amount = Decimal(row.amount or ZERO)
            real_transaction_count += row.transaction_count
            if type_name == TRANSACTION_TYPE_INCOME:
                income_total += amount
                normalized_category = (row.name or "").strip().casefold()
                if normalized_category in {"fixed income", "ingreso fijo"}:
                    fixed_income += amount
                elif normalized_category in {"extra income", "ingreso extra"}:
                    extra_income += amount
                else:
                    other_income += amount
                income_rows.append(
                    {
                        "category_id": row.category_id,
                        "category_name": row.name,
                        "amount": amount,
                    }
                )
            elif type_name in {
                TRANSACTION_TYPE_EXPENSE,
                TRANSACTION_TYPE_PLANNED_EXPENSE,
            }:
                expense_total += amount
                direct_expense_amounts[row.category_id] = (
                    direct_expense_amounts.get(row.category_id, ZERO) + amount
                )
                expense_category = expense_categories.setdefault(
                    row.category_id,
                    {
                        "category_id": row.category_id,
                        "name": row.name,
                        "parent_category_id": row.parent_category_id,
                        "parent_category_name": row.parent_category_name,
                        "amount": ZERO,
                    },
                )
                expense_category["amount"] += amount

        expense_rows = list(expense_categories.values())
        parent_by_category = {
            category["category_id"]: category["parent_category_id"]
            for category in expense_rows
        }

        estimated_rows = await self.dashboard_dal.get_estimated_totals(
            account_id,
            period_start,
            period_end,
        )
        estimated_total = sum(
            (Decimal(row.amount or ZERO) for row in estimated_rows),
            ZERO,
        )
        estimated_count = sum(row.installment_count for row in estimated_rows)
        categorized_estimates = [
            {
                "category_id": row.category_id,
                "name": row.name,
                "parent_category_id": row.parent_category_id,
                "parent_category_name": row.parent_category_name,
                "amount": Decimal(row.amount or ZERO),
            }
            for row in estimated_rows
            if row.category_id is not None
        ]
        unclassified_estimated_total = sum(
            (
                Decimal(row.amount or ZERO)
                for row in estimated_rows
                if row.category_id is None
            ),
            ZERO,
        )

        budget = await self.budget_dal.get_by_account(account_id)
        budget_items = budget.items if budget is not None else []
        budgeted_categories = {item.category_id: item for item in budget_items}
        allocated_actuals = {item.category_id: ZERO for item in budget_items}
        unbudgeted_actual = ZERO

        for category_id, amount in direct_expense_amounts.items():
            matched_budget_category = None
            current_category_id = category_id
            while current_category_id is not None:
                if current_category_id in budgeted_categories:
                    matched_budget_category = current_category_id
                    break
                current_category_id = parent_by_category.get(current_category_id)
            if matched_budget_category is None:
                unbudgeted_actual += amount
            else:
                allocated_actuals[matched_budget_category] += amount

        budget_item_summaries = [
            {
                "budget_item_id": item.id,
                "category_id": item.category_id,
                "category_name": item.category.name,
                "parent_category_id": item.category.parent_category_id,
                "budgeted_amount": Decimal(item.target_amount),
                "actual_amount": allocated_actuals[item.category_id],
                "remaining_amount": (
                    Decimal(item.target_amount) - allocated_actuals[item.category_id]
                ),
            }
            for item in budget_items
        ]
        budget_total = sum(
            (Decimal(item.target_amount) for item in budget_items),
            ZERO,
        )
        budget_allocated_actual_total = sum(allocated_actuals.values(), ZERO)

        return {
            "account_id": account_id,
            "year": year,
            "month": month,
            "real_income": {
                "has_data": bool(income_rows),
                "total": income_total,
                "fixed": fixed_income,
                "extra": extra_income,
                "other": other_income,
                "by_category": income_rows,
            },
            "real_expenses": {
                "has_data": bool(expense_rows),
                "total": expense_total,
                "by_category": self._build_category_tree(expense_rows),
            },
            "budget_vs_real": {
                "has_budget": budget is not None,
                "budgeted_total": budget_total,
                "allocated_actual_total": budget_allocated_actual_total,
                "unbudgeted_actual_total": unbudgeted_actual,
                "actual_total": expense_total,
                "items": budget_item_summaries,
            },
            "estimated_vs_real": {
                "has_estimated_data": estimated_count > 0,
                "estimated_total": estimated_total,
                "real_expense_total": expense_total,
                "estimated_installment_count": estimated_count,
                "unclassified_estimated_total": unclassified_estimated_total,
                "by_category": self._build_category_tree(categorized_estimates),
            },
            "has_real_transactions": real_transaction_count > 0,
            "real_transaction_count": real_transaction_count,
        }
