from datetime import datetime
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.maintenance import MaintenanceRequest, MaintenanceStatus
from app.models.asset import Asset, AssetStatus
from app.schemas.maintenance import MaintenanceCreate, MaintenanceUpdate

async def create_maintenance_request(db: AsyncSession, request_in: MaintenanceCreate) -> MaintenanceRequest:
    result = await db.execute(select(Asset).filter(Asset.id == request_in.asset_id))
    asset = result.scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")

    db_request = MaintenanceRequest(
        asset_id=request_in.asset_id,
        reported_by=request_in.reported_by,
        issue_description=request_in.issue_description,
        priority=request_in.priority,
        photo_url=request_in.photo_url,
        status=MaintenanceStatus.PENDING
    )
    db.add(db_request)
    await db.commit()
    await db.refresh(db_request)
    return db_request

async def get_maintenance_requests(db: AsyncSession, skip: int = 0, limit: int = 100, asset_id: int = None, status_filter: MaintenanceStatus = None) -> list[MaintenanceRequest]:
    stmt = select(MaintenanceRequest)
    if asset_id:
        stmt = stmt.filter(MaintenanceRequest.asset_id == asset_id)
    if status_filter:
        stmt = stmt.filter(MaintenanceRequest.status == status_filter)
        
    stmt = stmt.offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()

async def update_maintenance_status(db: AsyncSession, request_id: int, request_in: MaintenanceUpdate, updater_id: int) -> MaintenanceRequest:
    result = await db.execute(select(MaintenanceRequest).filter(MaintenanceRequest.id == request_id))
    request = result.scalar_one_or_none()
    if not request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Maintenance request not found")

    asset_result = await db.execute(select(Asset).filter(Asset.id == request.asset_id))
    asset = asset_result.scalar_one_or_none()

    update_data = request_in.model_dump(exclude_unset=True)
    
    # Handle status workflow
    if "status" in update_data:
        new_status = update_data["status"]
        if new_status == MaintenanceStatus.APPROVED:
            request.approved_by = updater_id
            if asset:
                asset.status = AssetStatus.UNDER_MAINTENANCE
        elif new_status == MaintenanceStatus.RESOLVED:
            request.resolved_at = datetime.now()
            if asset and asset.status == AssetStatus.UNDER_MAINTENANCE:
                asset.status = AssetStatus.AVAILABLE
                
    for field, value in update_data.items():
        setattr(request, field, value)

    await db.commit()
    await db.refresh(request)
    return request
