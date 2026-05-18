from sqlalchemy import func
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate


class ProductService:
    @staticmethod
    def create(db: Session, product: ProductCreate) -> Product:
        db_product = Product(**product.dict())
        db.add(db_product)
        db.commit()
        db.refresh(db_product)
        return db_product

    @staticmethod
    def get_by_id(db: Session, product_id: int) -> Product:
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )
        return product

    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100):
        return db.query(Product).offset(skip).limit(limit).all()

    @staticmethod
    def get_by_company(db: Session, company_id: int,is_active,  skip: int = 0, limit: int = 100):
        if not is_active:
            return db.query(Product).filter(Product.company_id == company_id).all()
        else:
            return db.query(Product).filter(
                Product.company_id == company_id,
                Product.active == is_active,
            ).offset(skip).limit(limit).all()

    @staticmethod
    def update(db: Session, product_id: int, product: ProductUpdate) -> Product:
        db_product = ProductService.get_by_id(db, product_id)

        update_data = product.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_product, field, value)

        db.add(db_product)
        db.commit()
        db.refresh(db_product)
        return db_product

    @staticmethod
    def delete(db: Session, product_id: int) -> dict:
        db_product = ProductService.get_by_id(db, product_id)
        db.delete(db_product)
        db.commit()
        return {"message": "Product deleted successfully"}

    @staticmethod
    def get_count(db: Session) -> int:
        return db.query(func.count(Product.id)).scalar()

