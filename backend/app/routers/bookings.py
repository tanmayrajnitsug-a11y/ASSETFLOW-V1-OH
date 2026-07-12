from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.security import get_current_user
from app.models.user import User
from app.models.booking import BookingStatus
from app.schemas.booking import BookingCreate, BookingUpdate, BookingOut
from app.services import booking_service

router = APIRouter(prefix="/bookings", tags=["Bookings"])

@router.post("/", response_model=BookingOut, status_code=status.HTTP_201_CREATED)
async def create_booking(
    booking_in: BookingCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Enforce current user as the requester
    booking_in.user_id = current_user.id
    return await booking_service.create_booking(db=db, booking_in=booking_in)

@router.get("/", response_model=list[BookingOut])
async def read_bookings(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1),
    asset_id: int = None,
    user_id: int = None,
    status_filter: BookingStatus = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await booking_service.get_bookings(
        db=db, skip=skip, limit=limit, asset_id=asset_id, user_id=user_id, status_filter=status_filter
    )

@router.patch("/{booking_id}/status", response_model=BookingOut)
async def update_status(
    booking_id: int,
    new_status: BookingStatus = Query(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await booking_service.update_booking_status(
        db=db, booking_id=booking_id, new_status=new_status, approver_id=current_user.id
    )
