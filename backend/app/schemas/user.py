from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional

class UserCreate(BaseModel):
    name: str
    last_name: str
    email: EmailStr
    password: str = Field(..., max_length=72, description="Contraseña de máximo 72 caracteres")
    # al principio se guarda como null en la bbdd
    dni: Optional[str] = None
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    last_name: str
    email: EmailStr

    class Config:
        orm_mode = True