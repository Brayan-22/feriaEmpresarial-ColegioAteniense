from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer

from app.db.database import get_session
from app.schemas.user import UserCreate, UserLogin, LoginResponse, TokenResponse
from app.services.user_service import UserService
from app.core.security import TokenManager
from app.core.auth import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])
security = HTTPBearer()

@router.post("/register", response_model=LoginResponse)
def register(user: UserCreate, db: Session = Depends(get_session)):
    # Crear usuario con role="user" siempre
    db_user = UserService.create(db, user)

    # El rol se asigna automáticamente en UserService.create()
    # No necesitamos hacer nada adicional aquí

    # CAMBIAR: acceder a role.name en lugar de role.value
    access_token = TokenManager.create_access_token(
        db_user.id, db_user.email, db_user.role.name
    )
    refresh_token = TokenManager.create_refresh_token(db_user.id)
    return {
        "user": db_user,
        "access_token": access_token,
        "refresh_token": refresh_token,
    }


@router.post("/login", response_model=LoginResponse)
def login(credentials: UserLogin, db: Session = Depends(get_session)):
    result = UserService.login(db, credentials)
    return {
        "user": result["user"],
        "access_token": result["access_token"],
        "refresh_token": result["refresh_token"]
    }


@router.post("/refresh", response_model=TokenResponse)
def refresh(current_user = Depends(get_current_user)):
    access_token = TokenManager.create_access_token(current_user.id, current_user.email, current_user.role.name)
    return {
        "access_token": access_token,
        "refresh_token": "",
        "token_type": "bearer"
    }


@router.post("/logout")
def logout(credentials = Depends(security)):
    token = credentials.credentials
    TokenManager.invalidate_token(token)
    return {"message": "Logout successful"}
