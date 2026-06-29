

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.dals.account_type_dal import AccountTypeDAL
from app.dals.status_dal import StatusDAL
from app.dals.transaction_category_dal import TransactionCategoryDAL
from app.dals.transaction_type_dal import TransactionTypeDAL
from app.database.database import get_db
from app.services.parameters_service import ParametersService


router = APIRouter()

def get_parameters_service(db: AsyncSession = Depends(get_db)) -> ParametersService:
    return ParametersService(
        StatusDAL(db),
        AccountTypeDAL(db),
        TransactionTypeDAL(db),
        TransactionCategoryDAL(db)
    )

@router.get("/parameters", response_model=dict)
async def get_parameters(
        parameters: str,
        service: ParametersService = Depends(get_parameters_service)
        ):

    parameter_handlers = {
        "statuses": service.get_statuses,
        "accountTypes": service.get_account_types,
        "transactionTypes": service.get_transaction_types,
        "transactionCategories": service.get_transaction_categories,
    }

    handler = parameter_handlers.get(parameters)
    if handler is None:
        return {"error": "Parámetro no válido"}

    parameters = await handler()
    return {"result": parameters}