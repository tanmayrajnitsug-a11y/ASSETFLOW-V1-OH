# TODO: TransferRequest model – workflow: Requested → Approved → Completed


import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class TransferStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    COMPLETED = "completed"


class Transfer(Base):
    __tablename__ = "transfers"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    asset_id: Mapped[int] = mapped_column(
        ForeignKey("assets.id"),
        nullable=False,
    )

    from_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"),
        nullable=True,
    )

    to_user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
    )

    from_department_id: Mapped[int | None] = mapped_column(
        ForeignKey("departments.id"),
        nullable=True,
    )

    to_department_id: Mapped[int | None] = mapped_column(
        ForeignKey("departments.id"),
        nullable=True,
    )

    status: Mapped[TransferStatus] = mapped_column(
        Enum(TransferStatus),
        nullable=False,
    )

    requested_by: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
    )

    approved_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"),
        nullable=True,
    )

    requested_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    reason: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    asset = relationship(
        "Asset",
        foreign_keys=[asset_id],
    )

    from_user = relationship(
        "User",
        foreign_keys=[from_user_id],
    )

    to_user = relationship(
        "User",
        foreign_keys=[to_user_id],
    )

    requester = relationship(
        "User",
        foreign_keys=[requested_by],
    )

    approver = relationship(
        "User",
        foreign_keys=[approved_by],
    )