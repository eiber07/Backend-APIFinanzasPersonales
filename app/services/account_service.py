from fastapi.responses import JSONResponse

from app.dals.account_dal import AccountDAL
from app.dals.status_dal import StatusDAL
from app.models import status
from app.models.account import Account
from app.models.user import User
from app.schemas.account import AccountCreate, AccountRequest, AccountResponse


class AccountService:
    def __init__(self, accountDAL: AccountDAL, statusDAL: StatusDAL):
        self.accountDAL = accountDAL
        self.statusDAL = statusDAL

    async def get_by_id(self, id: int, current_user: User):
        account = await self.accountDAL.get_account_by_id_with_account_type(id)

        if account.id_admin_user != current_user.id:
            raise ValueError("No tienes permiso para acceder a esta cuenta")

        account_response = AccountResponse(
            id= account.id,
            name = account.name,
            account_type = account.account_type.name
        )

        return account_response
    
    async def get_by_user_id(self, id: int):
        return await self.accountDAL.get_accounts_by_user_id(id)
    
    async def get_all_by_current_user(self, current_user: User):
        accounts = await self.get_by_user_id(current_user.id)
        accounts_response = [] 

        for account in accounts:
            accounts_response.append(AccountResponse(id=account.id,name=account.name,account_type= account.account_type.name))

        return accounts_response

    async def create_account(self, account: AccountCreate, current_user: User):
        active_status = await self.statusDAL.get_by_name('activa')

        new_account = Account(
            id_admin_user=current_user.id,
            name=account.name,
            account_type_id=account.account_type_id,
            description=account.description,
            status_id=active_status.id
        )

        account_created = await self.accountDAL.create_account(new_account)
        account_created = await self.accountDAL.get_account_by_id_with_account_type(account_created.id)

        account_response = AccountResponse(
            id=account_created.id,
            name=account_created.name,
            account_type=account_created.account_type.name
        )

        return account_response
    
    async def update_account(self, account:AccountRequest, current_user: User):
        account_exists= await self.accountDAL.get_account_by_id(account.id)
        
        if account_exists is None:
            raise ValueError("La cuenta no existe")
        
        # Solo el administrador de la cuenta puede actualizar estos atributos
        if account_exists.id_admin_user != current_user.id:
            raise ValueError("No tienes permiso para actualizar esta cuenta")

        account_update = Account(
            id = account_exists.id,
            id_admin_user = account_exists.id_admin_user,
            status_id = account_exists.status_id,
            account_type_id = account_exists.account_type_id,
            name = account.name,            
            description = account.description,
        )

        account_updated = await self.accountDAL.update_account(account_update)
        account_updated = await self.accountDAL.get_account_by_id_with_account_type(account_updated.id)

        account_response = AccountResponse(
            id=account_updated.id,
            name=account_updated.name,
            account_type=account_updated.account_type.name
        )

        return account_response

    async def deactivate_account(self, id: int, current_user: User):
        account= await self.accountDAL.get_account_by_id(id)
        
        if account is None:
            raise ValueError("La cuenta no existe")
        
        if account.id_admin_user != current_user.id:
            raise ValueError("No tienes permiso para actualizar esta cuenta")
        
        inactive_status = await self.statusDAL.get_by_name('inactiva')

        #Borrado Logico
        account_update = Account(
            id = account.id,
            id_admin_user = account.id_admin_user,
            status_id = inactive_status.id,
            account_type_id = account.account_type_id,
            name = account.name,            
            description = account.description,
        )

        await self.accountDAL.update_account(account_update)

        return JSONResponse(
            status_code= 200,
            content={"message": "Cuenta borrada exitosamente", "success": True}
        )



