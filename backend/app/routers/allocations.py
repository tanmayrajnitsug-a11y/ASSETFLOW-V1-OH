from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.security import get_current_user
from app.models.user import User
from app.models.transfer import TransferStatus
from app.schemas.allocation import (
    AllocationCreate, AllocationUpdate, AllocationOut,
    TransferCreate, TransferUpdate, TransferOut
)
from app.services import allocation_service

router = APIRouter(prefix="/allocations", tags=["Allocations"])

@router.post("/", response_model=AllocationOut, status_code=status.HTTP_201_CREATED)
async def allocate_asset(
    allocation_in: AllocationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Enforce current user as allocator if not provided
    allocation_in.allocated_by = current_user.id
    return await allocation_service.allocate_asset(db=db, allocation_in=allocation_in)

@router.get("/", response_model=list[AllocationOut])
async def read_allocations(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1),
    user_id: int = None,
    asset_id: int = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await allocation_service.get_allocations(
        db=db, skip=skip, limit=limit, user_id=user_id, asset_id=asset_id
    )

@router.post("/{allocation_id}/return", response_model=AllocationOut)
async def return_asset(
    allocation_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await allocation_service.return_asset(db=db, allocation_id=allocation_id)

@router.post("/transfers", response_model=TransferOut, status_code=status.HTTP_201_CREATED)
async def create_transfer(
    transfer_in: TransferCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    transfer_in.requested_by = current_user.id
    return await allocation_service.create_transfer(db=db, transfer_in=transfer_in)

@router.get("/transfers", response_model=list[TransferOut])
async def read_transfers(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1),
    status_filter: TransferStatus = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await allocation_service.get_transfers(
        db=db, skip=skip, limit=limit, status_filter=status_filter
    )

@router.post("/transfers/{transfer_id}/approve", response_model=TransferOut)
async def approve_transfer(
    transfer_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await allocation_service.approve_transfer(
        db=db, transfer_id=transfer_id, approver_id=current_user.id
    )

@router.post("/transfers/{transfer_id}/complete", response_model=TransferOut)
async def complete_transfer(
    transfer_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await allocation_service.complete_transfer(db=db, transfer_id=transfer_id)