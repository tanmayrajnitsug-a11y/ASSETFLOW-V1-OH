# TODO: Notifications router – list, mark read, activity log

from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.activity_log import ActivityLog
from app.models.notification import Notification, NotificationType
from app.models.user import User, UserRole
from app.security import get_current_user, require_roles


router = APIRouter(
    prefix="/notifications",
    tags=["notifications"],
)


class NotificationOut(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    type: NotificationType
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ActivityLogOut(BaseModel):
    id: int
    user_id: int | None
    action: str
    entity_type: str
    entity_id: int
    details: dict[str, Any] | None
    created_at: datetime

    class Config:
        from_attributes = True


class SuccessResponse(BaseModel):
    success: bool


@router.get("/", response_model=list[NotificationOut])
async def list_notifications(
    unread_only: bool = False,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return notifications belonging to the currently logged-in user.
    """

    query = (
        select(Notification)
        .where(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .offset(skip)
        .limit(limit)
    )

    if unread_only:
        query = query.where(Notification.is_read.is_(False))

    result = await db.execute(query)
    return result.scalars().all()


@router.post("/read-all", response_model=SuccessResponse)
async def mark_all_notifications_as_read(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Mark all notifications of the current user as read.
    """

    await db.execute(
        update(Notification)
        .where(
            Notification.user_id == current_user.id,
            Notification.is_read.is_(False),
        )
        .values(is_read=True)
    )

    await db.commit()

    return {"success": True}


@router.patch("/{notification_id}/read", response_model=NotificationOut)
async def mark_notification_as_read(
    notification_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Mark one notification belonging to the current user as read.
    """

    result = await db.execute(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == current_user.id,
        )
    )

    notification = result.scalar_one_or_none()

    if notification is None:
        raise HTTPException(
            status_code=404,
            detail="Notification not found",
        )

    notification.is_read = True

    await db.commit()
    await db.refresh(notification)

    return notification


@router.get("/activity-logs", response_model=list[ActivityLogOut])
async def list_activity_logs(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.ADMIN,
            UserRole.ASSET_MANAGER,
        )
    ),
):
    """
    Return recent system activity logs.

    Only admins and asset managers can access system-wide logs.
    """

    result = await db.execute(
        select(ActivityLog)
        .order_by(ActivityLog.created_at.desc())
        .offset(skip)
        .limit(limit)
    )

    return result.scalars().all()