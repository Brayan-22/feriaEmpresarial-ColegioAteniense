from sqlalchemy import (
    Column,
    Integer,
    ForeignKey,
    String,
    Numeric,
    Boolean,
    DateTime,
    func,
)
from sqlalchemy.orm import relationship

from app.models.base import Base

class Product(Base):
    __tablename__ = "product"
    id = Column(Integer, primary_key=True, autoincrement=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("product_category.id"), nullable=False)
    name = Column(String(50), nullable=False)
    description = Column(String(500), nullable=False)
    price = Column(Numeric(precision=10, scale=2), nullable=False)
    stock = Column(Integer, nullable=False)
    image_url = Column(String(200))
    active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    # Relaciones orm
    company = relationship("Companies", back_populates="products")
    order_items = relationship("OrderItem", back_populates="product")
    category = relationship("ProductCategory", back_populates="products")