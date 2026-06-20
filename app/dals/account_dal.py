from sqlalchemy.orm import Session
from app.models.account import Account

class AccountDAL:
    def __init__(self, db: Session):
        self.db = db

    async def get_accounts_by_user_id(self, user_id: int):
        return await self.db.query(Account).filter(Account.id_admin_user == user_id).all()
    
    async def get_account_by_id(self, account_id: int):
        return await self.db.query(Account).filter(Account.id == account_id).first()  
    
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