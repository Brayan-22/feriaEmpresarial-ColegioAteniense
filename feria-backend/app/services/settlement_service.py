from sqlalchemy.orm import Session
from sqlalchemy import func
from decimal import Decimal
from fastapi import HTTPException, status

from app.models.orders import Order
from app.models.company_balance import CompanyBalance
from app.models.enums import OrderStatus


class SettlementService:
    @staticmethod
    def calculate_company_earnings(db: Session, company_id: int) -> Decimal:
        """
        Calcula el monto total que una compañía debe recibir
        basado en órdenes completadas (COMPLETED status)
        """
        result = db.query(func.sum(Order.total)).filter(
            Order.company_id == company_id,
            Order.status == OrderStatus.COMPLETED
        ).scalar()

        return result or Decimal(0)

    @staticmethod
    def reconcile_company_balance(db: Session, company_id: int) -> CompanyBalance:
        """
        Reconcilia el balance de una compañía:
        - Calcula earnings desde órdenes completadas
        - Crea o actualiza el balance de la compañía

        Returns: CompanyBalance actualizado
        """
        try:
            earnings = SettlementService.calculate_company_earnings(db, company_id)

            # Obtener o crear CompanyBalance
            company_balance = db.query(CompanyBalance).filter(
                CompanyBalance.company_id == company_id
            ).first()

            if not company_balance:
                company_balance = CompanyBalance(
                    company_id=company_id,
                    amount=earnings
                )
                db.add(company_balance)
            else:
                # Actualizar al monto calculado
                company_balance.amount = earnings
                db.add(company_balance)

            db.commit()
            db.refresh(company_balance)
            return company_balance

        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Settlement failed: {str(e)}"
            )

    @staticmethod
    def reconcile_all_companies(db: Session) -> dict:
        """
        Reconcilia balances de TODAS las compañías.
        Útil para ejecutar como job nocturno o periódico.

        Returns: {
            "total_companies": int,
            "total_earnings": Decimal,
            "companies": [{company_id, earnings}, ...]
        }
        """
        from app.models.companies import Companies

        try:
            companies = db.query(Companies).all()
            results = []
            total_earnings = Decimal(0)

            for company in companies:
                earnings = SettlementService.calculate_company_earnings(db, company.id)

                company_balance = db.query(CompanyBalance).filter(
                    CompanyBalance.company_id == company.id
                ).first()

                if not company_balance:
                    company_balance = CompanyBalance(
                        company_id=company.id,
                        amount=earnings
                    )
                    db.add(company_balance)
                else:
                    company_balance.amount = earnings
                    db.add(company_balance)

                results.append({
                    "company_id": company.id,
                    "company_name": company.name,
                    "earnings": earnings
                })
                total_earnings += earnings

            db.commit()

            return {
                "total_companies": len(companies),
                "total_earnings": float(total_earnings),
                "companies": results
            }

        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Bulk settlement failed: {str(e)}"
            )

    @staticmethod
    def get_company_balance(db: Session, company_id: int) -> CompanyBalance:
        """Obtiene el balance actual de una compañía"""
        company_balance = db.query(CompanyBalance).filter(
            CompanyBalance.company_id == company_id
        ).first()

        if not company_balance:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No balance found for company {company_id}"
            )

        return company_balance
