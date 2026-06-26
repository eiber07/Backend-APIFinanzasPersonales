"""update planned_expenses and transactions models

Revision ID: c2db594b01d2
Revises: fa03bb7cb4ac
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c2db594b01d2"
down_revision: Union[str, Sequence[str], None] = "fa03bb7cb4ac"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Se conserva la tabla anterior temporalmente para no perder datos.
    op.rename_table("planned_expenses", "planned_expenses_legacy")

    # Nueva estructura: una fila por cada cuota.
    op.create_table(
        "planned_expenses",
        sa.Column("id_planned_expense", sa.Integer(), nullable=False),
        sa.Column("installment_number", sa.Integer(), nullable=False),
        sa.Column("account_id", sa.Integer(), nullable=False),
        sa.Column(
            "installment_amount",
            sa.DECIMAL(precision=13, scale=2),
            nullable=False,
        ),
        sa.Column("description", sa.String(), nullable=True),
        sa.Column("due_date", sa.DateTime(), nullable=False),
        sa.Column("status_id", sa.Integer(), nullable=False),
        sa.Column(
            "creation_date",
            sa.DateTime(),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["account_id"],
            ["accounts.id"],
            name="fk_planned_expenses_account_id_accounts",
        ),
        sa.ForeignKeyConstraint(
            ["status_id"],
            ["statuses.id"],
            name="fk_planned_expenses_status_id_statuses",
        ),
        sa.PrimaryKeyConstraint(
            "id_planned_expense",
            "installment_number",
            name="pk_planned_expenses",
        ),
    )

    # Convierte cada gasto anterior en una fila por cada cuota.
    # start_date pasa a ser la fecha de la primera cuota.
    op.execute(
        """
        INSERT INTO planned_expenses (
            id_planned_expense,
            installment_number,
            account_id,
            installment_amount,
            description,
            due_date,
            status_id,
            creation_date,
            updated_at
        )
        SELECT
            legacy.id,
            cuota.numero,
            legacy.account_id,
            COALESCE(legacy.installment_amount, legacy.amount),
            legacy.description,
            legacy.start_date + ((cuota.numero - 1) * INTERVAL '1 month'),
            CASE
                WHEN legacy.status_id = 2 THEN 2
                WHEN cuota.numero <= COALESCE(legacy.installments_paid, 0) THEN 2
                ELSE legacy.status_id
            END,
            legacy.creation_date,
            legacy.updated_at
        FROM planned_expenses_legacy AS legacy
        CROSS JOIN LATERAL generate_series(
            1,
            GREATEST(COALESCE(legacy.installment_number, 1), 1)
        ) AS cuota(numero);
        """
    )

    # Transactions ya existe: solo se agrega la nueva columna.
    op.add_column(
        "transactions",
        sa.Column(
            "planned_expense_installment_number",
            sa.Integer(),
            nullable=True,
        ),
    )


def downgrade() -> None:
    op.drop_column(
        "transactions",
        "planned_expense_installment_number",
    )

    op.drop_table("planned_expenses")

    op.rename_table(
        "planned_expenses_legacy",
        "planned_expenses",
    )