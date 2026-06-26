
from app.dals.account_dal import AccountDAL
from app.dals.account_type_dal import AccountTypeDAL
from app.dals.status_dal import StatusDAL
from app.dals.user_dal import UserDAL
from app.models.user import User
from app.models.account import Account
from app.schemas.user import UserCreate, UserResponse


class UserService:
    def __init__(self, userDal: UserDAL, accountDAL: AccountDAL, statusDAL: StatusDAL, accountTypeDAL: AccountTypeDAL):
        self.userDal = userDal
        self.accountDal = accountDAL
        self.statusDAL = statusDAL
        self.accountTypeDAL = accountTypeDAL

    async def get_by_email(self, email: str):
        return await self.userDal.get_by_email(email)

    async def get_by_id(self, id: int):
        user = await self.userDal.get_by_id(id)
        user_response = UserResponse(
            id=user.id,
            name=user.name,
            last_name=user.last_name,
            email=user.email
        )
        return user_response
    
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

        status_active = await self.statusDAL.get_by_name('activa')
        personal_account_type = await self.accountTypeDAL.get_by_name('personal')

        new_account = Account(
            id_admin_user = created_user.id,
            name = created_user.name,
            status_id = status_active.id, 
            account_type_id = personal_account_type.id,
        )

        # Crear cuenta cuando un usuario se registra
        await self.accountDal.create_account(new_account)
        
        user_response = UserResponse(
            id=created_user.id,
            name=created_user.name,
            last_name=created_user.last_name,
            email=created_user.email
        )
        return user_response
    
    async def update(self, user: User):
        return await self.userDal.update(user)