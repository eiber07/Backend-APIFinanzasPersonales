"""make account budgets indefinite

Revision ID: b8e1c47a2d90
Revises: b42f19d6a803
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b8e1c47a2d90"
down_revision: Union[str, Sequence[str], None] = "b42f19d6a803"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    budgets = sa.table(
        "budgets",
        sa.column("id", sa.Integer),
        sa.column("account_id", sa.Integer),
        sa.column("year", sa.Integer),
        sa.column("month", sa.Integer),
        sa.column("updated_at", sa.DateTime),
    )
    existing_budgets = op.get_bind().execute(
        sa.select(
            budgets.c.id,
            budgets.c.account_id,
            budgets.c.year,
            budgets.c.month,
            budgets.c.updated_at,
        ).order_by(
            budgets.c.account_id,
            budgets.c.year.desc(),
            budgets.c.month.desc(),
            budgets.c.updated_at.desc(),
            budgets.c.id.desc(),
        )
    )

    seen_accounts = set()
    superseded_budget_ids = []
    for budget_id, account_id, _, _, _ in existing_budgets:
        if account_id in seen_accounts:
            superseded_budget_ids.append(budget_id)
        else:
            seen_accounts.add(account_id)

    if superseded_budget_ids:
        op.get_bind().execute(
            budgets.delete().where(budgets.c.id.in_(superseded_budget_ids))
        )

    op.drop_constraint(
        "uq_budget_account_period",
        "budgets",
        type_="unique",
    )
    op.drop_constraint("ck_budget_month", "budgets", type_="check")
    op.drop_constraint("ck_budget_year", "budgets", type_="check")
    op.drop_index("ix_budgets_account_id", table_name="budgets")
    op.drop_column("budgets", "month")
    op.drop_column("budgets", "year")
    op.create_unique_constraint("uq_budget_account", "budgets", ["account_id"])


def downgrade() -> None:
    op.drop_constraint("uq_budget_account", "budgets", type_="unique")
    op.add_column(
        "budgets",
        sa.Column("year", sa.Integer(), nullable=True),
    )
    op.add_column(
        "budgets",
        sa.Column("month", sa.Integer(), nullable=True),
    )
    op.execute(
        sa.text(
            "UPDATE budgets "
            "SET year = EXTRACT(YEAR FROM CURRENT_DATE)::integer, "
            "month = EXTRACT(MONTH FROM CURRENT_DATE)::integer"
        )
    )
    op.alter_column("budgets", "year", nullable=False)
    op.alter_column("budgets", "month", nullable=False)
    op.create_check_constraint(
        "ck_budget_year",
        "budgets",
        "year >= 1",
    )
    op.create_check_constraint(
        "ck_budget_month",
        "budgets",
        "month >= 1 AND month <= 12",
    )
    op.create_unique_constraint(
        "uq_budget_account_period",
        "budgets",
        ["account_id", "year", "month"],
    )
    op.create_index("ix_budgets_account_id", "budgets", ["account_id"])
