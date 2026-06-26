from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship 
from app.models.audit_mixin import AuditMixin
from app.database.database import Base 

class User(Base, AuditMixin): 
    __tablename__ = "users" 
    id = Column(Integer, primary_key=True, index=True) 
    name = Column(String, nullable=False) 
    last_name = Column(String, nullable=False) 
    dni = Column(String, unique=True, index=True, nullable=True) 
    email = Column(String, unique=True, index=True, nullable=False) 
    phone = Column(String, unique=True, index=True, nullable=True) 
    password = Column(String, nullable=False)

    accounts = relationship("Account", back_populates="user")
    group_account_members = relationship("GroupAccountMember", back_populates="user")