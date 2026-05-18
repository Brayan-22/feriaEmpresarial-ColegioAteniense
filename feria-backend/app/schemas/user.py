from datetime import datetime
from typing import Optional, List
from uuid import UUID
from app.schemas.balance import BalanceResponse
from app.schemas.order import OrderResponse

from pydantic import BaseModel, EmailStr, Field

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters")
    full_name: Optional[str] = Field(None, max_length=100)



class UserCreateWithRole(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters")
    full_name: Optional[str] = Field(None, max_length=100)
    role_id : int = Field(default=3) # role user por defecto


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=8)
    full_name: Optional[str] = Field(None, max_length=100)
    role_id: Optional[int] = None



class UserRoleResponse(BaseModel):
    id : int
    name : str
    description : str

class UserResponse(BaseModel):
    id: UUID
    email: Optional[str]
    full_name: Optional[str]
    is_active: bool
    role: UserRoleResponse
    created_at: datetime

    model_config = {"from_attributes": True}


class UserDetailResponse(UserResponse):
    balance: Optional["BalanceResponse"] = None
    orders: List["OrderResponse"] = []

    model_config = {"from_attributes": True}


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class LoginResponse(BaseModel):
    user: UserResponse
    access_token: str
    refresh_token: str
    token_type: str = "bearer"




UserDetailResponse.model_rebuild()
