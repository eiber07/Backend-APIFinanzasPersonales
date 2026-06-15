
from sqlalchemy.orm import Session
from sqlalchemy.future import select
from app.models.transaction_type import TransactionType


class TransactionTypeDAL:
    def __init__(self, db: Session):
        self.db = db

    async def get_all(self):
        result = await self.db.execute(select(TransactionType))
        return result.scalars().all()

    async def get_by_id(self, transaction_type_id: int):
        result = await self.db.execute(select(TransactionType).where(TransactionType.id == transaction_type_id))
        return result.scalars().first()
