import os

# Configuración aislada: NO utiliza Supabase.
os.environ.update({
    "DATABASE_URL": "sqlite+aiosqlite:///:memory:",
    "MAIL_USERNAME": "test",
    "MAIL_PASSWORD": "test",
    "MAIL_FROM": "test@example.invalid",
    "MAIL_PORT": "587",
    "MAIL_SERVER": "localhost",
    "MAIL_FROM_NAME": "Pruebas",
    "FORGET_PWD_SECRET_KEY": "clave-prueba",
    "ALGORITHM": "HS256",
    "FORGET_PASSWORD_LINK_EXPIRE_MINUTES": "30",
    "APP_HOST": "http://localhost:8000",
    "FRONTEND_URL": "http://localhost:3000",
    "ACCESS_TOKEN_EXPIRE_MINUTES": "30",
    "SECRET_KEY": "clave-local-de-pruebas",
})

import pytest
from fastapi import HTTPException
from app.services.transaction_category_service import TransactionCategoryService
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.schemas.transaction_category import TransactionCategoryUpdate

from app.database.database import Base
from app.models import (
    User, Account, AccountType, Status,
    GroupAccountMember, TransactionCategory,
)
from app.dals.transaction_category_dal import TransactionCategoryDAL


@pytest.mark.asyncio
async def test_visibilidad_categorias():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")

    try:
        async with engine.begin() as connection:
            await connection.run_sync(Base.metadata.create_all)

        Session = async_sessionmaker(engine, expire_on_commit=False)

        async with Session() as db:
            db.add_all([
                User(id=1, name="Ana", last_name="Test", email="ana@example.invalid", password="test"),
                User(id=2, name="Juan", last_name="Test", email="juan@example.invalid", password="test"),
                User(id=3, name="Luis", last_name="Test", email="luis@example.invalid", password="test"),
                Status(id=1, name="activa"),
                AccountType(id=1, name="personal"),
                AccountType(id=2, name="grupal"),
                Account(id=10, id_admin_user=1, name="Grupo prueba", status_id=1, account_type_id=2),
                GroupAccountMember(user_id=2, account_id=10, role="miembro"),
                TransactionCategory(id=1, name="Global prueba"),
                TransactionCategory(id=2, name="Privada Juan", owner_id=2),
                TransactionCategory(id=3, name="Grupal prueba", owner_id=2, group_id=10),
            ])
            await db.commit()

            dal = TransactionCategoryDAL(db)

            async def visibles(user_id):
                grupos = await dal.get_group_ids_for_user(user_id)
                categorias = await dal.get_visible_categories(
                    user_id, grupos, []
                )
                return {categoria.id for categoria in categorias}

            # Administradora: ve global y grupal, no privada de Juan.
            assert await visibles(1) == {1, 3}

            # Miembro: ve global, privada propia y grupal.
            assert await visibles(2) == {1, 2, 3}

            # Usuario ajeno: solamente global.
            assert await visibles(3) == {1}

            # Juan abandona el grupo.
            miembro = await db.get(GroupAccountMember, (2, 10))
            await db.delete(miembro)
            await db.commit()

            # Conserva su categoría privada, pero pierde la grupal.
            assert await visibles(2) == {1, 2}
            
            servicio = TransactionCategoryService(dal)
            juan = await db.get(User, 2)

            # Juan ya no debe consultar la categoría grupal.
            with pytest.raises(HTTPException) as error:
                await servicio.get_by_id(3, juan)

            assert error.value.status_code == 404

            # Tampoco puede utilizarla como categoría padre.
            with pytest.raises(HTTPException) as error:
                await servicio._get_parent(
                    parent_category_id=3,
                    current_user=juan,
                    category_id=None,
                    group_id=10,
                    account_id=None,
                )

            assert error.value.status_code == 404
            
            # Juan no puede modificar la categoría grupal.
            with pytest.raises(HTTPException) as error:
                await servicio.update(
                    3,
                    TransactionCategoryUpdate(name="Nombre modificado"),
                    juan,
                )

            assert error.value.status_code == 404

            # Juan tampoco puede eliminarla.
            with pytest.raises(HTTPException) as error:
                await servicio.delete(3, juan)

            assert error.value.status_code == 404

    finally:
        await engine.dispose()
