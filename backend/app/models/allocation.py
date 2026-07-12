# TODO: Allocation model – asset→employee, expected return date, status (active/returned/overdue)


import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class AllocationStatus(str, enum.Enum):
    ACTIVE = "active"
    RETURNED = "returned"
    REVOKED = "revoked"


class Allocation(Base):
    __tablename__ = "allocations"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    asset_id: Mapped[int] = mapped_column(
        ForeignKey("assets.id"),
        nullable=False,
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
    )

    allocated_by: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
    )

    status: Mapped[AllocationStatus] = mapped_column(
        Enum(AllocationStatus),
        nullable=False,
    )

    allocated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    returned_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    asset = relationship(
        "Asset",
        foreign_keys=[asset_id],
    )

    user = relationship(
        "User",
        foreign_keys=[user_id],
    )

    allocator = relationship(
        "User",
        foreign_keys=[allocated_by],
    )