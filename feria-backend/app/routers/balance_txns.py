from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends

from app.db.database import get_session
from app.schemas.balance_txn import BalanceTxnResponse
from app.services.balance_txn_service import BalanceTxnService
from app.core.auth import get_current_user

router = APIRouter(prefix="/balance-transactions", tags=["balance-transactions"])


@router.get("/my", response_model=list[BalanceTxnResponse])
def get_my_transactions(current_user = Depends(get_current_user), skip: int = 0, limit: int = 100, db: Session = Depends(get_session)):
    return BalanceTxnService.get_by_user_id(db, current_user.id, skip, limit)


@router.get("/user/{user_id}", response_model=list[BalanceTxnResponse])
def get_user_transactions(user_id, skip: int = 0, limit: int = 100, db: Session = Depends(get_session)):
    return BalanceTxnService.get_by_user_id(db, user_id, skip, limit)


@router.get("/order/{order_id}", response_model=list[BalanceTxnResponse])
def get_order_transactions(order_id: int, db: Session = Depends(get_session)):
    return BalanceTxnService.get_by_order_id(db, order_id)
