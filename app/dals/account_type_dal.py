from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.account_type import AccountType

class AccountTypeDAL:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self):
        result = await self.db.execute(select(AccountType))
        return result.scalars().all()
    
    async def get_by_id(self, account_type_id: int):
        result = await self.db.execute(select(AccountType).where(AccountType.id == account_type_id))
        return result.scalars().first()
    