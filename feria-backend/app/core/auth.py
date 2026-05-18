from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer
from uuid import UUID

from app.core.security import TokenManager
from app.services.user_service import UserService
from app.db.database import get_session
from sqlalchemy.orm import Session

security = HTTPBearer()


def get_idempotency_key(request: Request) -> str:
    """Extrae el header Idempotency-Key de la request"""
    return request.headers.get("Idempotency-Key")


async def get_current_user(
    credentials = Depends(security),
    db: Session = Depends(get_session)
):
    token = credentials.credentials
    payload = TokenManager.verify_token(token)

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type"
        )

    user_id = UUID(payload.get("sub"))
    user = UserService.get_by_id(db, user_id)

    return user


async def get_current_admin(current_user = Depends(get_current_user)):
    if current_user.role.name != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


async def get_current_company(current_user = Depends(get_current_user)):
    if current_user.role.name not in ["admin", "company"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Company access required"
        )
    return current_user
