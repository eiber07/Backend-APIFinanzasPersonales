
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.status import Status

class StatusDAL:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self):
        result = await self.db.execute(select(Status))
        return result.scalars().all()
    
    async def get_by_id(self, status_id: int):
        result = await self.db.execute(select(Status).where(Status.id == status_id))
        return result.scalars().first()
