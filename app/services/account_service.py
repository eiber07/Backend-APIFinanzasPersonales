from fastapi import HTTPException
from fastapi.responses import JSONResponse

from app.dals.account_dal import AccountDAL
from app.dals.group_account_member_dal import GroupAccountMemberDAL
from app.dals.status_dal import StatusDAL
from app.dals.user_dal import UserDAL
from app.models.account import Account
from app.models.group_account_member import GroupAccountMember
from app.models.user import User
from app.schemas.account import AccountCreate, AccountRequest, AccountResponse


class AccountService:
    def __init__(
        self,
        accountDAL: AccountDAL,
        statusDAL: StatusDAL,
        groupAccountMemberDAL: GroupAccountMemberDAL,
    ):
        self.accountDAL = accountDAL
        self.statusDAL = statusDAL
        self.groupAccountMemberDAL = groupAccountMemberDAL

    async def _build_account_response(self, account: Account) -> AccountResponse:
        members = await self.groupAccountMemberDAL.get_by_account_id(account.id)
        member_ids = [member.user_id for member in members]

        return AccountResponse(
            id=account.id,
            name=account.name,
            account_type=account.account_type.name,
            member_ids=member_ids,
        )

    async def _validate_group_members(self, member_ids: list[int], owner_id: int):
        total_ids = set(member_ids) | {owner_id}

        if len(total_ids) > 7:
            raise HTTPException(
                status_code=400,
                detail="Una cuenta grupal no puede tener más de 7 miembros incluyendo al propietario.",
            )

        if len(set(member_ids)) != len(member_ids):
            raise HTTPException(
                status_code=400,
                detail="No puedes repetir usuarios en la lista de miembros.",
            )

        user_dal = UserDAL(self.accountDAL.db)
        for user_id in total_ids:
            user = await user_dal.get_by_id(user_id)
            if user is None:
                raise HTTPException(
                    status_code=400,
                    detail=f"El usuario con id {user_id} no existe.",
                )

    async def _sync_group_members(self, account_id: int, member_ids: list[int], owner_id: int):
        total_ids = set(member_ids) | {owner_id}
        await self._validate_group_members(member_ids, owner_id)

        existing_members = await self.groupAccountMemberDAL.get_by_account_id(account_id)
        existing_user_ids = {member.user_id for member in existing_members}

        # Remove members that are no longer included, except owner
        for member in existing_members:
            if member.user_id not in total_ids:
                await self.groupAccountMemberDAL.delete(member)

        # Add or update members
        for user_id in total_ids:
            if user_id not in existing_user_ids:
                await self.groupAccountMemberDAL.create(
                    GroupAccountMember(
                        user_id=user_id,
                        account_id=account_id,
                        role="admin" if user_id == owner_id else "member",
                    )
                )

    async def get_by_id(self, id: int, current_user: User):
        account = await self.accountDAL.get_account_by_id_with_account_type(id)

        if account is None:
            raise HTTPException(
                status_code=404,
                detail="La cuenta no existe.",
            )

        if account.id_admin_user != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="No tienes permiso para acceder a esta cuenta.",
            )

        return await self._build_account_response(account)
    
    async def get_by_user_id(self, id: int):
        return await self.accountDAL.get_accounts_by_user_id(id)
    
    async def get_all_by_current_user(self, current_user: User):
        accounts = await self.get_by_user_id(current_user.id)
        accounts_response = []

        for account in accounts:
            accounts_response.append(
                await self._build_account_response(account)
            )

        return accounts_response

    async def create_account(self, account: AccountCreate, current_user: User):
        active_status = await self.statusDAL.get_by_name('activa')

        if account.account_type_id == 2:
            member_ids = account.member_ids or []
            await self._validate_group_members(member_ids, current_user.id)
        elif account.member_ids:
            raise HTTPException(
                status_code=400,
                detail="Los miembros solo pueden asignarse a cuentas grupales.",
            )

        new_account = Account(
            id_admin_user=current_user.id,
            name=account.name,
            account_type_id=account.account_type_id,
            description=account.description,
            status_id=active_status.id,
        )

        account_created = await self.accountDAL.create_account(new_account)
        account_created = await self.accountDAL.get_account_by_id_with_account_type(
            account_created.id
        )

        if account_created.account_type_id == 2:
            member_ids = account.member_ids or []
            total_ids = set(member_ids) | {current_user.id}
            for user_id in total_ids:
                await self.groupAccountMemberDAL.create(
                    GroupAccountMember(
                        user_id=user_id,
                        account_id=account_created.id,
                        role="admin" if user_id == current_user.id else "member",
                    )
                )

        return await self._build_account_response(account_created)
    
    async def update_account(self, account: AccountRequest, current_user: User):
        account_exists = await self.accountDAL.get_account_by_id(account.id)
        
        if account_exists is None:
            raise HTTPException(
                status_code=404,
                detail="La cuenta no existe.",
            )
        
        if account_exists.id_admin_user != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="No tienes permiso para actualizar esta cuenta.",
            )

        account_update = Account(
            id=account_exists.id,
            id_admin_user=account_exists.id_admin_user,
            status_id=account_exists.status_id,
            account_type_id=account_exists.account_type_id,
            name=account.name,
            description=account.description,
        )

        account_updated = await self.accountDAL.update_account(account_update)
        account_updated = await self.accountDAL.get_account_by_id_with_account_type(
            account_updated.id
        )

        if (
            account_updated.account_type_id == 2
            and account.member_ids is not None
        ):
            await self._sync_group_members(
                account_updated.id,
                account.member_ids,
                current_user.id,
            )
            account_updated = await self.accountDAL.get_account_by_id_with_account_type(
                account_updated.id
            )

        return await self._build_account_response(account_updated)

    async def deactivate_account(self, id: int, current_user: User):
        account = await self.accountDAL.get_account_by_id(id)
        
        if account is None:
            raise HTTPException(
                status_code=404,
                detail="La cuenta no existe.",
            )
        
        if account.id_admin_user != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="No tienes permiso para actualizar esta cuenta.",
            )
        
        inactive_status = await self.statusDAL.get_by_name('inactiva')

        account_update = Account(
            id=account.id,
            id_admin_user=account.id_admin_user,
            status_id=inactive_status.id,
            account_type_id=account.account_type_id,
            name=account.name,
            description=account.description,
        )

        await self.accountDAL.update_account(account_update)

        return JSONResponse(
            status_code=200,
            content={"message": "Cuenta borrada exitosamente", "success": True}
        )