from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, status, HTTPException
from uuid import UUID

from app.db.database import get_session
from app.schemas.user import UserResponse, UserCreateWithRole
from app.schemas.company import CompanyResponse
from app.schemas.balance import BalanceCreate, BalanceResponse
from app.schemas.company_balance import CompanyBalanceResponse, SettlementResult
from app.services.user_service import UserService
from app.services.company_service import CompanyService
from app.services.balance_service import BalanceService
from app.services.settlement_service import SettlementService
from app.core.auth import get_current_admin
from app.models.user_role import UserRole as UserRoleModel
from app.schemas.company import CompanyUpdate

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users", response_model=list[UserResponse])
def list_all_users(current_user = Depends(get_current_admin), skip: int = 0, limit: int = 100, db: Session = Depends(get_session)):
    return UserService.get_all(db, skip, limit)


@router.post("/users/create-company", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_company_user(
    user_data: UserCreateWithRole,
    current_user = Depends(get_current_admin),
    db: Session = Depends(get_session)
):
    """
    Crea un nuevo usuario con role='company' (solo admin).

    Solo se puede crear con role='company' o 'user'.
    Los admins adicionales se crean desde .env.
    """
    role = db.query(UserRoleModel).filter(UserRoleModel.id == user_data.role_id).first()
    if not role:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Role no encontrado")
    if role.name == "admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solo se pueden crear usuarios con role 'company' o 'user'. Los admins se crean desde .env"
        )

    db_user = UserService.create(db, user_data)
    db_user.role_id = user_data.role_id
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user


@router.get("/companies", response_model=list[CompanyResponse])
def list_all_companies(current_user = Depends(get_current_admin), skip: int = 0, limit: int = 100, db: Session = Depends(get_session)):
    return CompanyService.get_all(db, skip, limit)


@router.post("/balances/assign")
def assign_balance(user_id: UUID, amount: float, current_user = Depends(get_current_admin), db: Session = Depends(get_session)):
    balance_create = BalanceCreate(amount=amount)
    try:
        balance = BalanceService.get_by_user_id(db, user_id)
        return BalanceService.update(db, balance.id, balance_create)
    except:
        return BalanceService.create(db, balance_create, user_id)


@router.put("/companies/{company_id}/toggle")
def toggle_company_status(company_id: int, current_user = Depends(get_current_admin), db: Session = Depends(get_session)):
    company = CompanyService.get_by_id(db, company_id)
    update_data = CompanyUpdate(active=not company["active"])
    return CompanyService.update(db, company_id, update_data)


@router.get("/reports/sales")
def get_sales_report(current_user = Depends(get_current_admin), db: Session = Depends(get_session)):
    from app.models.orders import Order
    from sqlalchemy import func
    from decimal import Decimal

    result = db.query(
        func.count(Order.id).label("total_orders"),
        func.sum(Order.total).label("total_sales"),
        func.avg(Order.total).label("avg_order_value")
    ).first()

    return {
        "total_orders": result[0] or 0,
        "total_sales": float(result[1]) if result[1] else 0,
        "avg_order_value": float(result[2]) if result[2] else 0
    }


@router.post("/settlement/reconcile-all", response_model=SettlementResult)
def reconcile_all_settlements(current_user = Depends(get_current_admin), db: Session = Depends(get_session)):
    """
    Reconcilia balances de TODAS las compañías basado en órdenes completadas.
    Se puede ejecutar como job nocturno o manual.
    """
    return SettlementService.reconcile_all_companies(db)


@router.post("/settlement/reconcile/{company_id}", response_model=CompanyBalanceResponse)
def reconcile_company_settlement(company_id: int, current_user = Depends(get_current_admin), db: Session = Depends(get_session)):
    """
    Reconcilia balance de una compañía específica.
    Calcula earnings desde órdenes completadas y actualiza su balance.
    """
    return SettlementService.reconcile_company_balance(db, company_id)


@router.get("/settlement/balance/{company_id}", response_model=CompanyBalanceResponse)
def get_company_settlement_balance(company_id: int, current_user = Depends(get_current_admin), db: Session = Depends(get_session)):
    """
    Obtiene el balance actual de una compañía (lo que ha ganado en ventas).
    """
    return SettlementService.get_company_balance(db, company_id)
