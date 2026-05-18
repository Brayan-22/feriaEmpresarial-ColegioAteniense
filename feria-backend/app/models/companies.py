from sqlalchemy import Integer, Column, String, Boolean, Enum as SQLEnum
from sqlalchemy.orm import relationship

from app.models.base import Base


class Companies(Base):
    __tablename__ = "companies"
    # Columnas de tabla
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(50), nullable=False)
    description = Column(String(500), nullable=False)
    logo_url = Column(String(500), nullable=False)
    active = Column(Boolean, nullable=False, default=True)
    # Relaciones con otras tablas
    products = relationship("Product", back_populates="company")
    orders = relationship("Order", back_populates="company")