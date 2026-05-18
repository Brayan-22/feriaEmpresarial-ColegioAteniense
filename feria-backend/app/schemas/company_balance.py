from pydantic import BaseModel
from decimal import Decimal
from datetime import datetime


class CompanyBalanceResponse(BaseModel):
    id: int
    company_id: int
    amount: Decimal
    updated_at: datetime

    model_config = {"from_attributes": True}


class SettlementResultItem(BaseModel):
    company_id: int
    company_name: str
    earnings: Decimal


class SettlementResult(BaseModel):
    total_companies: int
    total_earnings: Decimal
    companies: list[SettlementResultItem]
