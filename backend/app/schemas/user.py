from datetime import datetime
from pydantic import BaseModel, EmailStr
from app.models.user import UserRole

class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    employee_id: str | None = None
    phone: str | None = None
    role: UserRole
    department_id: int | None = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class UserUpdate(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    employee_id: str | None = None
    phone: str | None = None
    department_id: int | None = None
    is_active: bool | None = None

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    department_id: int | None = None
    role: UserRole = UserRole.EMPLOYEE

class RoleAssignment(BaseModel):
    role: UserRole
