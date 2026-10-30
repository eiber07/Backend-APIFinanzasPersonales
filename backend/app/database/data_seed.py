import asyncio

from sqlalchemy import select

from app.database.database import AsyncSessionLocal
from app.models import (
    AccountType,
    Status,
    TransactionType,
    TransactionCategory,
)
from app.constants.transaction_types import (
    TRANSACTION_TYPE_EXPENSE,
    TRANSACTION_TYPE_INCOME,
    TRANSACTION_TYPE_PLANNED_EXPENSE,
)


INITIAL_VALUES = {
    AccountType: [
        {"name": "personal"},
        {"name": "grupal"},
    ],
    Status: [
        {"name": "activa"},
        {"name": "inactiva"},
    ],
    TransactionType: [
        {"name": TRANSACTION_TYPE_INCOME},
        {"name": TRANSACTION_TYPE_EXPENSE},
        {"name": TRANSACTION_TYPE_PLANNED_EXPENSE},
    ],
    TransactionCategory: [
        {"name": "comida"},
        {"name": "transporte"},
        {"name": "entretenimiento"},
        {"name": "servicios"},
        {"name": "alquiler"},
        {"name": "mercado"},
        {"name": "otros"},
        {"name": "Ingreso Fijo", "transaction_type": TRANSACTION_TYPE_INCOME},
        {"name": "Ingreso Extra", "transaction_type": TRANSACTION_TYPE_INCOME},
    ],
}


async def seed_all_data():

    async with AsyncSessionLocal() as session:

        for model, rows in INITIAL_VALUES.items():

            for row in rows:

                result = await session.execute(
                    select(model).where(
                        model.name == row["name"]
                    )
                )

                exists = result.scalars().first()

                if not exists:
                    session.add(model(**row))
                    print(
                        f"Insertando {model.__tablename__}: {row['name']}"
                    )

        await session.commit()

    print("Seed completado correctamente.")


if __name__ == "__main__":
    asyncio.run(seed_all_data())