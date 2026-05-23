from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.user import User
from app.models.account import Account
from app.models.transaction import Transaction
from app.models.group_account_member import GroupAccountMember
from app.models.planned_expense import PlannedExpense
from app.models.transaction_category import TransactionCategory
from app.models.account_type import AccountType
from app.models.transaction_type import TransactionType
from app.models.status import Status
from app.database.database import engine, Base, get_db
from app.schemas.user import UserCreate
from passlib.context import CryptContext
from fastapi.middleware.cors import CORSMiddleware


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

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

@app.get("/") 
async def hola_mundo(): 
    return {"mensaje": "Hola mundo"}

@app.post("/api/register")
async def register(user: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == user.email))
    existing_user = result.scalars().first()
    if existing_user:
        raise HTTPException(status_code=400, detail="El email ya está registrado")

    hashed_password = pwd_context.hash(user.password)

    new_user = User(
        name=user.name,
        last_name=user.last_name,
        dni=user.dni,
        email=user.email,
        phone=user.phone,
        password=hashed_password
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return {"message": "Usuario creado correctamente", "id": new_user.id}