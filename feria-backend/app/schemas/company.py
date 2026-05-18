from pydantic import BaseModel, Field
from typing import Optional, List
from decimal import Decimal
from app.schemas.product import ProductResponse
from app.schemas.order import OrderResponse
from app.schemas.product_category import CategoryResponse

class CompanyCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    description: str = Field(..., min_length=1, max_length=500)
    logo_url: str


class CompanyUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    description: Optional[str] = Field(None, min_length=1, max_length=500)
    logo_url: Optional[str] = None
    active: Optional[bool] = None


class CompanyResponse(BaseModel):
    id: int
    name: str
    description: str
    logo_url: str
    active: bool
    product_count: int = 0
    min_price: Optional[Decimal] = None
    categories: list["CategoryResponse"] = []

    model_config = {"from_attributes": True}


class CompanyDetailResponse(CompanyResponse):
    products: List["ProductResponse"] = []
    orders: List["OrderResponse"] = []

    model_config = {"from_attributes": True}

class SearchCompanyRequest(BaseModel):
    company: Optional[str] = None
    product: Optional[str] = None
    category: Optional[str] = None
    sort_by: Optional[str] = None
    in_stock: Optional[bool] = False



CompanyDetailResponse.model_rebuild()
CompanyResponse.model_rebuild()
