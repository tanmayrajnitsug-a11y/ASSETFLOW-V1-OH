from datetime import datetime
from pydantic import BaseModel
from app.models.maintenance import MaintenanceStatus


class MaintenanceCreate(BaseModel):
    asset_id: int
    reported_by: int | None = None  # FIXED: Now optional for incoming requests
    issue_description: str
    priority: str
    photo_url: str | None = None
    status: MaintenanceStatus = MaintenanceStatus.PENDING


class MaintenanceUpdate(BaseModel):
    asset_id: int | None = None
    reported_by: int | None = None
    issue_description: str | None = None
    priority: str | None = None
    photo_url: str | None = None
    status: MaintenanceStatus | None = None
    approved_by: int | None = None
    technician_id: int | None = None
    decision_notes: str | None = None
    resolution_notes: str | None = None
    resolved_at: datetime | None = None


class MaintenanceOut(BaseModel):
    id: int
    asset_id: int
    reported_by: int
    issue_description: str
    priority: str
    photo_url: str | None = None
    status: MaintenanceStatus
    approved_by: int | None = None
    technician_id: int | None = None
    decision_notes: str | None = None
    resolution_notes: str | None = None
    created_at: datetime
    updated_at: datetime
    resolved_at: datetime | None = None

    class Config:
        from_attributes = True