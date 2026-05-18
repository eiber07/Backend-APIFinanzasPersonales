from sqlalchemy import Column, Integer, String, ForeignKey 
from sqlalchemy.orm import relationship 
from app.models.audit_mixin import AuditMixin
from database import Base

class Usuario(Base, AuditMixin): 
    __tablename__ = "users" 
    id = Column(Integer, primary_key=True, index=True) 
    name = Column(String, nullable=False) 
    last_name = Column(String, nullable=False) 
    dni = Column(String, unique=True, index=True, nullable=False) 
    email = Column(String, unique=True, index=True, nullable=False) 
    phone = Column(String, unique=True, index=True, nullable=False) 