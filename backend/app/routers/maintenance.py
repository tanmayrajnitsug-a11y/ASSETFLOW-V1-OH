from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.security import get_current_user
from app.models.user import User
from app.models.maintenance import MaintenanceStatus
from app.schemas.maintenance import MaintenanceCreate, MaintenanceUpdate, MaintenanceOut
from app.services import maintenance_service

router = APIRouter(prefix="/maintenance", tags=["Maintenance"])

@router.post("/", response_model=MaintenanceOut, status_code=status.HTTP_201_CREATED)
def create_maintenance_request(
    request_in: MaintenanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    request_in.reported_by = current_user.id
    return maintenance_service.create_maintenance_request(db=db, request_in=request_in)

@router.get("/", response_model=list[MaintenanceOut])
def read_maintenance_requests(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1),
    asset_id: int = None,
    status_filter: MaintenanceStatus = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return maintenance_service.get_maintenance_requests(
        db=db, skip=skip, limit=limit, asset_id=asset_id, status_filter=status_filter
    )

@router.patch("/{request_id}", response_model=MaintenanceOut)
def update_maintenance_request(
    request_id: int,
    request_in: MaintenanceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return maintenance_service.update_maintenance_status(
        db=db, request_id=request_id, request_in=request_in, updater_id=current_user.id
    )
