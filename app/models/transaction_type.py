from sqlalchemy import Column, Integer, String, ForeignKey 
from sqlalchemy.orm import relationship 
from app.models.audit_mixin import AuditMixin
from database import Base

class TransactionType(Base, AuditMixin): 
    __tablename__ = "transaction_types" 
    id = Column(Integer, primary_key=True, index=True) 
    name = Column(String, unique=True, index=True, nullable=False)