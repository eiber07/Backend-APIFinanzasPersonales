from fastapi import HTTPException

from app.auth.jwt import create_access_token
from app.services.user_service import UserService
from ..auth.password import verify_password
from app.schemas.token import Token

class AuthService:
    def __init__(self, user_service: UserService):
        self.user_service = user_service

    async def authenticate_user(self, email: str, password: str) -> Token:
        
        existing_user = await self.user_service.get_by_email(email)
    
        if not existing_user:
            raise HTTPException(status_code=401, detail="El usuario ingresado no está registrado")
        if not verify_password(password, existing_user.password):
            raise HTTPException(status_code=401, detail="Contraseña incorrecta")
        
        access_token = create_access_token(data={"sub": existing_user.email})
        
        token = Token(access_token=access_token, token_type="bearer")
        
        return token
