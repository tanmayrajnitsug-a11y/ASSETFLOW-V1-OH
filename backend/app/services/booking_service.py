from datetime import datetime
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import or_, and_, select

from app.models.booking import Booking, BookingStatus
from app.models.asset import Asset
from app.schemas.booking import BookingCreate, BookingUpdate

async def create_booking(db: AsyncSession, booking_in: BookingCreate) -> Booking:
    result = await db.execute(select(Asset).filter(Asset.id == booking_in.asset_id))
    asset = result.scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")
        
    if booking_in.start_date >= booking_in.end_date:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Start date must be before end date")

    # Overlap check
    # A booking overlaps if (new_start < existing_end) AND (new_end > existing_start)
    stmt = select(Booking).filter(
        Booking.asset_id == booking_in.asset_id,
        Booking.status.in_([BookingStatus.PENDING, BookingStatus.APPROVED, BookingStatus.ACTIVE]),
        Booking.start_date < booking_in.end_date,
        Booking.end_date > booking_in.start_date
    )
    result = await db.execute(stmt)
    overlapping = result.scalars().first()
    
    if overlapping:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="The requested asset is already booked for this time period"
        )

    db_booking = Booking(
        asset_id=booking_in.asset_id,
        user_id=booking_in.user_id,
        status=BookingStatus.PENDING, # Default to pending
        start_date=booking_in.start_date,
        end_date=booking_in.end_date,
        purpose=booking_in.purpose
    )
    db.add(db_booking)
    await db.commit()
    await db.refresh(db_booking)
    return db_booking

async def get_bookings(db: AsyncSession, skip: int = 0, limit: int = 100, asset_id: int = None, user_id: int = None, status_filter: BookingStatus = None) -> list[Booking]:
    stmt = select(Booking)
    if asset_id:
        stmt = stmt.filter(Booking.asset_id == asset_id)
    if user_id:
        stmt = stmt.filter(Booking.user_id == user_id)
    if status_filter:
        stmt = stmt.filter(Booking.status == status_filter)
        
    stmt = stmt.offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()

async def update_booking_status(db: AsyncSession, booking_id: int, new_status: BookingStatus, approver_id: int = None) -> Booking:
    result = await db.execute(select(Booking).filter(Booking.id == booking_id))
    booking = result.scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
        
    booking.status = new_status
    if approver_id and new_status == BookingStatus.APPROVED:
        booking.approved_by = approver_id
        
    await db.commit()
    await db.refresh(booking)
    return booking
