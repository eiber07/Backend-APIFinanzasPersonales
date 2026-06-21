from pydantic import BaseModel
from typing import Optional
from decimal import Decimal
from datetime import datetime

class PlannedExpenseCreate(BaseModel):
    account_id: int
    amount: Decimal
    description: Optional[str] = None
    start_date: datetime
    due_date: datetime
    installment_number: int
    installment_amount: Decimal

class PlannedExpenseRequest(BaseModel):
    id: int
    amount: Optional[Decimal] = None
    description: Optional[str] = None
    start_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    installment_number: Optional[int] = None
    installment_amount: Optional[Decimal] = None

class PlannedExpenseResponse(BaseModel):
    id: int
    account_id: int
    amount: Decimal
    description: Optional[str] = None
    start_date: datetime
    due_date: datetime
    installment_number: int
    installment_amount: Decimal
    installments_paid: int
    
    class Config:
        orm_mode = True