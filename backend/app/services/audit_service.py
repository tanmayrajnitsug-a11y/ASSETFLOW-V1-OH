from datetime import datetime
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.audit import AuditCycle, AuditItem, AuditItemStatus
from app.models.asset import Asset
from app.models.user import User
from app.schemas.audit import AuditCycleCreate, AuditItemVerify

def create_audit_cycle(db: Session, cycle_in: AuditCycleCreate) -> AuditCycle:
    # Get auditors
    auditors = []
    if cycle_in.auditor_ids:
        auditors = db.query(User).filter(User.id.in_(cycle_in.auditor_ids)).all()

    db_cycle = AuditCycle(
        department_id=cycle_in.department_id,
        location=cycle_in.location,
        start_date=cycle_in.start_date,
        end_date=cycle_in.end_date,
        created_by=cycle_in.created_by,
        is_closed=False
    )
    db_cycle.auditors = auditors
    db.add(db_cycle)
    db.commit()
    db.refresh(db_cycle)

    # Automatically generate AuditItems for assets in the department/location
    asset_query = db.query(Asset)
    if cycle_in.department_id:
        asset_query = asset_query.filter(Asset.department_id == cycle_in.department_id)
    if cycle_in.location:
        asset_query = asset_query.filter(Asset.location == cycle_in.location)
        
    assets_to_audit = asset_query.all()
    for asset in assets_to_audit:
        db_item = AuditItem(
            audit_cycle_id=db_cycle.id,
            asset_id=asset.id
        )
        db.add(db_item)
        
    db.commit()
    db.refresh(db_cycle)
    return db_cycle

def get_audit_cycles(db: Session, skip: int = 0, limit: int = 100, department_id: int = None, is_closed: bool = None) -> list[AuditCycle]:
    query = db.query(AuditCycle)
    if department_id:
        query = query.filter(AuditCycle.department_id == department_id)
    if is_closed is not None:
        query = query.filter(AuditCycle.is_closed == is_closed)
        
    return query.offset(skip).limit(limit).all()

def get_audit_cycle(db: Session, cycle_id: int) -> AuditCycle:
    cycle = db.query(AuditCycle).filter(AuditCycle.id == cycle_id).first()
    if not cycle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Audit cycle not found")
    return cycle

def verify_audit_item(db: Session, item_id: int, verification_in: AuditItemVerify) -> AuditItem:
    item = db.query(AuditItem).filter(AuditItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Audit item not found")
        
    if item.cycle.is_closed:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Audit cycle is already closed")

    item.verified_by = verification_in.verified_by
    item.verification_status = verification_in.verification_status
    item.remarks = verification_in.remarks
    item.verified_at = datetime.now()

    db.commit()
    db.refresh(item)
    return item

def close_audit_cycle(db: Session, cycle_id: int) -> AuditCycle:
    cycle = get_audit_cycle(db, cycle_id)
    if cycle.is_closed:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Audit cycle is already closed")
        
    cycle.is_closed = True
    cycle.closed_at = datetime.now()
    db.commit()
    db.refresh(cycle)
    return cycle
