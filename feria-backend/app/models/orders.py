from sqlalchemy import (
    Column,
    Integer,
    ForeignKey,
    Numeric,
    Enum as SQLEnum,
    DateTime,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import Base
from app.models.enums import OrderStatus


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    buyer_id = Column(UUID(as_uuid=True), ForeignKey("feria_user.id"), nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    total = Column(Numeric(precision=10, scale=2), nullable=False)
    status = Column(SQLEnum(OrderStatus), nullable=False, default=OrderStatus.PENDING)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    buyer = relationship("User", back_populates="orders")
    company = relationship("Companies", back_populates="orders")
    order_items = relationship("OrderItem", back_populates="order")
    balance_txns = relationship("BalanceTxn", back_populates="order")

