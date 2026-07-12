import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class MaintenanceStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    TECHNICIAN_ASSIGNED = "technician_assigned"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"


class MaintenanceRequest(Base):
    __tablename__ = "maintenance_requests"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    asset_id: Mapped[int] = mapped_column(
        ForeignKey("assets.id"),
        nullable=False,
    )

    reported_by: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
    )

    issue_description: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    priority: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    photo_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    status: Mapped[MaintenanceStatus] = mapped_column(
        Enum(MaintenanceStatus),
        nullable=False,
        default=MaintenanceStatus.PENDING,
    )

    approved_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"),
        nullable=True,
    )

    technician_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"),
        nullable=True,
    )

    decision_notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    resolution_notes: Mapped[str | None] = mapped_column(
        Text,
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

    resolved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    asset = relationship(
        "Asset",
        foreign_keys=[asset_id],
    )

    reporter = relationship(
        "User",
        foreign_keys=[reported_by],
    )

    approver = relationship(
        "User",
        foreign_keys=[approved_by],
    )

    technician = relationship(
        "User",
        foreign_keys=[technician_id],
    )