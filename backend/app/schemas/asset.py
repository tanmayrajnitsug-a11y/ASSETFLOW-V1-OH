# TODO: Asset schemas (AssetCreate, AssetUpdate, AssetOut)

from datetime import date, datetime

from pydantic import BaseModel

from app.models.asset import AssetStatus


class AssetCreate(BaseModel):
    name: str
    asset_tag: str | None = None
    description: str | None = None
    category_id: int
    department_id: int | None = None
    status: AssetStatus
    purchase_date: date | None = None
    purchase_cost: float | None = None
    warranty_expiry: date | None = None
    location: str | None = None


class AssetUpdate(BaseModel):
    name: str | None = None
    asset_tag: str | None = None
    description: str | None = None
    category_id: int | None = None
    department_id: int | None = None
    status: AssetStatus | None = None
    purchase_date: date | None = None
    purchase_cost: float | None = None
    warranty_expiry: date | None = None
    location: str | None = None


class AssetOut(BaseModel):
    id: int
    name: str
    asset_tag: str
    description: str | None = None
    category_id: int
    department_id: int | None = None
    status: AssetStatus
    purchase_date: date | None = None
    purchase_cost: float | None = None
    warranty_expiry: date | None = None
    location: str | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
