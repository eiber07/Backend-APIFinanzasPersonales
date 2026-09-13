from sqlalchemy import DECIMAL, Column, DateTime, Integer, String, ForeignKey, PrimaryKeyConstraint
from sqlalchemy.orm import relationship 
from app.models.audit_mixin import AuditMixin
from app.database.database import Base 

class PlannedExpense(Base, AuditMixin): 
    __tablename__ = "planned_expenses" 

    id_planned_expense = Column(Integer, nullable=False) 
    installment_number = Column(Integer, nullable=False)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    installment_amount = Column(DECIMAL(13, 2), nullable=False)
    description = Column(String, nullable=True)
    due_date = Column(DateTime, nullable=False)
    status_id = Column(Integer, ForeignKey("statuses.id"), nullable=False)
    # PK compuesta = (id de gasto, id cuota)
    __table_args__ = (
        PrimaryKeyConstraint('id_planned_expense', 'installment_number'),
    )

    accounts = relationship("Account", back_populates="planned_expenses")
    status = relationship("Status", back_populates="planned_expenses")


