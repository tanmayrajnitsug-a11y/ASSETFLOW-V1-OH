from datetime import datetime
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.maintenance import MaintenanceRequest, MaintenanceStatus
from app.models.asset import Asset, AssetStatus
from app.schemas.maintenance import MaintenanceCreate, MaintenanceUpdate

def create_maintenance_request(db: Session, request_in: MaintenanceCreate) -> MaintenanceRequest:
    asset = db.query(Asset).filter(Asset.id == request_in.asset_id).first()
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
    db.commit()
    db.refresh(db_request)
    return db_request

def get_maintenance_requests(db: Session, skip: int = 0, limit: int = 100, asset_id: int = None, status_filter: MaintenanceStatus = None) -> list[MaintenanceRequest]:
    query = db.query(MaintenanceRequest)
    if asset_id:
        query = query.filter(MaintenanceRequest.asset_id == asset_id)
    if status_filter:
        query = query.filter(MaintenanceRequest.status == status_filter)
        
    return query.offset(skip).limit(limit).all()

def update_maintenance_status(db: Session, request_id: int, request_in: MaintenanceUpdate, updater_id: int) -> MaintenanceRequest:
    request = db.query(MaintenanceRequest).filter(MaintenanceRequest.id == request_id).first()
    if not request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Maintenance request not found")

    asset = db.query(Asset).filter(Asset.id == request.asset_id).first()

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

    db.commit()
    db.refresh(request)
    return request
