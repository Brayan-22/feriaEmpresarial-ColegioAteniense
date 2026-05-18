from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from decimal import Decimal
from datetime import datetime

from app.models.enums import BalanceType


class BalanceTxnCreate(BaseModel):
    user_id: UUID
    amount: Decimal
    type: BalanceType
    order_id: Optional[int] = None


class BalanceTxnResponse(BaseModel):
    id: int
    user_id: UUID
    order_id: Optional[int]
    amount: Decimal
    type: BalanceType
    created_at: datetime

    model_config = {"from_attributes": True}
