from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.product_category import ProductCategory
from app.schemas.product_category import CategoryCreate


class ProductCategoryService:
    @staticmethod
    def get_all(db: Session) -> list[ProductCategory]:
        return db.query(ProductCategory).all()

    @staticmethod
    def get_by_id(db: Session, category_id: int) -> ProductCategory:
        category = db.query(ProductCategory).filter(ProductCategory.id == category_id).first()
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found"
            )
        return category

    @staticmethod
    def create(db: Session, data: CategoryCreate) -> ProductCategory:
        db_category = ProductCategory(name=data.name, description=data.description)
        db.add(db_category)
        db.commit()
        db.refresh(db_category)
        return db_category

    @staticmethod
    def delete(db: Session, category_id: int) -> dict:
        db_category = ProductCategoryService.get_by_id(db, category_id)
        db.delete(db_category)
        db.commit()
        return {"message": "Category deleted successfully"}
