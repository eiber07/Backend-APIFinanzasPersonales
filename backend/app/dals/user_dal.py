from app.models.user import User
from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from ..auth.password import get_password_hash

class UserDAL:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_email(self, email: str):
        normalized_email = email.strip().lower()
        
        result = await self.db.execute(select(User).where(func.lower(User.email) == normalized_email))
        return result.scalars().first()

    async def get_by_id(self, id: int):
        result = await self.db.execute(select(User).where(User.id == id))
        return result.scalars().first()
    
    async def create(self, user: User):
        user.password = get_password_hash(user.password)
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user
    
    async def update(self, user: User):
        await self.db.commit()
        await self.db.refresh(user)
        return user