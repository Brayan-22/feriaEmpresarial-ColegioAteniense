from sqlalchemy import Column, Integer, Numeric, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship

from app.models.base import Base


class CompanyBalance(Base):
    __tablename__ = "company_balances"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    company_id = Column(Integer, ForeignKey("companies.id"), index=True, nullable=False, unique=True)
    amount = Column(Numeric(precision=15, scale=2), nullable=False, default=0)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    company = relationship("Companies", backref="balance")
