from pydantic import BaseModel, Field
from typing import Optional
from decimal import Decimal
from datetime import datetime

class PlannedExpenseCreate(BaseModel):
    account_id: int
    description: Optional[str] = None
    installment_amount: Decimal
    installments: int = Field(ge=1, le=360)
    due_date: datetime  # fecha de la primera cuota

class PlannedExpenseRequest(BaseModel):
    id_planned_expense: int
    installment_number: int
    installment_amount: Optional[Decimal] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    status_id: Optional[int] = None

class PlannedExpenseResponse(BaseModel):
    id_planned_expense: int
    installment_number: int
    account_id: int
    installment_amount: Decimal
    description: Optional[str]
    due_date: datetime
    status_id: int
    total: Decimal

    class Config:
        orm_mode = True