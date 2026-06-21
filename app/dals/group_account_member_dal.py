from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.group_account_member import GroupAccountMember


class GroupAccountMemberDAL:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self):
        result = await self.db.execute(select(GroupAccountMember))
        return result.scalars().all()

    async def get_by_id(self, user_id: int, account_id: int):
        result = await self.db.execute(
            select(GroupAccountMember).where(
                GroupAccountMember.user_id == user_id,
                GroupAccountMember.account_id == account_id,
            )
        )
        return result.scalars().first()

    async def get_by_account_id(self, account_id: int):
        result = await self.db.execute(
            select(GroupAccountMember).where(
                GroupAccountMember.account_id == account_id
            )
        )
        return result.scalars().all()

    async def create(self, group_account_member: GroupAccountMember):
        self.db.add(group_account_member)
        await self.db.commit()
        await self.db.refresh(group_account_member)
        return group_account_member

    async def update(self, group_account_member: GroupAccountMember):
        await self.db.merge(group_account_member)
        await self.db.commit()
        await self.db.refresh(group_account_member)
        return group_account_member

    async def delete(self, group_account_member: GroupAccountMember):
        await self.db.delete(group_account_member)
        await self.db.commit()
