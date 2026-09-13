from sqlalchemy import Column, Integer, String, ForeignKey 
from sqlalchemy.orm import relationship 
from app.models.audit_mixin import AuditMixin
from app.database.database import Base 

class Status(Base, AuditMixin): 
    __tablename__ = "statuses" 
    id = Column(Integer, primary_key=True, index=True) 
    name = Column(String, unique=True, index=True, nullable=False)
    
    accounts = relationship("Account", back_populates="status") 
    planned_expenses = relationship("PlannedExpense", back_populates="status")
    transactions = relationship("Transaction", back_populates="status")    
