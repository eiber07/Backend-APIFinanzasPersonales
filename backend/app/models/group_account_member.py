from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.models.audit_mixin import AuditMixin
from app.database.database import Base


class GroupAccountMember(Base, AuditMixin):
    __tablename__ = "group_account_members"
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    account_id = Column(Integer, ForeignKey("accounts.id"), primary_key=True)
    role = Column(String, index=True, nullable=False)

    user = relationship("User", back_populates="group_account_members")
    accounts = relationship("Account", back_populates="group_account_members")