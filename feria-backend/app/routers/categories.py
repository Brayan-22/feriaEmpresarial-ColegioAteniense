from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, status

from app.db.database import get_session
from app.schemas.product_category import CategoryCreate, CategoryResponse
from app.services.product_category_service import ProductCategoryService
from app.core.auth import get_current_admin

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("/", response_model=list[CategoryResponse])
def list_categories(db: Session = Depends(get_session)):
    return ProductCategoryService.get_all(db)


@router.post("/", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(data: CategoryCreate, current_user = Depends(get_current_admin), db: Session = Depends(get_session)):
    return ProductCategoryService.create(db, data)


@router.delete("/{category_id}")
def delete_category(category_id: int, current_user = Depends(get_current_admin), db: Session = Depends(get_session)):
    return ProductCategoryService.delete(db, category_id)
