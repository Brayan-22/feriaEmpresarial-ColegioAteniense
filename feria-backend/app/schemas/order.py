from datetime import datetime

from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from decimal import Decimal
from app.models.enums import OrderStatus


class OrderItemInput(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)


class OrderCreate(BaseModel):
    company_id: int
    items: List[OrderItemInput] = Field(..., min_length=1)
    total: Decimal = Field(..., gt=0)

    class Config:
        example = {
            "company_id": 1,
            "items": [
                {"product_id": 1, "quantity": 2},
                {"product_id": 2, "quantity": 1}
            ],
            "total": 159.97
        }


class OrderUpdate(BaseModel):
    status: Optional[OrderStatus] = None


class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: Decimal

    model_config = {"from_attributes": True}


class OrderResponse(BaseModel):
    id: int
    buyer_id: UUID
    company_id: int
    total: Decimal
    status: OrderStatus
    created_at: datetime
    model_config = {"from_attributes": True}


class OrderDetailResponse(OrderResponse):
    order_items: List[OrderItemResponse] = []

    model_config = {"from_attributes": True}


class OrderItemPreview(BaseModel):
    product_id: int
    quantity: int
    unit_price: Decimal


class OrderPreviewResponse(BaseModel):
    items: List[OrderItemPreview] = []
    total: Decimal
    message: str = "Order preview validated successfully"
