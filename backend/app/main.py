from fastapi import FastAPI

# Importar todos los modelos para registrarlos en Base.metadata
from app.models import (
    User,
    Account,
    AccountType,
    Status,
    Transaction,
    TransactionType,
    TransactionCategory,
    GroupAccountMember,
    PlannedExpense,
)
from fastapi.middleware.cors import CORSMiddleware
from app.routers.auth_routes import router as auth_router
from app.routers.user_routes import router as users_router
from app.routers.password_routes import router as password_router
from app.routers.parameters_routes import router as parameters_router
from app.routers.account_routes import router as account_router
from app.routers.transaction_routes import router as transaction_router
from app.routers.planned_expense_routes import router as planned_expense_router

#pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


app = FastAPI()

# esto agregue por una restriccion de seguridad del navegador que bloquea
# request entre dominios distintos (mi caso back>8000, front>5500)
# El middleware le dice al backend que acepte requests desde cualquier origen ("*"), solucionando el bloqueo
app.add_middleware(           
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ROUTERS
app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(users_router, prefix="/users", tags=["users"])
app.include_router(password_router, prefix="/auth", tags=["auth"])
app.include_router(parameters_router, prefix="/parameters", tags=["parameters"])
app.include_router(account_router, prefix="/accounts", tags=["accounts"])
app.include_router(transaction_router, prefix="/transactions", tags=["transactions"])
app.include_router(planned_expense_router, prefix="/planned_expenses", tags=["planned-expenses"])


# ENDPOINT RAIZ
@app.get("/") 
async def read_root(): 
    return {"message": "Welcome to FastAPI authentication and authorization example"}