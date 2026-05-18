from sqlalchemy import DECIMAL, Column, DateTime, Integer, String, ForeignKey 
from sqlalchemy.orm import relationship 
from app.models.audit_mixin import AuditMixin
from database import Base

class Transaction(Base, AuditMixin): 
    __tablename__ = "transactions" 
    id = Column(Integer, primary_key=True, index=True) 
    planned_expense_id = Column(Integer, ForeignKey("planned_expenses.id"), nullable=True)
    type_id = Column(Integer, ForeignKey("transaction_types.id"), nullable=False)
    amount = Column(DECIMAL(13, 2), nullable=False)
    description = Column(String, nullable=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    status_id = Column(Integer, ForeignKey("statuses.id"), nullable=False) 

    type = relationship("TransactionType", back_populates="transactions")
    planned_expense = relationship("PlannedExpense", back_populates="transactions")
    category = relationship("Category", back_populates="transactions")
    status = relationship("Status", back_populates="transactions")

    # status tiene sentido en esta tabla?