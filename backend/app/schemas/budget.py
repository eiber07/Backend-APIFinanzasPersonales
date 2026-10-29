from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field, model_validator


class BudgetItemCreate(BaseModel):
    category_id: int
    target_amount: Decimal = Field(gt=0, max_digits=13, decimal_places=2)


class BudgetCreate(BaseModel):
    account_id: int
    items: list[BudgetItemCreate] = Field(default_factory=list)

    @model_validator(mode="after")
    def reject_duplicate_categories(self):
        category_ids = [item.category_id for item in self.items]
        if len(category_ids) != len(set(category_ids)):
            raise ValueError("Cada categoría puede aparecer una sola vez en el presupuesto.")
        return self


class BudgetUpdate(BaseModel):
    items: Optional[list[BudgetItemCreate]] = None

    @model_validator(mode="after")
    def reject_duplicate_categories(self):
        if self.items is not None:
            category_ids = [item.category_id for item in self.items]
            if len(category_ids) != len(set(category_ids)):
                raise ValueError("Cada categoría puede aparecer una sola vez en el presupuesto.")
        return self

    @model_validator(mode="after")
    def require_changes(self):
        if self.items is None:
            raise ValueError("Debes enviar al menos un campo para actualizar.")
        return self


class BudgetItemUpdate(BaseModel):
    category_id: Optional[int] = None
    target_amount: Optional[Decimal] = Field(
        default=None,
        gt=0,
    )

    @model_validator(mode="after")
    def require_changes(self):
        if self.category_id is None and self.target_amount is None:
            raise ValueError("Debes enviar category_id o target_amount.")
        return self


class BudgetItemResponse(BaseModel):
    id: int
    category_id: int
    category_name: str
    parent_category_id: Optional[int] = None
    target_amount: Decimal


class BudgetResponse(BaseModel):
    id: int
    account_id: int
    items: list[BudgetItemResponse]


class BudgetCategoryAmount(BaseModel):
    category_id: int
    category_name: str
    parent_category_id: Optional[int] = None
    target_amount: Decimal


class BudgetCategoriesResponse(BaseModel):
    has_budget: bool
    account_id: int
    categories: list[BudgetCategoryAmount]
