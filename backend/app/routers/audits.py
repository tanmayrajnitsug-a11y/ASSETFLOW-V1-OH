from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.security import get_current_user
from app.models.user import User
from app.schemas.audit import AuditCycleCreate, AuditItemVerify, AuditCycleOut, AuditItemOut
from app.services import audit_service

router = APIRouter(prefix="/audits", tags=["Audits"])

@router.post("/cycles", response_model=AuditCycleOut, status_code=status.HTTP_201_CREATED)
def create_audit_cycle(
    cycle_in: AuditCycleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cycle_in.created_by = current_user.id
    return audit_service.create_audit_cycle(db=db, cycle_in=cycle_in)

@router.get("/cycles", response_model=list[AuditCycleOut])
def read_audit_cycles(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1),
    department_id: int = None,
    is_closed: bool = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return audit_service.get_audit_cycles(
        db=db, skip=skip, limit=limit, department_id=department_id, is_closed=is_closed
    )

@router.get("/cycles/{cycle_id}", response_model=AuditCycleOut)
def read_audit_cycle(
    cycle_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return audit_service.get_audit_cycle(db=db, cycle_id=cycle_id)

@router.patch("/items/{item_id}/verify", response_model=AuditItemOut)
def verify_audit_item(
    item_id: int,
    verification_in: AuditItemVerify,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    verification_in.verified_by = current_user.id
    return audit_service.verify_audit_item(
        db=db, item_id=item_id, verification_in=verification_in
    )

@router.post("/cycles/{cycle_id}/close", response_model=AuditCycleOut)
def close_audit_cycle(
    cycle_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return audit_service.close_audit_cycle(db=db, cycle_id=cycle_id)
