# TODO: Booking schemas (BookingCreate, BookingUpdate, BookingOut)


from datetime import datetime

from pydantic import BaseModel

from app.models.booking import BookingStatus


class BookingCreate(BaseModel):
    asset_id: int
    user_id: int
    status: BookingStatus
    start_date: datetime
    end_date: datetime
    approved_by: int | None = None
    purpose: str | None = None


class BookingUpdate(BaseModel):
    asset_id: int | None = None
    user_id: int | None = None
    status: BookingStatus | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None
    approved_by: int | None = None
    purpose: str | None = None


class BookingOut(BaseModel):
    id: int
    asset_id: int
    user_id: int
    status: BookingStatus
    start_date: datetime
    end_date: datetime
    approved_by: int | None = None
    purpose: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True