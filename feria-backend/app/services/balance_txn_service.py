from sqlalchemy.orm import Session
from uuid import UUID
from decimal import Decimal

from app.models.balance_txns import BalanceTxn
from app.models.enums import BalanceType


class BalanceTxnService:
    @staticmethod
    def create(
        db: Session,
        user_id: UUID,
        amount: Decimal,
        txn_type: BalanceType,
        order_id: int = None
    ) -> BalanceTxn:
        db_txn = BalanceTxn(
            user_id=user_id,
            order_id=order_id,
            amount=amount,
            type=txn_type
        )
        db.add(db_txn)
        db.commit()
        db.refresh(db_txn)
        return db_txn

    @staticmethod
    def get_by_user_id(db: Session, user_id: UUID, skip: int = 0, limit: int = 100):
        return db.query(BalanceTxn).filter(
            BalanceTxn.user_id == user_id
        ).offset(skip).limit(limit).all()

    @staticmethod
    def get_by_order_id(db: Session, order_id: int):
        return db.query(BalanceTxn).filter(BalanceTxn.order_id == order_id).all()
