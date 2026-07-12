from datetime import datetime
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from app.models.booking import Booking, BookingStatus
from app.models.asset import Asset
from app.schemas.booking import BookingCreate, BookingUpdate

def create_booking(db: Session, booking_in: BookingCreate) -> Booking:
    asset = db.query(Asset).filter(Asset.id == booking_in.asset_id).first()
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")
        
    if booking_in.start_date >= booking_in.end_date:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Start date must be before end date")

    # Overlap check
    # A booking overlaps if (new_start < existing_end) AND (new_end > existing_start)
    overlapping = db.query(Booking).filter(
        Booking.asset_id == booking_in.asset_id,
        Booking.status.in_([BookingStatus.PENDING, BookingStatus.APPROVED, BookingStatus.ACTIVE]),
        Booking.start_date < booking_in.end_date,
        Booking.end_date > booking_in.start_date
    ).first()
    
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
    db.commit()
    db.refresh(db_booking)
    return db_booking

def get_bookings(db: Session, skip: int = 0, limit: int = 100, asset_id: int = None, user_id: int = None, status_filter: BookingStatus = None) -> list[Booking]:
    query = db.query(Booking)
    if asset_id:
        query = query.filter(Booking.asset_id == asset_id)
    if user_id:
        query = query.filter(Booking.user_id == user_id)
    if status_filter:
        query = query.filter(Booking.status == status_filter)
        
    return query.offset(skip).limit(limit).all()

def update_booking_status(db: Session, booking_id: int, new_status: BookingStatus, approver_id: int = None) -> Booking:
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
        
    booking.status = new_status
    if approver_id and new_status == BookingStatus.APPROVED:
        booking.approved_by = approver_id
        
    db.commit()
    db.refresh(booking)
    return booking
