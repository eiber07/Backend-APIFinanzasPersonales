from sqlalchemy import (
    Column,
    CheckConstraint,
    DateTime,
    DECIMAL,
    ForeignKey,
    Integer,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import relationship

from app.database.database import Base


class Budget(Base):
    __tablename__ = "budgets"
    __table_args__ = (
        UniqueConstraint("account_id", name="uq_budget_account"),
    )

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(
        Integer,
        ForeignKey("accounts.id", ondelete="CASCADE"),
        nullable=False,
    )
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    account = relationship("Account", back_populates="budgets")
    items = relationship(
        "BudgetItem",
        back_populates="budget",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="BudgetItem.id",
    )


class BudgetItem(Base):
    __tablename__ = "budget_items"
    __table_args__ = (
        UniqueConstraint("budget_id", "category_id", name="uq_budget_item_category"),
        CheckConstraint("target_amount > 0", name="ck_budget_item_target_amount"),
    )

    id = Column(Integer, primary_key=True, index=True)
    budget_id = Column(
        Integer,
        ForeignKey("budgets.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    category_id = Column(
        Integer,
        ForeignKey("transaction_categories.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    target_amount = Column(DECIMAL(13, 2), nullable=False)

    budget = relationship("Budget", back_populates="items")
    category = relationship("TransactionCategory")
