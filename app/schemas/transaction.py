from pydantic import BaseModel
from typing import Optional
from decimal import Decimal
from datetime import datetime

class TransactionCreate(BaseModel):
    account_id: int
    type_id:int
    amount: Decimal
    description: Optional[str] = None
    category_id: int
    planned_expense_id: Optional[int] = None
    planned_expense_installment_number: Optional[int] = None

    transaction_date: datetime

class TransactionRequest(BaseModel):
    id: int
    amount: Optional[Decimal] = None
    description: Optional[str] = None
    category_id: Optional[int] = None
    type_id: Optional[int] = None
    transaction_date: Optional[datetime] = None

class TransactionResponse(BaseModel):
    id: int
    account_id: int
    type: str
    amount: Decimal
    description: Optional[str] = None
    category: str
    category_id: int
    planned_expense_id: Optional[int] = None
    planned_expense_installment_number: Optional[int] = None
    transaction_date: datetime
    
    class Config:
        orm_mode = True