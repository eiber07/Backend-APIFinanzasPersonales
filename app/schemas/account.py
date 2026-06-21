
from typing import Optional

from pydantic import BaseModel, Field


class AccountCreate(BaseModel):
    name: str
    account_type_id: int
    description: Optional[str] = None
    member_ids: Optional[list[int]] = None


class AccountRequest(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    member_ids: Optional[list[int]] = None


class AccountResponse(BaseModel):
    id: int
    name: str
    account_type: str
    member_ids: list[int] = Field(default_factory=list)

    class Config:
        orm_mode = True
