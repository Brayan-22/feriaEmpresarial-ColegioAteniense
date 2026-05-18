from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, status

from app.db.database import get_session
from app.schemas.company import CompanyCreate, CompanyUpdate, CompanyResponse, CompanyDetailResponse
from app.schemas.product_category import CategoryResponse
from app.services.company_service import CompanyService
from app.core.auth import get_current_company, get_current_admin
from app.models.product_category import ProductCategory
from app.models.product import Product

router = APIRouter(prefix="/companies", tags=["companies"])


@router.post("/", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED)
def create_company(company: CompanyCreate, current_user = Depends(get_current_company), db: Session = Depends(get_session)):
    return CompanyService.create(db, company)


@router.get("/", response_model=list[CompanyResponse])
def list_companies(skip: int = 0, limit: int = 100, db: Session = Depends(get_session)):
    return CompanyService.get_all(db, skip, limit)


@router.get("/{company_id}", response_model=CompanyDetailResponse)
def get_company(company_id: int, db: Session = Depends(get_session)):
    return CompanyService.get_by_id(db, company_id)


@router.put("/{company_id}")
def update_company(company_id: int, company: CompanyUpdate, current_user = Depends(get_current_company), db: Session = Depends(get_session)):
    return CompanyService.update(db, company_id, company)


@router.delete("/{company_id}")
def delete_company(company_id: int, current_user = Depends(get_current_admin), db: Session = Depends(get_session)):
    return CompanyService.delete(db, company_id)


@router.get("/{company_id}/categories", response_model=list[CategoryResponse])
def get_company_categories(company_id: int, db: Session = Depends(get_session)):
    return (
        db.query(ProductCategory)
        .join(Product, Product.category_id == ProductCategory.id)
        .filter(Product.company_id == company_id, Product.active == True)
        .distinct()
        .all()
    )
