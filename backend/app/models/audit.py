import enum
from datetime import date, datetime

from sqlalchemy import Boolean, Column, Date, DateTime, Enum, ForeignKey, String, Table, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


audit_cycle_auditors = Table(
    "audit_cycle_auditors",
    Base.metadata,
    Column(
        "audit_cycle_id",
        ForeignKey("audit_cycles.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "user_id",
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


class AuditItemStatus(str, enum.Enum):
    VERIFIED = "verified"
    MISSING = "missing"
    DAMAGED = "damaged"


class AuditCycle(Base):
    __tablename__ = "audit_cycles"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    department_id: Mapped[int | None] = mapped_column(
        ForeignKey("departments.id"),
        nullable=True,
    )

    location: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )

    start_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    end_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    created_by: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
    )

    is_closed: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    closed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    creator = relationship(
        "User",
        foreign_keys=[created_by],
        lazy="selectin",
    )

    auditors = relationship(
        "User",
        secondary=audit_cycle_auditors,
        lazy="selectin",
    )

    items = relationship(
        "AuditItem",
        back_populates="cycle",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class AuditItem(Base):
    __tablename__ = "audit_items"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    audit_cycle_id: Mapped[int] = mapped_column(
        ForeignKey("audit_cycles.id", ondelete="CASCADE"),
        nullable=False,
    )

    asset_id: Mapped[int] = mapped_column(
        ForeignKey("assets.id"),
        nullable=False,
    )

    verified_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"),
        nullable=True,
    )

    verification_status: Mapped[AuditItemStatus | None] = mapped_column(
        Enum(AuditItemStatus),
        nullable=True,
    )

    remarks: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    verified_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    cycle = relationship(
        "AuditCycle",
        back_populates="items",
        lazy="selectin",
    )

    asset = relationship(
        "Asset",
        foreign_keys=[asset_id],
        lazy="selectin",
    )

    verifier = relationship(
        "User",
        foreign_keys=[verified_by],
        lazy="selectin",
    )