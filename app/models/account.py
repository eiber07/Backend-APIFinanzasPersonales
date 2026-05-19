from sqlalchemy import Column, DateTime, Integer, String, ForeignKey 
from sqlalchemy.orm import relationship 
from app.models.audit_mixin import AuditMixin
from app.database.database import Base 

class Account(Base, AuditMixin): 
    """Modelo de cuenta bancaria
    """
    __tablename__ = "accounts" 
    id = Column(Integer, primary_key=True, index=True) 
    id_admin_user = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, unique=True, index=True, nullable=False)
    status_id = Column(Integer, ForeignKey("statuses.id"), nullable=False)
    description = Column(String, nullable=True)
    # balance = Column(Integer, nullable=False) // revisar si es necesario
    account_type_id = Column(Integer, ForeignKey("account_types.id"), nullable=False)

    account_type = relationship("AccountType", back_populates="accounts")
    status = relationship("Status", back_populates="accounts")
    user = relationship("User", back_populates="accounts")