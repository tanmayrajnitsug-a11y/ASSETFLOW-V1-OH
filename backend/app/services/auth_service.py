from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models.user import User, UserRole
from app.schemas.user import SignupRequest, LoginRequest, TokenResponse
from app.security import hash_password, verify_password, create_access_token
from fastapi.security import OAuth2PasswordRequestForm

async def signup(payload: SignupRequest, db: AsyncSession) -> User:
    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        name=payload.name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=UserRole.EMPLOYEE,
    )
    db.add(user)
    await db.flush()
    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    from app.schemas.user import UserOut
    user_out = UserOut.model_validate(user)
    return TokenResponse(access_token=token, user=user_out)

async def login(form_data: OAuth2PasswordRequestForm, db: AsyncSession) -> TokenResponse:
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account deactivated")

    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    from app.schemas.user import UserOut
    user_out = UserOut.model_validate(user)
    return TokenResponse(access_token=token, user=user_out)

async def seed_admin(db: AsyncSession, email: str, password: str):
    result = await db.execute(select(User).where(User.email == email))
    if result.scalar_one_or_none() is None:
        admin = User(
            name="System Admin",
            email=email,
            hashed_password=hash_password(password),
            role=UserRole.ADMIN,
        )
        db.add(admin)
        await db.flush()
