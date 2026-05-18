from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends
from uuid import UUID

from app.db.database import get_session
from app.schemas.balance import BalanceCreate, BalanceUpdate, BalanceResponse
from app.services.balance_service import BalanceService
from app.core.auth import get_current_user

router = APIRouter(prefix="/balances", tags=["balances"])


@router.get("/me", response_model=BalanceResponse)
def get_my_balance(current_user = Depends(get_current_user), db: Session = Depends(get_session)):
    return BalanceService.get_by_user_id(db, current_user.id)


@router.post("/", response_model=BalanceResponse)
def create_balance(balance: BalanceCreate, user_id: UUID, db: Session = Depends(get_session)):
    return BalanceService.create(db, balance, user_id)


@router.get("/", response_model=list[BalanceResponse])
def get_balances(skip: int = 0, limit: int = 100, db: Session = Depends(get_session)):
    return BalanceService.get_all(db, skip, limit)


@router.get("/{balance_id}", response_model=BalanceResponse)
def get_balance(balance_id: UUID, db: Session = Depends(get_session)):
    return BalanceService.get_by_id(db, balance_id)


@router.get("/user/{user_id}", response_model=BalanceResponse)
def get_balance_by_user(user_id: UUID, db: Session = Depends(get_session)):
    return BalanceService.get_by_user_id(db, user_id)


@router.put("/{balance_id}", response_model=BalanceResponse)
def update_balance(balance_id: UUID, balance: BalanceUpdate, db: Session = Depends(get_session)):
    return BalanceService.update(db, balance_id, balance)
