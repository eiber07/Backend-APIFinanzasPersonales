
from app.dals.user_dal import UserDAL
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse


class UserService:
    def __init__(self, userDal: UserDAL):
        self.userDal = userDal

    async def get_by_email(self, email: str):
        return await self.userDal.get_by_email(email)

    async def get_by_id(self, id: int):
        return await self.userDal.get_by_id(id)
    
    async def create(self, user: UserCreate):

        existing_user = await self.userDal.get_by_email(user.email)
        if existing_user:
            raise ValueError("El email ya está registrado")

        new_user = User(
            name=user.name,
            last_name=user.last_name,
            dni=user.dni,
            email=user.email,
            phone=user.phone,
            password=user.password 
        )

        created_user = await self.userDal.create(new_user)
        
        user_response = UserResponse(
            id=created_user.id,
            name=created_user.name,
            last_name=created_user.last_name,
            email=created_user.email
        )
        return user_response
    
    async def update(self, user: User):
        return await self.userDal.update(user)