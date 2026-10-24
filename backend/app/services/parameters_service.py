
from app.dals.account_type_dal import AccountTypeDAL
from app.dals.status_dal import StatusDAL
from app.dals.transaction_category_dal import TransactionCategoryDAL
from app.dals.transaction_type_dal import TransactionTypeDAL
from app.schemas.parameters import (
    ParametersResponse,
    TransactionCategoryParameterResponse,
)
from app.models.user import User


class ParametersService:
    def __init__(
            self,
            status_dal: StatusDAL,
            account_type_dal: AccountTypeDAL,
            transaction_type_dal: TransactionTypeDAL,
            transaction_category_dal: TransactionCategoryDAL 
            ):
        self.status_dal = status_dal
        self.account_type_dal = account_type_dal
        self.transaction_type_dal = transaction_type_dal
        self.transaction_category_dal = transaction_category_dal

    async def get_statuses(self):

        response = await self.status_dal.get_all()
        statuses_response = []
        for status in response:
            statuses_response.append(ParametersResponse(id=status.id, value=status.name))

        return statuses_response

    async def get_account_types(self):
        response = await self.account_type_dal.get_all()
        account_types_response = []
        for account_type in response:
            account_types_response.append(ParametersResponse(id=account_type.id, value=account_type.name))
        return account_types_response

    async def get_transaction_types(self):
        reponse = await self.transaction_type_dal.get_all()
        transaction_types_response = []
        for transaction_type in reponse:
            transaction_types_response.append(ParametersResponse(id=transaction_type.id, value=transaction_type.name))
        return transaction_types_response

    async def get_transaction_categories(self, current_user: User | None = None):
        if current_user is None:
            categories = await self.transaction_category_dal.get_all_global()
        else:
            group_ids = await self.transaction_category_dal.get_group_ids_for_user(
                current_user.id
            )
            categories = await self.transaction_category_dal.get_visible_categories(
                current_user.id,
                group_ids,
            )
        return [
            TransactionCategoryParameterResponse(
                id=category.id,
                value=category.name,
                parent_category_id=category.parent_category_id,
                account_id=category.account_id,
            )
            for category in categories
        ]
    