from uuid6 import uuid6
from sqlalchemy import Column, String, DateTime, func, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import Base


class Balances(Base):
    __tablename__ = "balances"

    id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid6)
    user_id = Column(UUID(as_uuid=True), ForeignKey("feria_user.id"), index=True, nullable=False, unique=True)
    amount = Column(Numeric(precision=10, scale=2), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User", back_populates="balance")
