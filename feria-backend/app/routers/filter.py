from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, status, Query

from app.db.database import get_session
from app.schemas import CompanyResponse
from app.schemas import SearchCompanyRequest
from app.services import CompanyService
router = APIRouter(prefix="/filter", tags=["filter"])

@router.post("/search/",response_model=list[CompanyResponse],  status_code=status.HTTP_201_CREATED)
def get_companies_by_filter(filter_request: SearchCompanyRequest,
                            skip : int = Query(0, ge=0),
                            limit : int = Query(100, ge=1, le=100),
                            db:Session = Depends(get_session)):
    return CompanyService.get_companies_by_filter(db, filter_request, skip, limit)