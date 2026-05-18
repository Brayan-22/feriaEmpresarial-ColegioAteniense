from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends
from uuid import UUID

from app.db.database import get_session
from app.schemas.user import UserCreate, UserResponse, UserLogin, UserUpdate, UserDetailResponse
from app.services.user_service import UserService
from app.core.auth import get_current_user
from app.core.auth import get_current_admin
router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserDetailResponse)
def get_profile(current_user = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserResponse)
def update_profile(user: UserUpdate, current_user = Depends(get_current_user), db: Session = Depends(get_session)):
    return UserService.update(db, current_user.id, user)


@router.get("/", response_model=list[UserResponse])
def get_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_session)):
    return UserService.get_all(db, skip, limit)


@router.get("/{user_id}", response_model=UserDetailResponse)
def get_user(user_id: UUID, db: Session = Depends(get_session)):
    return UserService.get_by_id(db, user_id)


@router.put("/{user_id}", response_model=UserResponse)
def update_user(user_id: UUID, user: UserUpdate, db: Session = Depends(get_session)):
    return UserService.update(db, user_id, user)


@router.delete("/{user_id}")
def delete_user(user_id: UUID, current_user = Depends(get_current_admin) ,db: Session = Depends(get_session)):
    return UserService.delete(db, user_id)
