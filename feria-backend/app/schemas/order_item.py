from pydantic import BaseModel, Field
from typing import Optional
from decimal import Decimal


class OrderItemCreate(BaseModel):
    order_id: int
    product_id: int
    quantity: int = Field(..., gt=0)
    unit_price: Decimal = Field(..., gt=0)


class OrderItemUpdate(BaseModel):
    quantity: Optional[int] = Field(None, gt=0)
    unit_price: Optional[Decimal] = Field(None, gt=0)


class OrderItemResponse(BaseModel):
    id: int
    order_id: int
    product_id: int
    quantity: int
    unit_price: Decimal

    model_config = {"from_attributes": True}
