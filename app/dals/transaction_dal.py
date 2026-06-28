from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.models.transaction import Transaction

class TransactionDAL:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_transactions_by_account_id(self, account_id: int):
        result = await self.db.execute(
            select(Transaction).options(
                selectinload(Transaction.type),
                selectinload(Transaction.category),
                selectinload(Transaction.creator),
            ).where(
                Transaction.account_id == account_id, Transaction.status_id ==1
            )
        )
        return result.scalars().all()
    
    async def get_transaction_by_id(self, transaction_id: int):
        result = await self.db.execute(
            select(Transaction)
            .options(
                selectinload(Transaction.type),
                selectinload(Transaction.category),
                selectinload(Transaction.creator),
            )
            .where(Transaction.id == transaction_id)
        )
        return result.scalars().first()

    async def create_transaction(self, transaction: Transaction):
        self.db.add(transaction)
        await self.db.commit()
        await self.db.refresh(transaction)
        return transaction
    
    async def update_transaction(self, transaction: Transaction):
        await self.db.merge(transaction)
        await self.db.commit()
        return transaction
    
    async def deactivate_transaction(self, transaction: Transaction):
        transaction.status_id = 2
        await self.db.commit()
        return transaction
    