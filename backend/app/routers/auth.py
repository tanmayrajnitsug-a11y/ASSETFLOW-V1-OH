from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.user import SignupRequest, LoginRequest, TokenResponse, UserOut
from app.services.auth_service import signup, login
from app.security import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/auth", tags=["Auth"])

@router.post("/signup", response_model=UserOut, status_code=201)
async def signup_endpoint(payload: SignupRequest, db: AsyncSession = Depends(get_db)):
    return await signup(payload, db)

@router.post("/login", response_model=TokenResponse)
async def login_endpoint(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    return await login(payload, db)

@router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)):
    return current_user
