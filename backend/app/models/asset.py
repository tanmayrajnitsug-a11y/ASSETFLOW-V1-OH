# TODO: Asset model – statuses: Available, Allocated, Reserved, Under Maintenance, Lost, Retired, Disposed

import enum
from datetime import date, datetime

from sqlalchemy import Date, DateTime, Enum, Float, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class AssetStatus(str, enum.Enum):
    AVAILABLE = "available"
    ALLOCATED = "allocated"
    UNDER_MAINTENANCE = "under_maintenance"
    RETIRED = "retired"
    DISPOSED = "disposed"


class Asset(Base):
    __tablename__ = "assets"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    name: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    asset_tag: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    category_id: Mapped[int] = mapped_column(
        ForeignKey("categories.id"),
        nullable=False,
    )

    department_id: Mapped[int | None] = mapped_column(
        ForeignKey("departments.id"),
        nullable=True,
    )

    status: Mapped[AssetStatus] = mapped_column(
        Enum(AssetStatus),
        nullable=False,
    )

    purchase_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    purchase_cost: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    warranty_expiry: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    location: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )