from datetime import datetime
from pydantic import BaseModel

from app.models.allocation import AllocationStatus
from app.models.transfer import TransferStatus


class AllocationCreate(BaseModel):
    asset_id: int
    user_id: int
    allocated_by: int | None = None  # FIXED: Now optional for incoming requests
    status: AllocationStatus
    returned_at: datetime | None = None
    notes: str | None = None


class AllocationUpdate(BaseModel):
    asset_id: int | None = None
    user_id: int | None = None
    allocated_by: int | None = None
    status: AllocationStatus | None = None
    returned_at: datetime | None = None
    notes: str | None = None


class AllocationOut(BaseModel):
    id: int
    asset_id: int
    user_id: int
    allocated_by: int
    status: AllocationStatus
    allocated_at: datetime
    returned_at: datetime | None = None
    notes: str | None = None

    class Config:
        from_attributes = True


class TransferCreate(BaseModel):
    asset_id: int
    from_user_id: int | None = None
    to_user_id: int
    from_department_id: int | None = None
    to_department_id: int | None = None
    status: TransferStatus
    requested_by: int | None = None  # FIXED: Now optional for incoming requests
    approved_by: int | None = None
    completed_at: datetime | None = None
    reason: str | None = None


class TransferUpdate(BaseModel):
    asset_id: int | None = None
    from_user_id: int | None = None
    to_user_id: int | None = None
    from_department_id: int | None = None
    to_department_id: int | None = None
    status: TransferStatus | None = None
    requested_by: int | None = None
    approved_by: int | None = None
    completed_at: datetime | None = None
    reason: str | None = None


class TransferOut(BaseModel):
    id: int
    asset_id: int
    from_user_id: int | None = None
    to_user_id: int
    from_department_id: int | None = None
    to_department_id: int | None = None
    status: TransferStatus
    requested_by: int
    approved_by: int | None = None
    requested_at: datetime
    completed_at: datetime | None = None
    reason: str | None = None

    class Config:
        from_attributes = True