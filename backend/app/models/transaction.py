from sqlalchemy import DECIMAL, Column, DateTime, Integer, String, ForeignKey 
from sqlalchemy.orm import relationship 
from app.models.audit_mixin import AuditMixin
from app.database.database import Base 
from datetime import datetime


class Transaction(Base, AuditMixin): 
    __tablename__ = "transactions" 
    id = Column(Integer, primary_key=True, index=True) 
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False, index=True)
    planned_expense_id = Column(Integer, nullable=True)
    planned_expense_installment_number = Column(Integer, nullable=True)
    type_id = Column(Integer, ForeignKey("transaction_types.id"), nullable=False)
    amount = Column(DECIMAL(13, 2), nullable=False)
    description = Column(String, nullable=True)
    category_id = Column(Integer, ForeignKey("transaction_categories.id"), nullable=False)
    status_id = Column(Integer, ForeignKey("statuses.id"), nullable=False) 
    transaction_date = Column(DateTime, nullable=False, default=datetime.now) #cargada por el usuario desde el front! No sobreescribre el audit_mixin
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    type = relationship("TransactionType", back_populates="transactions")
    category = relationship("TransactionCategory", back_populates="transactions")
    status = relationship("Status", back_populates="transactions")
    account = relationship("Account", back_populates="transactions")
    creator = relationship("User",foreign_keys=[user_id],)