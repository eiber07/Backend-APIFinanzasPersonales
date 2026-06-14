from sqlalchemy.orm import Session
from app.models.account import Account

class AccountDAL:
    def __init__(self, db: Session):
        self.db = db

    def get_accounts_by_user_id(self, user_id: int):
        return self.db.query(Account).filter(Account.id_admin_user == user_id).all()
    
    def get_account_by_id(self, account_id: int):
        return self.db.query(Account).filter(Account.id == account_id).first()  
    
    def create_account(self, account: Account):
        self.db.add(account)
        self.db.commit()
        self.db.refresh(account)
        return account
    
    def update_account(self, account: Account):
        self.db.merge(account)
        self.db.commit()
        return account
    
    def delete_account(self, account: Account):
        self.db.delete(account)
        self.db.commit()