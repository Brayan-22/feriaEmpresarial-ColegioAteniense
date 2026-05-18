from app.models.base import Base
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import (
    Column,
    String,
    Integer,
    ForeignKey,
    Enum as SQLEnum,
    Numeric,
    DateTime,
    func,
)

from app.models.enums import BalanceType

class BalanceTxn(Base):
    __tablename__ = "balance_txn"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("feria_user.id"), nullable=False, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=True, index=True)
    amount = Column(Numeric(precision=10, scale=2), nullable=False)
    type = Column(SQLEnum(BalanceType), nullable=False, default=BalanceType.PERSONAL)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User", back_populates="balance_txns")
    order = relationship("Order", back_populates="balance_txns")