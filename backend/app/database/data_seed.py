from sqlalchemy import select

from app.database.database import AsyncSessionLocal
from app.models import (
    AccountType,
    Status,
    TransactionType,
    TransactionCategory,
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
        {"name": "ingreso"},
        {"name": "egreso"},
        {"name": "gasto planificado"},
    ],
    TransactionCategory: [
        {"name": "comida"},
        {"name": "transporte"},
        {"name": "entretenimiento"},
        {"name": "servicios"},
        {"name": "alquiler"},
        {"name": "mercado"},
        {"name": "otros"},
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