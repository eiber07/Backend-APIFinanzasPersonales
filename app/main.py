from fastapi import FastAPI
from app.models.user import User
from app.models.account import Account
from app.models.transaction import Transaction
from app.models.group_account_member import GroupAccountMember
from app.models.planned_expense import PlannedExpense
from app.models.transaction_category import TransactionCategory
from app.models.account_type import AccountType
from app.models.transaction_type import TransactionType
from app.models.status import Status
from app.database.database import engine, Base

app = FastAPI()

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

@app.get("/") 
async def hola_mundo(): 
    return {"mensaje": "Hola mundo"}

