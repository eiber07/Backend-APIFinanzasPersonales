"""add hierarchical and scoped transaction categories

Revision ID: d4c7e913a2bf
Revises: 788cac11525d
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d4c7e913a2bf"
down_revision: Union[str, Sequence[str], None] = "788cac11525d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "transaction_categories",
        sa.Column("parent_category_id", sa.Integer(), nullable=True),
    )
    op.add_column(
        "transaction_categories",
        sa.Column("owner_id", sa.Integer(), nullable=True),
    )
    op.add_column(
        "transaction_categories",
        sa.Column("group_id", sa.Integer(), nullable=True),
    )
    op.create_foreign_key(
        "fk_transaction_categories_parent_category_id",
        "transaction_categories",
        "transaction_categories",
        ["parent_category_id"],
        ["id"],
        ondelete="RESTRICT",
    )
    op.create_foreign_key(
        "fk_transaction_categories_owner_id",
        "transaction_categories",
        "users",
        ["owner_id"],
        ["id"],
        ondelete="RESTRICT",
    )
    op.create_foreign_key(
        "fk_transaction_categories_group_id",
        "transaction_categories",
        "accounts",
        ["group_id"],
        ["id"],
        ondelete="RESTRICT",
    )
    op.create_index(
        "ix_transaction_categories_parent_category_id",
        "transaction_categories",
        ["parent_category_id"],
    )
    op.create_index(
        "ix_transaction_categories_owner_id",
        "transaction_categories",
        ["owner_id"],
    )
    op.create_index(
        "ix_transaction_categories_group_id",
        "transaction_categories",
        ["group_id"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_transaction_categories_group_id",
        table_name="transaction_categories",
    )
    op.drop_index(
        "ix_transaction_categories_owner_id",
        table_name="transaction_categories",
    )
    op.drop_index(
        "ix_transaction_categories_parent_category_id",
        table_name="transaction_categories",
    )
    op.drop_constraint(
        "fk_transaction_categories_group_id",
        "transaction_categories",
        type_="foreignkey",
    )
    op.drop_constraint(
        "fk_transaction_categories_owner_id",
        "transaction_categories",
        type_="foreignkey",
    )
    op.drop_constraint(
        "fk_transaction_categories_parent_category_id",
        "transaction_categories",
        type_="foreignkey",
    )
    op.drop_column("transaction_categories", "group_id")
    op.drop_column("transaction_categories", "owner_id")
    op.drop_column("transaction_categories", "parent_category_id")
