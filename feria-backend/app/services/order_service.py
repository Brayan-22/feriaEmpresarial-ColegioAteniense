from sqlalchemy.orm import Session
from sqlalchemy import select
from fastapi import HTTPException, status
from uuid import UUID
from decimal import Decimal

from app.models.orders import Order
from app.models.order_items import OrderItem
from app.models.product import Product
from app.models.balance_txns import BalanceTxn
from app.models.balances import Balances
from app.models.idempotency_key import IdempotencyKey
from app.models.enums import BalanceType, OrderStatus
from app.schemas.order import OrderCreate, OrderUpdate, OrderItemResponse


class OrderService:
    @staticmethod
    def preview(db: Session, order: OrderCreate) -> dict:
        """Valida una orden sin escribir en la BD"""
        product_ids = [item.product_id for item in order.items]
        products = db.query(Product).filter(Product.id.in_(product_ids)).all()
        products_map = {p.id: p for p in products}

        total_calculado = Decimal(0)
        items_data = []

        for item in order.items:
            product = products_map.get(item.product_id)
            if not product:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Product {item.product_id} not found"
                )

            if not product.active:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Product {item.product_id} is not active"
                )

            if product.stock < item.quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient stock for product {item.product_id}. Available: {product.stock}, Requested: {item.quantity}"
                )

            unit_price = product.price
            items_data.append({
                "product_id": item.product_id,
                "quantity": item.quantity,
                "unit_price": unit_price
            })
            total_calculado += unit_price * item.quantity

        if abs(total_calculado - order.total) > Decimal("0.01"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Total mismatch. Expected: {total_calculado}, got: {order.total}"
            )

        return {
            "items": items_data,
            "total": total_calculado
        }

    @staticmethod
    def create(db: Session, order: OrderCreate, buyer_id: UUID, idempotency_key: str = None) -> Order:
        """
        Crea una orden con sus items de forma atómica con locks pesimistas.

        Idempotencia:
        - Si idempotency_key ya existe en BD, retorna la orden anterior
        - Evita duplicados si cliente oprime comprar 2 veces accidentalmente

        Proceso:
        1. Verifica idempotency key (retorna orden anterior si existe)
        2. Valida productos, stock, total
        3. Obtiene locks pesimistas en productos y balance del usuario
        4. Re-valida datos bajo lock
        5. Decrementa stock
        6. Decrementa saldo del usuario
        7. Crea orden, items y transacción de balance
        8. Guarda idempotency key → order_id
        9. Cambia estado de orden a COMPLETED
        Todo en una transacción atómica
        """
        try:
            # PASO 0: Verificar idempotency key (fail fast)
            if idempotency_key:
                existing_idempotency = db.query(IdempotencyKey).filter(
                    IdempotencyKey.key == idempotency_key
                ).first()

                if existing_idempotency:
                    # Key ya fue procesada, retornar orden antigua
                    existing_order = db.query(Order).filter(
                        Order.id == existing_idempotency.order_id
                    ).first()
                    return existing_order
            product_ids = [item.product_id for item in order.items]

            # PASO 1: Validación previa sin locks
            products = db.query(Product).filter(Product.id.in_(product_ids)).all()
            products_map = {p.id: p for p in products}

            total_calculado = Decimal(0)
            items_data = []

            for item in order.items:
                product = products_map.get(item.product_id)
                if not product:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Product {item.product_id} not found"
                    )

                if not product.active:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Product {item.product_id} is not active"
                    )

                unit_price = product.price
                items_data.append({
                    "product_id": item.product_id,
                    "quantity": item.quantity,
                    "unit_price": unit_price
                })
                total_calculado += unit_price * item.quantity

            if abs(total_calculado - order.total) > Decimal("0.01"):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Total mismatch. Expected: {total_calculado}, got: {order.total}"
                )

            # PASO 2: Obtener balance del usuario con lock pesimista (FOR UPDATE)
            user_balance = db.query(Balances).filter(
                Balances.user_id == buyer_id
            ).with_for_update().first()

            if not user_balance:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="User must have a balance account to make purchases"
                )

            # PASO 3: Obtener productos con lock pesimista (FOR UPDATE)
            locked_products = db.query(Product).filter(
                Product.id.in_(product_ids)
            ).with_for_update().all()

            locked_products_map = {p.id: p for p in locked_products}

            # PASO 4: Re-validar stock bajo lock (evita race conditions)
            for item in order.items:
                product = locked_products_map.get(item.product_id)
                if not product:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Product {item.product_id} no longer available"
                    )

                if product.stock < item.quantity:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Insufficient stock for product {item.product_id}. Available: {product.stock}, Requested: {item.quantity}"
                    )

            # PASO 5: Crear orden
            db_order = Order(
                buyer_id=buyer_id,
                company_id=order.company_id,
                total=total_calculado,
                status=OrderStatus.PENDING
            )
            db.add(db_order)
            db.flush()

            # PASO 6: Crear items y decrementar stock
            for item_data in items_data:
                db_item = OrderItem(
                    order_id=db_order.id,
                    product_id=item_data["product_id"],
                    quantity=item_data["quantity"],
                    unit_price=item_data["unit_price"]
                )
                db.add(db_item)

                # Decrementar stock bajo lock
                product = locked_products_map[item_data["product_id"]]
                product.stock -= item_data["quantity"]
                db.add(product)

            # PASO 7: Decrementar saldo del usuario
            user_balance.amount -= total_calculado
            if user_balance.amount < 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient balance. Required: {total_calculado}, Available: {user_balance.amount + total_calculado}"
                )
            db.add(user_balance)

            # PASO 8: Crear transacción de balance
            db_txn = BalanceTxn(
                user_id=buyer_id,
                order_id=db_order.id,
                amount=total_calculado,
                type=BalanceType.PERSONAL
            )
            db.add(db_txn)

            # PASO 9: Cambiar estado de orden a COMPLETED
            db_order.status = OrderStatus.COMPLETED
            db.add(db_order)

            # PASO 10: Guardar idempotency key si fue proporcionado
            if idempotency_key:
                db_idempotency = IdempotencyKey(
                    key=idempotency_key,
                    order_id=db_order.id
                )
                db.add(db_idempotency)

            # Commit transactional
            db.commit()
            db.refresh(db_order)
            return db_order

        except HTTPException:
            db.rollback()
            raise
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Order transaction failed: {str(e)}"
            )

    @staticmethod
    def get_by_id(db: Session, order_id: int) -> Order:
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )
        return order

    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100):
        return db.query(Order).offset(skip).limit(limit).all()

    @staticmethod
    def get_by_buyer(db: Session, buyer_id: UUID, skip: int = 0, limit: int = 100):
        return db.query(Order).filter(
            Order.buyer_id == buyer_id
        ).offset(skip).limit(limit).all()

    @staticmethod
    def get_by_company(db: Session, company_id: int, skip: int = 0, limit: int = 100):
        return db.query(Order).filter(
            Order.company_id == company_id
        ).offset(skip).limit(limit).all()

    @staticmethod
    def update(db: Session, order_id: int, order: OrderUpdate) -> Order:
        db_order = OrderService.get_by_id(db, order_id)

        update_data = order.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_order, field, value)

        db.add(db_order)
        db.commit()
        db.refresh(db_order)
        return db_order

    @staticmethod
    def delete(db: Session, order_id: int) -> dict:
        db_order = OrderService.get_by_id(db, order_id)

        # Eliminar items primero
        db.query(OrderItem).filter(OrderItem.order_id == order_id).delete()

        # Luego la orden
        db.delete(db_order)
        db.commit()
        return {"message": "Order deleted successfully"}
