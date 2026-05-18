from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from decimal import Decimal
from datetime import datetime


class BalanceCreate(BaseModel):
    amount: Decimal = Field(..., gt=0)


class BalanceUpdate(BaseModel):
    amount: Decimal = Field(..., gt=0)


class BalanceResponse(BaseModel):
    id: UUID
    user_id: UUID
    amount: Decimal
    updated_at: datetime

    model_config = {"from_attributes": True}
