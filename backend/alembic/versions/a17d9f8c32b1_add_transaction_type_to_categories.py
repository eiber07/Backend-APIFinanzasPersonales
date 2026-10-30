"""classify transaction categories by transaction type

Revision ID: a17d9f8c32b1
Revises: 5e8d21c6a4b9
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a17d9f8c32b1"
down_revision: Union[str, Sequence[str], None] = "5e8d21c6a4b9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "transaction_categories",
        sa.Column(
            "transaction_type",
            sa.String(length=20),
            server_default="egreso",
            nullable=False,
        ),
    )

    categories = sa.table(
        "transaction_categories",
        sa.column("name", sa.String),
        sa.column("transaction_type", sa.String),
        sa.column("parent_category_id", sa.Integer),
        sa.column("owner_id", sa.Integer),
        sa.column("group_id", sa.Integer),
        sa.column("account_id", sa.Integer),
    )
    connection = op.get_bind()
    for name in ("Ingreso Fijo", "Ingreso Extra"):
        connection.execute(
            categories.insert().values(
                name=name,
                transaction_type="ingreso",
                parent_category_id=None,
                owner_id=None,
                group_id=None,
                account_id=None,
            )
        )


def downgrade() -> None:
    op.drop_column("transaction_categories", "transaction_type")
