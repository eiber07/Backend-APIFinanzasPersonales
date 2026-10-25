"""add personal account scope to transaction categories

Revision ID: 5e8d21c6a4b9
Revises: d4c7e913a2bf
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "5e8d21c6a4b9"
down_revision: Union[str, Sequence[str], None] = "d4c7e913a2bf"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "transaction_categories",
        sa.Column("account_id", sa.Integer(), nullable=True),
    )
    op.create_foreign_key(
        "fk_transaction_categories_account_id",
        "transaction_categories",
        "accounts",
        ["account_id"],
        ["id"],
        ondelete="RESTRICT",
    )
    op.create_index(
        "ix_transaction_categories_account_id",
        "transaction_categories",
        ["account_id"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_transaction_categories_account_id",
        table_name="transaction_categories",
    )
    op.drop_constraint(
        "fk_transaction_categories_account_id",
        "transaction_categories",
        type_="foreignkey",
    )
    op.drop_column("transaction_categories", "account_id")
