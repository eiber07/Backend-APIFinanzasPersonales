"""add monthly budgets and categorize planned expenses

Revision ID: b42f19d6a803
Revises: a17d9f8c32b1
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b42f19d6a803"
down_revision: Union[str, Sequence[str], None] = "a17d9f8c32b1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "budgets",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("account_id", sa.Integer(), nullable=False),
        sa.Column("year", sa.Integer(), nullable=False),
        sa.Column("month", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.CheckConstraint(
            "month >= 1 AND month <= 12",
            name="ck_budget_month",
        ),
        sa.CheckConstraint("year >= 1", name="ck_budget_year"),
        sa.ForeignKeyConstraint(
            ["account_id"],
            ["accounts.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "account_id",
            "year",
            "month",
            name="uq_budget_account_period",
        ),
    )
    op.create_index("ix_budgets_id", "budgets", ["id"])
    op.create_index("ix_budgets_account_id", "budgets", ["account_id"])

    op.create_table(
        "budget_items",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("budget_id", sa.Integer(), nullable=False),
        sa.Column("category_id", sa.Integer(), nullable=False),
        sa.Column("target_amount", sa.Numeric(13, 2), nullable=False),
        sa.CheckConstraint(
            "target_amount > 0",
            name="ck_budget_item_target_amount",
        ),
        sa.ForeignKeyConstraint(
            ["budget_id"],
            ["budgets.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["category_id"],
            ["transaction_categories.id"],
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "budget_id",
            "category_id",
            name="uq_budget_item_category",
        ),
    )
    op.create_index("ix_budget_items_id", "budget_items", ["id"])
    op.create_index("ix_budget_items_budget_id", "budget_items", ["budget_id"])
    op.create_index("ix_budget_items_category_id", "budget_items", ["category_id"])

    op.add_column(
        "planned_expenses",
        sa.Column("category_id", sa.Integer(), nullable=True),
    )
    op.create_foreign_key(
        "fk_planned_expenses_category_id",
        "planned_expenses",
        "transaction_categories",
        ["category_id"],
        ["id"],
        ondelete="RESTRICT",
    )
    op.create_index(
        "ix_planned_expenses_category_id",
        "planned_expenses",
        ["category_id"],
    )
    planned_expenses = sa.table(
        "planned_expenses",
        sa.column("id_planned_expense", sa.Integer),
        sa.column("installment_number", sa.Integer),
        sa.column("category_id", sa.Integer),
    )
    transactions = sa.table(
        "transactions",
        sa.column("id", sa.Integer),
        sa.column("planned_expense_id", sa.Integer),
        sa.column("planned_expense_installment_number", sa.Integer),
        sa.column("category_id", sa.Integer),
    )
    existing_associations = op.get_bind().execute(
        sa.select(
            transactions.c.planned_expense_id,
            transactions.c.planned_expense_installment_number,
            transactions.c.category_id,
        )
        .where(transactions.c.planned_expense_id.is_not(None))
        .order_by(transactions.c.id)
    )
    categories_by_installment = {}
    for planned_id, installment_number, category_id in existing_associations:
        categories_by_installment.setdefault(
            (planned_id, installment_number),
            category_id,
        )
    for (planned_id, installment_number), category_id in categories_by_installment.items():
        op.get_bind().execute(
            planned_expenses.update()
            .where(
                planned_expenses.c.id_planned_expense == planned_id,
                planned_expenses.c.installment_number == installment_number,
            )
            .values(category_id=category_id)
        )


def downgrade() -> None:
    op.drop_index("ix_planned_expenses_category_id", table_name="planned_expenses")
    op.drop_constraint(
        "fk_planned_expenses_category_id",
        "planned_expenses",
        type_="foreignkey",
    )
    op.drop_column("planned_expenses", "category_id")

    op.drop_index("ix_budget_items_category_id", table_name="budget_items")
    op.drop_index("ix_budget_items_budget_id", table_name="budget_items")
    op.drop_index("ix_budget_items_id", table_name="budget_items")
    op.drop_table("budget_items")

    op.drop_index("ix_budgets_account_id", table_name="budgets")
    op.drop_index("ix_budgets_id", table_name="budgets")
    op.drop_table("budgets")
