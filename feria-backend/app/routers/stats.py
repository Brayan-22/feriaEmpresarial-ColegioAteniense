from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, status
from app.db.database import get_session
from app.schemas.stats import StatsResponse
from app.services.company_service import CompanyService
from app.services.product_service import ProductService
router = APIRouter(prefix="/stats", tags=["stats"])

@router.get("/", response_model=StatsResponse, status_code=status.HTTP_200_OK)
def get_stats(db: Session = Depends(get_session)):
    companies_count = CompanyService.get_count(db)
    products_count = ProductService.get_count(db)
    return StatsResponse(
        companies_count=companies_count,
        products_count=products_count
    )