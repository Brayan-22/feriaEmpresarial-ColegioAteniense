from sqlalchemy.orm import Session
from uuid import UUID

from app.models import Balances
from app.models.user_role import UserRole
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserUpdate
from app.core.security import PasswordHasher, TokenManager
from fastapi import HTTPException, status


class UserService:
    @staticmethod
    def create(db: Session, user: UserCreate) -> User:
        """
        Crea un nuevo usuario con balance inicial.

        1. Verifica que el email no exista
        2. Obtiene el rol "user" por defecto
        3. Crea el usuario
        4. Crea el balance inicial (200,000)
        """
        # Verificar email único
        existing_user = db.query(User).filter(User.email == user.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )

        # Obtener rol por defecto
        user_role = db.query(UserRole).filter(UserRole.name == "user").first()
        if not user_role:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Default user role not found",
            )

        # Crear usuario
        db_user = User(
            email=user.email,
            password=user.password,
            full_name=user.full_name,
            role_id=user_role.id,
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        db_basic_balance = Balances(
            user_id=db_user.id,
            amount=200_000,
        )
        db.add(db_basic_balance)
        db.commit()
        db.refresh(db_basic_balance)

        return db_user

    @staticmethod
    def get_by_id(db: Session, user_id: UUID) -> User:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )
        return user

    @staticmethod
    def get_by_email(db: Session, email: str) -> User:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
            )
        return user

    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100):
        return db.query(User).offset(skip).limit(limit).all()

    @staticmethod
    def authenticate(db: Session, credentials: UserLogin) -> User:
        user = UserService.get_by_email(db, credentials.email)

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
            )

        if not PasswordHasher.verify_password(credentials.password, user.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
            )

        return user

    @staticmethod
    def login(db: Session, credentials: UserLogin) -> dict:
        user = UserService.authenticate(db, credentials)
        access_token = TokenManager.create_access_token(
            user.id, user.email, user.role.name
        )
        refresh_token = TokenManager.create_refresh_token(user.id)
        return {
            "user": user,
            "access_token": access_token,
            "refresh_token": refresh_token,
        }

    @staticmethod
    def update(db: Session, user_id: UUID, user: UserUpdate) -> User:
        db_user = UserService.get_by_id(db, user_id)

        # Verificar email único si se está actualizando
        if user.email and user.email != db_user.email:
            existing = db.query(User).filter(User.email == user.email).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered",
                )

        # CAMBIO: model_dump() en lugar de dict()
        update_data = user.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_user, field, value)

        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

    @staticmethod
    def delete(db: Session, user_id: UUID) -> dict:
        db_user = UserService.get_by_id(db, user_id)
        db_user.is_active = False
        db_user.email = None
        db.add(db_user)
        db.commit()
        return {"message": "User deactivated successfully"}
