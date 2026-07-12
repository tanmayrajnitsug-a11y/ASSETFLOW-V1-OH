from datetime import datetime
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.audit import AuditCycle, AuditItem, AuditItemStatus
from app.models.asset import Asset
from app.models.user import User
from app.schemas.audit import AuditCycleCreate, AuditItemVerify

async def create_audit_cycle(db: AsyncSession, cycle_in: AuditCycleCreate) -> AuditCycle:
    # Get auditors
    auditors = []
    if cycle_in.auditor_ids:
        stmt = select(User).filter(User.id.in_(cycle_in.auditor_ids))
        result = await db.execute(stmt)
        auditors = list(result.scalars().all())

    db_cycle = AuditCycle(
        department_id=cycle_in.department_id,
        location=cycle_in.location,
        start_date=cycle_in.start_date,
        end_date=cycle_in.end_date,
        created_by=cycle_in.created_by,
        is_closed=False
    )
    # The back_populates/relationships with async SQLAlchemy might need lazy="selectin" 
    # but extending the list directly before commit should work.
    db_cycle.auditors = auditors
    db.add(db_cycle)
    await db.commit()
    await db.refresh(db_cycle)

    # Automatically generate AuditItems for assets in the department/location
    stmt = select(Asset)
    if cycle_in.department_id:
        stmt = stmt.filter(Asset.department_id == cycle_in.department_id)
    if cycle_in.location:
        stmt = stmt.filter(Asset.location == cycle_in.location)
        
    result = await db.execute(stmt)
    assets_to_audit = result.scalars().all()
    
    for asset in assets_to_audit:
        db_item = AuditItem(
            audit_cycle_id=db_cycle.id,
            asset_id=asset.id
        )
        db.add(db_item)
        
    await db.commit()
    await db.refresh(db_cycle)
    return db_cycle

async def get_audit_cycles(db: AsyncSession, skip: int = 0, limit: int = 100, department_id: int = None, is_closed: bool = None) -> list[AuditCycle]:
    stmt = select(AuditCycle)
    if department_id:
        stmt = stmt.filter(AuditCycle.department_id == department_id)
    if is_closed is not None:
        stmt = stmt.filter(AuditCycle.is_closed == is_closed)
        
    stmt = stmt.offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()

async def get_audit_cycle(db: AsyncSession, cycle_id: int) -> AuditCycle:
    result = await db.execute(select(AuditCycle).filter(AuditCycle.id == cycle_id))
    cycle = result.scalar_one_or_none()
    if not cycle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Audit cycle not found")
    return cycle

async def verify_audit_item(db: AsyncSession, item_id: int, verification_in: AuditItemVerify) -> AuditItem:
    # Need to join cycle to check if it's closed
    # For simplicity with async, we can just fetch the item and then lazily load or fetch cycle explicitly if lazy loading fails
    # Let's fetch item, then check cycle
    result = await db.execute(select(AuditItem).filter(AuditItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Audit item not found")
        
    cycle_result = await db.execute(select(AuditCycle).filter(AuditCycle.id == item.audit_cycle_id))
    cycle = cycle_result.scalar_one_or_none()
    
    if cycle and cycle.is_closed:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Audit cycle is already closed")

    item.verified_by = verification_in.verified_by
    item.verification_status = verification_in.verification_status
    item.remarks = verification_in.remarks
    item.verified_at = datetime.now()

    await db.commit()
    await db.refresh(item)
    return item

async def close_audit_cycle(db: AsyncSession, cycle_id: int) -> AuditCycle:
    cycle = await get_audit_cycle(db, cycle_id)
    if cycle.is_closed:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Audit cycle is already closed")
        
    cycle.is_closed = True
    cycle.closed_at = datetime.now()
    await db.commit()
    await db.refresh(cycle)
    return cycle
