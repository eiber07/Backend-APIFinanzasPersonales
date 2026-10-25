from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from app.models.audit_mixin import AuditMixin
from app.database.database import Base


class TransactionCategory(Base, AuditMixin):
    __tablename__ = "transaction_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    parent_category_id = Column(
        Integer,
        ForeignKey("transaction_categories.id", ondelete="RESTRICT"),
        nullable=True,
        index=True,
    )
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=True)
    group_id = Column(Integer, ForeignKey("accounts.id", ondelete="RESTRICT"), nullable=True)
    account_id = Column(Integer, ForeignKey("accounts.id", ondelete="RESTRICT"), nullable=True)

    transactions = relationship(
        "Transaction",
        back_populates="category",
        passive_deletes="all",
    )
    parent = relationship(
        "TransactionCategory",
        remote_side=[id],
        foreign_keys=[parent_category_id],
        back_populates="children",
    )
    children = relationship(
        "TransactionCategory",
        foreign_keys=[parent_category_id],
        back_populates="parent",
        passive_deletes="all",
    )
    owner = relationship(
        "User",
        foreign_keys=[owner_id],
        back_populates="transaction_categories",
    )
    group = relationship(
        "Account",
        foreign_keys=[group_id],
        back_populates="transaction_categories",
    )
    account = relationship(
        "Account",
        foreign_keys=[account_id],
        back_populates="personal_transaction_categories",
    )