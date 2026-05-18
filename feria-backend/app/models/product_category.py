from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from app.models.base import Base

class ProductCategory(Base):
    __tablename__ = "product_category"
    # Columnas tabla
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    description = Column(String(500), nullable=False)
    # Relaciones
    products = relationship("Product", back_populates="category")
