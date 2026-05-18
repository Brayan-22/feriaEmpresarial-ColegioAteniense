from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, status
from uuid import UUID

from app.db.database import get_session
from app.schemas.order import OrderCreate, OrderUpdate, OrderResponse, OrderDetailResponse, OrderPreviewResponse
from app.services.order_service import OrderService
from app.core.auth import get_current_user, get_current_company, get_idempotency_key

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("/preview", response_model=OrderPreviewResponse)
def preview_order(order: OrderCreate, db: Session = Depends(get_session)):
    result = OrderService.preview(db, order)
    return {"items": result["items"], "total": result["total"]}


@router.post("/confirm", response_model=OrderDetailResponse, status_code=status.HTTP_201_CREATED)
def confirm_order(
    order: OrderCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_session),
    idempotency_key: str = Depends(get_idempotency_key)
):
    return OrderService.create(db, order, current_user.id, idempotency_key)


@router.get("/my", response_model=list[OrderResponse])
def list_my_orders(current_user = Depends(get_current_user), skip: int = 0, limit: int = 100, db: Session = Depends(get_session)):
    return OrderService.get_by_buyer(db, current_user.id, skip, limit)


@router.get("/", response_model=list[OrderResponse])
def list_orders(skip: int = 0, limit: int = 100, db: Session = Depends(get_session)):
    return OrderService.get_all(db, skip, limit)


@router.get("/company", response_model=list[OrderResponse])
def list_company_orders(current_user = Depends(get_current_company), company_id: int = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_session)):
    if not company_id:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="company_id is required")
    return OrderService.get_by_company(db, company_id, skip, limit)


@router.get("/buyer/{buyer_id}", response_model=list[OrderResponse])
def list_buyer_orders(
    buyer_id: UUID,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_session)
):
    return OrderService.get_by_buyer(db, buyer_id, skip, limit)


@router.get("/{order_id}", response_model=OrderDetailResponse)
def get_order(order_id: int, db: Session = Depends(get_session)):
    return OrderService.get_by_id(db, order_id)


@router.put("/{order_id}", response_model=OrderResponse)
def update_order(order_id: int, order: OrderUpdate, db: Session = Depends(get_session)):
    return OrderService.update(db, order_id, order)


@router.delete("/{order_id}")
def delete_order(order_id: int, db: Session = Depends(get_session)):
    return OrderService.delete(db, order_id)
