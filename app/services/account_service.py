from app.dals.account_dal import AccountDAL
from app.dals.status_dal import StatusDAL
from app.models.account import Account
from app.models.user import User
from app.schemas.account import AccountCreate, AccountResponse


class AccountService:
    def __init__(self, accountDAL: AccountDAL, statusDAL: StatusDAL):
        self.accountDAL = accountDAL
        self.statusDAL = statusDAL

    async def get_by_id(self, id: int):
        return await self.accountDAL.get_account_by_id(id)
    
    async def get_by_user_id(self, id: int):
        return await self.accountDAL.get_accounts_by_user_id(id)
    
    async def get_by_current_user(self, current_user: User):
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

