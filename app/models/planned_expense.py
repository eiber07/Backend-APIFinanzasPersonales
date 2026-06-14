from sqlalchemy import DECIMAL, Column, DateTime, Integer, String, ForeignKey 
from sqlalchemy.orm import relationship 
from app.models.audit_mixin import AuditMixin
from app.database.database import Base 

class PlannedExpense(Base, AuditMixin): 
    __tablename__ = "planned_expenses" 
    id = Column(Integer, primary_key=True, index=True) 
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    amount = Column(DECIMAL(13, 2), nullable=False)
    description = Column(String, nullable=True)
    start_date = Column(DateTime, nullable=False)
    due_date = Column(DateTime, nullable=False)
    installment_number = Column(Integer, nullable=False)
    installment_amount = Column(DECIMAL(13, 2), nullable=False)
    status_id = Column(Integer, ForeignKey("statuses.id"), nullable=False)

    accounts = relationship("Account", back_populates="planned_expenses")
    status = relationship("Status", back_populates="planned_expenses")

    # moni: agregue las siguientes lineas, no podia correr la app :)
    transactions = relationship("Transaction", back_populates="planned_expense")



