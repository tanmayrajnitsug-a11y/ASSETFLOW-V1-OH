from datetime import date, datetime
from pydantic import BaseModel, ConfigDict, Field
from app.models.audit import AuditItemStatus


class AuditCycleCreate(BaseModel):
    department_id: int | None = None
    location: str | None = None
    start_date: date
    end_date: date
    # Optional because the router injects current_user.id
    created_by: int | None = None
    auditor_ids: list[int] = Field(default_factory=list)


class AuditItemVerify(BaseModel):
    # Optional because the router injects current_user.id
    verified_by: int | None = None
    verification_status: AuditItemStatus
    remarks: str | None = None
    verified_at: datetime | None = None


class AuditItemOut(BaseModel):
    id: int
    audit_cycle_id: int
    asset_id: int
    verified_by: int | None = None
    verification_status: AuditItemStatus | None = None
    remarks: str | None = None
    verified_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class AuditCycleOut(BaseModel):
    id: int
    department_id: int | None = None
    location: str | None = None
    start_date: date
    end_date: date
    created_by: int
    is_closed: bool
    created_at: datetime
    closed_at: datetime | None = None
    items: list[AuditItemOut] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)