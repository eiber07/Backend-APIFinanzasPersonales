from app.models.user import User
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from ..auth.password import get_password_hash

class UserDAL:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_email(self, email: str):
        result = await self.db.execute(select(User).where(User.email == email))
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