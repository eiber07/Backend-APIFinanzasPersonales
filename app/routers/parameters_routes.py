

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.dals.account_type_dal import AccountTypeDAL
from app.dals.status_dal import StatusDAL
from app.dals.transaction_category_dal import TransactionCategoryDAL
from app.dals.transaction_type_dal import TransactionTypeDAL
from app.database.database import get_db
from app.services.parameters_service import ParametersService


router = APIRouter()

@router.get("/parameters", response_model=dict)
async def get_parameters(
        parameters: str,
        db: AsyncSession = Depends(get_db)
        ):
    
    status_dal = StatusDAL(db)
    account_type_dal = AccountTypeDAL(db)
    transaction_type_dal = TransactionTypeDAL(db)
    transaction_category_dal = TransactionCategoryDAL(db)
        
    parameters_service = ParametersService(
        status_dal=status_dal,
        account_type_dal=account_type_dal,
        transaction_type_dal=transaction_type_dal,
        transaction_category_dal=transaction_category_dal
    )

    if(parameters == "statuses"):
        parameters = await parameters_service.get_statuses()
    elif(parameters == "accountTypes"):
        parameters = await parameters_service.get_account_types()
    elif(parameters == "transactionTypes"):
        parameters = await parameters_service.get_transaction_types()
    elif(parameters == "transactionCategories"):
        parameters = await parameters_service.get_transaction_categories()
    else:
        return {"error": "Parámetro no válido"}

    return {"result": parameters}