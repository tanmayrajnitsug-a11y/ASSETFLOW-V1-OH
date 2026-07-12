from collections import Counter

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.allocation import Allocation, AllocationStatus
from app.models.asset import Asset, AssetStatus
from app.models.booking import Booking, BookingStatus
from app.models.department import Department
from app.models.maintenance import MaintenanceRequest, MaintenanceStatus
from app.models.user import User
from app.security import get_current_user


router = APIRouter(
    prefix="/reports",
    tags=["reports"],
)


async def count_records(
    db: AsyncSession,
    statement,
) -> int:
    result = await db.execute(statement)
    return int(result.scalar_one())


@router.get("/dashboard")
async def get_dashboard_kpis(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return the main dashboard KPI values.
    """

    total_assets = await count_records(
        db,
        select(func.count(Asset.id)),
    )

    available_assets = await count_records(
        db,
        select(func.count(Asset.id)).where(
            Asset.status == AssetStatus.AVAILABLE
        ),
    )

    allocated_assets = await count_records(
        db,
        select(func.count(Asset.id)).where(
            Asset.status == AssetStatus.ALLOCATED
        ),
    )

    assets_under_maintenance = await count_records(
        db,
        select(func.count(Asset.id)).where(
            Asset.status == AssetStatus.UNDER_MAINTENANCE
        ),
    )

    active_allocations = await count_records(
        db,
        select(func.count(Allocation.id)).where(
            Allocation.status == AllocationStatus.ACTIVE
        ),
    )

    open_maintenance_requests = await count_records(
        db,
        select(func.count(MaintenanceRequest.id)).where(
            MaintenanceRequest.status.notin_(
                [
                    MaintenanceStatus.RESOLVED,
                    MaintenanceStatus.REJECTED,
                ]
            )
        ),
    )

    active_bookings = await count_records(
        db,
        select(func.count(Booking.id)).where(
            Booking.status.in_(
                [
                    BookingStatus.PENDING,
                    BookingStatus.APPROVED,
                    BookingStatus.ACTIVE,
                ]
            )
        ),
    )

    return {
        "total_assets": total_assets,
        "available_assets": available_assets,
        "allocated_assets": allocated_assets,
        "assets_under_maintenance": assets_under_maintenance,
        "active_allocations": active_allocations,
        "open_maintenance_requests": open_maintenance_requests,
        "active_bookings": active_bookings,
    }


@router.get("/asset-utilization")
async def get_asset_utilization(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return asset counts grouped by status and utilization percentage.
    """

    result = await db.execute(
        select(
            Asset.status,
            func.count(Asset.id),
        )
        .group_by(Asset.status)
        .order_by(Asset.status)
    )

    status_breakdown = {
        status.value: int(count)
        for status, count in result.all()
    }

    total_assets = sum(status_breakdown.values())

    allocated_assets = status_breakdown.get(
        AssetStatus.ALLOCATED.value,
        0,
    )

    utilization_percentage = (
        round((allocated_assets / total_assets) * 100, 2)
        if total_assets
        else 0.0
    )

    return {
        "total_assets": total_assets,
        "allocated_assets": allocated_assets,
        "utilization_percentage": utilization_percentage,
        "status_breakdown": status_breakdown,
    }


@router.get("/maintenance-frequency")
async def get_maintenance_frequency(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return maintenance-request frequency by asset and status.
    """

    frequency_result = await db.execute(
        select(
            Asset.id,
            Asset.name,
            func.count(MaintenanceRequest.id).label("request_count"),
        )
        .join(
            MaintenanceRequest,
            MaintenanceRequest.asset_id == Asset.id,
        )
        .group_by(
            Asset.id,
            Asset.name,
        )
        .order_by(
            func.count(MaintenanceRequest.id).desc()
        )
    )

    assets = [
        {
            "asset_id": asset_id,
            "asset_name": asset_name,
            "request_count": int(request_count),
        }
        for asset_id, asset_name, request_count
        in frequency_result.all()
    ]

    status_result = await db.execute(
        select(
            MaintenanceRequest.status,
            func.count(MaintenanceRequest.id),
        )
        .group_by(MaintenanceRequest.status)
        .order_by(MaintenanceRequest.status)
    )

    status_breakdown = {
        status.value: int(count)
        for status, count in status_result.all()
    }

    return {
        "assets": assets,
        "status_breakdown": status_breakdown,
    }


@router.get("/department-allocation")
async def get_department_allocation(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return the number of assets assigned to each department.
    """

    result = await db.execute(
        select(
            Department.id,
            Department.name,
            func.count(Asset.id).label("asset_count"),
        )
        .outerjoin(
            Asset,
            Asset.department_id == Department.id,
        )
        .group_by(
            Department.id,
            Department.name,
        )
        .order_by(Department.name)
    )

    departments = [
        {
            "department_id": department_id,
            "department_name": department_name,
            "asset_count": int(asset_count),
        }
        for department_id, department_name, asset_count
        in result.all()
    ]

    unassigned_assets = await count_records(
        db,
        select(func.count(Asset.id)).where(
            Asset.department_id.is_(None)
        ),
    )

    return {
        "departments": departments,
        "unassigned_assets": unassigned_assets,
    }


@router.get("/booking-heatmap")
async def get_booking_heatmap(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return booking counts grouped by weekday and starting hour.
    """

    result = await db.execute(
        select(Booking.start_date)
    )

    booking_dates = result.scalars().all()

    booking_counts = Counter(
        (
            booking_date.weekday(),
            booking_date.hour,
        )
        for booking_date in booking_dates
    )

    day_names = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
    ]

    heatmap = [
        {
            "day": day_names[day_index],
            "day_index": day_index,
            "hour": hour,
            "count": booking_counts.get(
                (day_index, hour),
                0,
            ),
        }
        for day_index in range(7)
        for hour in range(24)
    ]

    return {
        "heatmap": heatmap,
    }


@router.get("")
async def get_all_reports(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return all report data required by the reports page.
    """

    return {
        "dashboard": await get_dashboard_kpis(
            db=db,
            current_user=current_user,
        ),
        "asset_utilization": await get_asset_utilization(
            db=db,
            current_user=current_user,
        ),
        "maintenance_frequency": await get_maintenance_frequency(
            db=db,
            current_user=current_user,
        ),
        "department_allocation": await get_department_allocation(
            db=db,
            current_user=current_user,
        ),
        "booking_heatmap": await get_booking_heatmap(
            db=db,
            current_user=current_user,
        ),
    }