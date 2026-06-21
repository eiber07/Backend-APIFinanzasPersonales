
from typing import Optional

from pydantic import BaseModel


class AccountCreate(BaseModel):
    name: str
    account_type_id: int
    description: Optional[str] = None
    # si es grupal deberian enviarse los miembros

class AccountRequest(BaseModel):
    id: int
    name: str
    description: Optional[str] = None

class AccountResponse(BaseModel):
    id: int
    name:str
    account_type: str

    class Config:
        orm_mode = True
    # si es grupal deberia devolver el objeto de los miembros
