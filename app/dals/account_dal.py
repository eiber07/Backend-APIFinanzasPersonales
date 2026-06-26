from sqlalchemy import or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.models.account import Account
from app.models.group_account_member import GroupAccountMember

class AccountDAL:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_accounts_by_user_id(self, user_id: int):
        result = await self.db.execute(
            select(Account)
            .outerjoin(GroupAccountMember, GroupAccountMember.account_id == Account.id,)
            .options(selectinload(Account.account_type))
            .where(Account.status_id == 1, or_(Account.id_admin_user == user_id, GroupAccountMember.user_id == user_id,))
        )
        return result.unique.scalars().all()
    
    async def get_account_by_id(self, account_id: int):
        result = await self.db.execute(
            select(Account)
            .options(selectinload(Account.account_type))
            .where(Account.id == account_id)
        )
        return result.scalars().first()

    async def get_account_by_id_with_account_type(self, account_id: int):
        result = await self.db.execute(
            select(Account)
            .options(selectinload(Account.account_type))
            .where(Account.id == account_id)
        )
        return result.scalars().first()
    
    async def create_account(self, account: Account):
        self.db.add(account)
        await self.db.commit()
        await self.db.refresh(account)
        return account
    
    async def update_account(self, account: Account):
        await self.db.merge(account)
        await self.db.commit()
        return account
    
    async def delete_account(self, account: Account):
        await self.db.delete(account)
        await self.db.commit()