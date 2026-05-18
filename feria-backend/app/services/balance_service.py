from sqlalchemy.orm import Session
from uuid import UUID
from fastapi import HTTPException, status

from app.models.balances import Balances
from app.schemas.balance import BalanceCreate, BalanceUpdate


class BalanceService:
    @staticmethod
    def create(db: Session, balance: BalanceCreate, user_id: UUID) -> Balances:
        existing = db.query(Balances).filter(Balances.user_id == user_id).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User already has a balance"
            )

        db_balance = Balances(user_id=user_id, amount=balance.amount)
        db.add(db_balance)
        db.commit()
        db.refresh(db_balance)
        return db_balance

    @staticmethod
    def get_by_id(db: Session, balance_id: UUID) -> Balances:
        balance = db.query(Balances).filter(Balances.id == balance_id).first()
        if not balance:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Balance not found"
            )
        return balance

    @staticmethod
    def get_by_user_id(db: Session, user_id: UUID) -> Balances:
        balance = db.query(Balances).filter(Balances.user_id == user_id).first()
        if not balance:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Balance not found for this user"
            )
        return balance

    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100):
        return db.query(Balances).offset(skip).limit(limit).all()

    @staticmethod
    def update(db: Session, balance_id: UUID, balance: BalanceUpdate) -> Balances:
        db_balance = BalanceService.get_by_id(db, balance_id)

        update_data = balance.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_balance, field, value)

        db.add(db_balance)
        db.commit()
        db.refresh(db_balance)
        return db_balance
