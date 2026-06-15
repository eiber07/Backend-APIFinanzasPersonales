from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.transaction_category import TransactionCategory

class TransactionCategoryDAL:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_all(self):
        result = await self.db.execute(select(TransactionCategory))
        return result.scalars().all()
    
    async def get_by_id(self, transaction_category_id: int):
        result = await self.db.execute(select(TransactionCategory).where(TransactionCategory.id == transaction_category_id))
        return result.scalars().first()