from datetime import datetime
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.allocation import Allocation, AllocationStatus
from app.models.asset import Asset, AssetStatus
from app.models.transfer import Transfer, TransferStatus
from app.schemas.allocation import AllocationCreate, AllocationUpdate, TransferCreate, TransferUpdate

async def allocate_asset(db: AsyncSession, allocation_in: AllocationCreate) -> Allocation:
    result = await db.execute(select(Asset).filter(Asset.id == allocation_in.asset_id))
    asset = result.scalar_one_or_none()
    
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")
        
    if asset.status != AssetStatus.AVAILABLE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Asset is not available for allocation")

    # Create allocation
    db_allocation = Allocation(
        asset_id=allocation_in.asset_id,
        user_id=allocation_in.user_id,
        allocated_by=allocation_in.allocated_by,
        status=AllocationStatus.ACTIVE,
        notes=allocation_in.notes
    )
    db.add(db_allocation)
    
    # Update asset status
    asset.status = AssetStatus.ALLOCATED
    
    await db.commit()
    await db.refresh(db_allocation)
    return db_allocation

async def get_allocations(db: AsyncSession, skip: int = 0, limit: int = 100, user_id: int = None, asset_id: int = None) -> list[Allocation]:
    stmt = select(Allocation)
    if user_id:
        stmt = stmt.filter(Allocation.user_id == user_id)
    if asset_id:
        stmt = stmt.filter(Allocation.asset_id == asset_id)
        
    stmt = stmt.offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()

async def return_asset(db: AsyncSession, allocation_id: int) -> Allocation:
    result = await db.execute(select(Allocation).filter(Allocation.id == allocation_id))
    allocation = result.scalar_one_or_none()
    
    if not allocation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Allocation not found")
        
    if allocation.status != AllocationStatus.ACTIVE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Allocation is not active")

    allocation.status = AllocationStatus.RETURNED
    allocation.returned_at = datetime.now()

    result = await db.execute(select(Asset).filter(Asset.id == allocation.asset_id))
    asset = result.scalar_one_or_none()
    if asset:
        asset.status = AssetStatus.AVAILABLE

    await db.commit()
    await db.refresh(allocation)
    return allocation

async def create_transfer(db: AsyncSession, transfer_in: TransferCreate) -> Transfer:
    # A transfer requests moving an asset to a new user
    result = await db.execute(select(Asset).filter(Asset.id == transfer_in.asset_id))
    asset = result.scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")
        
    db_transfer = Transfer(
        asset_id=transfer_in.asset_id,
        from_user_id=transfer_in.from_user_id,
        to_user_id=transfer_in.to_user_id,
        from_department_id=transfer_in.from_department_id,
        to_department_id=transfer_in.to_department_id,
        status=TransferStatus.PENDING,
        requested_by=transfer_in.requested_by,
        reason=transfer_in.reason
    )
    db.add(db_transfer)
    await db.commit()
    await db.refresh(db_transfer)
    return db_transfer

async def get_transfers(db: AsyncSession, skip: int = 0, limit: int = 100, status_filter: TransferStatus = None) -> list[Transfer]:
    stmt = select(Transfer)
    if status_filter:
        stmt = stmt.filter(Transfer.status == status_filter)
    stmt = stmt.offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()

async def approve_transfer(db: AsyncSession, transfer_id: int, approver_id: int) -> Transfer:
    result = await db.execute(select(Transfer).filter(Transfer.id == transfer_id))
    transfer = result.scalar_one_or_none()
    
    if not transfer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transfer not found")
        
    if transfer.status != TransferStatus.PENDING:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Transfer is not pending")
        
    transfer.status = TransferStatus.APPROVED
    transfer.approved_by = approver_id
    await db.commit()
    await db.refresh(transfer)
    return transfer
    
async def complete_transfer(db: AsyncSession, transfer_id: int) -> Transfer:
    result = await db.execute(select(Transfer).filter(Transfer.id == transfer_id))
    transfer = result.scalar_one_or_none()
    
    if not transfer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transfer not found")
        
    if transfer.status != TransferStatus.APPROVED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Transfer is not approved")
        
    transfer.status = TransferStatus.COMPLETED
    transfer.completed_at = datetime.now()
    
    # 1. Close existing allocation if there is one
    if transfer.from_user_id:
        existing_result = await db.execute(select(Allocation).filter(
            Allocation.asset_id == transfer.asset_id,
            Allocation.user_id == transfer.from_user_id,
            Allocation.status == AllocationStatus.ACTIVE
        ))
        existing_alloc = existing_result.scalar_one_or_none()
        if existing_alloc:
            existing_alloc.status = AllocationStatus.RETURNED
            existing_alloc.returned_at = datetime.now()

    # 2. Create new allocation
    new_alloc = Allocation(
        asset_id=transfer.asset_id,
        user_id=transfer.to_user_id,
        allocated_by=transfer.approved_by if transfer.approved_by else transfer.requested_by,
        status=AllocationStatus.ACTIVE,
        notes=f"Created from Transfer ID {transfer.id}"
    )
    db.add(new_alloc)
    
    # 3. Ensure asset status is allocated
    asset_result = await db.execute(select(Asset).filter(Asset.id == transfer.asset_id))
    asset = asset_result.scalar_one_or_none()
    if asset:
        asset.status = AssetStatus.ALLOCATED
        
    await db.commit()
    await db.refresh(transfer)
    return transfer
