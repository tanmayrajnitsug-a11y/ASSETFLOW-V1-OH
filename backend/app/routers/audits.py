from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.audit import AuditCycle, AuditItem
from app.models.user import User
from app.schemas.audit import AuditCycleCreate, AuditCycleOut, AuditItemOut, AuditItemVerify
from app.security import get_current_user

# Safely import Asset model to automatically generate audit items
try:
    from app.models.asset import Asset
except ImportError:
    Asset = None

router = APIRouter(prefix="/audits", tags=["Audits"])


@router.post("/cycles", response_model=AuditCycleOut, status_code=status.HTTP_201_CREATED)
async def create_audit_cycle(
    cycle_in: AuditCycleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 1. Prepare cycle data and inject current user
    cycle_data = cycle_in.model_dump(exclude={"auditor_ids"})
    cycle_data["created_by"] = current_user.id
    
    db_cycle = AuditCycle(**cycle_data)
    db.add(db_cycle)
    await db.flush()  # Flush to generate db_cycle.id

    # 2. Automatically populate Audit Items if the Asset model exists
    if Asset is not None:
        query = select(Asset)
        if cycle_in.department_id:
            query = query.where(Asset.department_id == cycle_in.department_id)
        if cycle_in.location:
            query = query.where(Asset.location == cycle_in.location)
        
        result = await db.execute(query)
        assets = result.scalars().all()
        
        for asset in assets:
            audit_item = AuditItem(
                audit_cycle_id=db_cycle.id,
                asset_id=asset.id
            )
            db.add(audit_item)

    await db.commit()

    # 3. Eagerly re-fetch with .items loaded to prevent the MissingGreenlet crash
    stmt = (
        select(AuditCycle)
        .where(AuditCycle.id == db_cycle.id)
        .options(selectinload(AuditCycle.items))
    )
    result = await db.execute(stmt)
    return result.scalar_one()


@router.get("/cycles", response_model=list[AuditCycleOut])
async def read_audit_cycles(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1),
    department_id: int | None = None,
    is_closed: bool | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = (
        select(AuditCycle)
        .options(selectinload(AuditCycle.items))
        .offset(skip)
        .limit(limit)
    )
    if department_id is not None:
        stmt = stmt.where(AuditCycle.department_id == department_id)
    if is_closed is not None:
        stmt = stmt.where(AuditCycle.is_closed == is_closed)
        
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.get("/cycles/{cycle_id}", response_model=AuditCycleOut)
async def read_audit_cycle(
    cycle_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = (
        select(AuditCycle)
        .where(AuditCycle.id == cycle_id)
        .options(selectinload(AuditCycle.items))
    )
    result = await db.execute(stmt)
    cycle = result.scalar_one_or_none()
    if not cycle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Audit cycle not found")
    return cycle


@router.patch("/items/{item_id}/verify", response_model=AuditItemOut)
async def verify_audit_item(
    item_id: int,
    verification_in: AuditItemVerify,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = select(AuditItem).where(AuditItem.id == item_id)
    result = await db.execute(stmt)
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Audit item not found")

    item.verification_status = verification_in.verification_status
    item.remarks = verification_in.remarks
    item.verified_by = current_user.id
    item.verified_at = verification_in.verified_at or datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(item)
    return item


@router.post("/cycles/{cycle_id}/close", response_model=AuditCycleOut)
async def close_audit_cycle(
    cycle_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = (
        select(AuditCycle)
        .where(AuditCycle.id == cycle_id)
        .options(selectinload(AuditCycle.items))
    )
    result = await db.execute(stmt)
    cycle = result.scalar_one_or_none()
    if not cycle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Audit cycle not found")

    cycle.is_closed = True
    cycle.closed_at = datetime.now(timezone.utc)
    
    await db.commit()
    
    # Eagerly re-fetch with relationships loaded
    result = await db.execute(stmt)
    return result.scalar_one()