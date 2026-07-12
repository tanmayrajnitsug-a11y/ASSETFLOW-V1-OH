from datetime import datetime
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.allocation import Allocation, AllocationStatus
from app.models.asset import Asset, AssetStatus
from app.models.transfer import Transfer, TransferStatus
from app.schemas.allocation import AllocationCreate, AllocationUpdate, TransferCreate, TransferUpdate

def allocate_asset(db: Session, allocation_in: AllocationCreate) -> Allocation:
    asset = db.query(Asset).filter(Asset.id == allocation_in.asset_id).first()
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
    
    db.commit()
    db.refresh(db_allocation)
    return db_allocation

def get_allocations(db: Session, skip: int = 0, limit: int = 100, user_id: int = None, asset_id: int = None) -> list[Allocation]:
    query = db.query(Allocation)
    if user_id:
        query = query.filter(Allocation.user_id == user_id)
    if asset_id:
        query = query.filter(Allocation.asset_id == asset_id)
    return query.offset(skip).limit(limit).all()

def return_asset(db: Session, allocation_id: int) -> Allocation:
    allocation = db.query(Allocation).filter(Allocation.id == allocation_id).first()
    if not allocation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Allocation not found")
        
    if allocation.status != AllocationStatus.ACTIVE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Allocation is not active")

    allocation.status = AllocationStatus.RETURNED
    allocation.returned_at = datetime.now()

    asset = db.query(Asset).filter(Asset.id == allocation.asset_id).first()
    if asset:
        asset.status = AssetStatus.AVAILABLE

    db.commit()
    db.refresh(allocation)
    return allocation

def create_transfer(db: Session, transfer_in: TransferCreate) -> Transfer:
    # A transfer requests moving an asset to a new user
    asset = db.query(Asset).filter(Asset.id == transfer_in.asset_id).first()
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
    db.commit()
    db.refresh(db_transfer)
    return db_transfer

def get_transfers(db: Session, skip: int = 0, limit: int = 100, status_filter: TransferStatus = None) -> list[Transfer]:
    query = db.query(Transfer)
    if status_filter:
        query = query.filter(Transfer.status == status_filter)
    return query.offset(skip).limit(limit).all()

def approve_transfer(db: Session, transfer_id: int, approver_id: int) -> Transfer:
    transfer = db.query(Transfer).filter(Transfer.id == transfer_id).first()
    if not transfer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transfer not found")
        
    if transfer.status != TransferStatus.PENDING:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Transfer is not pending")
        
    transfer.status = TransferStatus.APPROVED
    transfer.approved_by = approver_id
    db.commit()
    db.refresh(transfer)
    return transfer
    
def complete_transfer(db: Session, transfer_id: int) -> Transfer:
    transfer = db.query(Transfer).filter(Transfer.id == transfer_id).first()
    if not transfer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transfer not found")
        
    if transfer.status != TransferStatus.APPROVED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Transfer is not approved")
        
    transfer.status = TransferStatus.COMPLETED
    transfer.completed_at = datetime.now()
    
    # 1. Close existing allocation if there is one
    if transfer.from_user_id:
        existing_alloc = db.query(Allocation).filter(
            Allocation.asset_id == transfer.asset_id,
            Allocation.user_id == transfer.from_user_id,
            Allocation.status == AllocationStatus.ACTIVE
        ).first()
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
    asset = db.query(Asset).filter(Asset.id == transfer.asset_id).first()
    if asset:
        asset.status = AssetStatus.ALLOCATED
        
    db.commit()
    db.refresh(transfer)
    return transfer
