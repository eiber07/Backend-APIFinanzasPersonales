from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.dals.account_dal import AccountDAL
from app.dals.group_account_member_dal import GroupAccountMemberDAL
from app.dals.account_type_dal import AccountTypeDAL
from app.dals.status_dal import StatusDAL
from app.dals.user_dal import UserDAL
from app.services.user_service import UserService
from ..auth.dependencies import get_current_user
from ..database.database import get_db
from ..schemas.user import UserResponse
from ..models.user import User as UserModel

router = APIRouter()

def get_user_service(db: AsyncSession = Depends(get_db)) -> UserService:
    return UserService(
        UserDAL(db),
        AccountDAL(db),
        StatusDAL(db),
        AccountTypeDAL(db)
    )

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: UserModel = Depends(get_current_user)):
    return current_user

@router.get("/by_id", response_model=UserResponse)
async def get_user_by_id(
    id: int,
    current_user: UserModel = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    service: UserService = Depends(get_user_service)
):
    # Permitir consultar los propios datos
    if id == current_user.id:
        return await service.get_by_id(id)

    # Obtener las cuentas activas a las que pertenece el usuario
    account_dal = AccountDAL(db)
    member_dal = GroupAccountMemberDAL(db)

    accounts = await account_dal.get_accounts_by_user_id(current_user.id)

    for account in accounts:
        # Solo permitir consultas compartidas en cuentas grupales
        if account.account_type.name.lower() != "grupal":
            continue

        # Permitir consultar al administrador del grupo
        if account.id_admin_user == id:
            return await service.get_by_id(id)

        # Permitir consultar a otro miembro del mismo grupo
        member = await member_dal.get_by_id(id, account.id)

        if member is not None:
            return await service.get_by_id(id)


    # Bloquear cualquier otro acceso
    raise HTTPException(
        status_code=403,
        detail="No tienes permiso para consultar este usuario."
    )