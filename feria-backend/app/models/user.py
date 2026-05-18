from sqlalchemy.orm import relationship
from uuid6 import uuid6
from sqlalchemy import Enum as SQLEnum, Integer, ForeignKey, Boolean
from sqlalchemy import Column, String, DateTime, func, event
from sqlalchemy.dialects.postgresql import UUID

from app.models.base import Base
from app.core.security import PasswordHasher
from app.models.enums import UserRole


class User(Base):
    __tablename__ = "feria_user"
    # Columnas en la tabla
    id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid6)
    email = Column(String(255), unique=True, index=True, nullable=True)
    password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    role_id = Column(Integer, ForeignKey("user_role.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    # Relaciones con otras tablas
    balance = relationship("Balances", back_populates="user", uselist=False)
    orders = relationship("Order", back_populates="buyer")
    balance_txns = relationship("BalanceTxn", back_populates="user")
    role = relationship("UserRole", back_populates="users")

@event.listens_for(User, "before_insert")
def hash_password_on_insert(mapper, connection, target):
    if target.password and not target.password.startswith("$2b$"):
        target.password = PasswordHasher.hash_password(target.password)


@event.listens_for(User, "before_update")
def hash_password_on_update(mapper, connection, target):
    if target.password and not target.password.startswith("$2b$"):
        target.password = PasswordHasher.hash_password(target.password)