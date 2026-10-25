from typing import List, Optional

from pydantic import BaseModel, Field, field_validator


class TransactionCategoryCreate(BaseModel):
    name: str = Field(min_length=1)
    parent_category_id: Optional[int] = None
    group_id: Optional[int] = None
    account_id: Optional[int] = None

    @field_validator("parent_category_id", mode="before")
    @classmethod
    def normalize_root_parent(cls, value):
        return None if value == 0 else value

    @field_validator("group_id", "account_id", mode="before")
    @classmethod
    def normalize_missing_account(cls, value):
        return None if value == 0 else value


class TransactionCategoryUpdate(BaseModel):
    name: Optional[str] = None
    parent_category_id: Optional[int] = None

    @field_validator("parent_category_id", mode="before")
    @classmethod
    def normalize_root_parent(cls, value):
        return None if value == 0 else value


class TransactionCategorySummary(BaseModel):
    id: int
    name: str
    parent_category_id: Optional[int] = None
    owner_id: Optional[int] = None
    group_id: Optional[int] = None
    account_id: Optional[int] = None


class TransactionCategoryResponse(TransactionCategorySummary):
    parent: Optional[TransactionCategorySummary] = None
    children: List[TransactionCategorySummary] = Field(default_factory=list)
