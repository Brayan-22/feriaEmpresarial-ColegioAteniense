from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from uuid import uuid4

from app.models.base import Base


class IdempotencyKey(Base):
    __tablename__ = "idempotency_keys"

    key = Column(String(36), primary_key=True, index=True, default=lambda: str(uuid4()))
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    order = relationship("Order", backref="idempotency_key")
