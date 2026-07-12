from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.security import get_current_user
from app.models.user import User
from app.schemas.asset import AssetCreate, AssetUpdate, AssetOut
from app.services import asset_service

router = APIRouter(prefix="/assets", tags=["Assets"])

@router.post("/", response_model=AssetOut, status_code=status.HTTP_201_CREATED)
def create_asset(
    asset_in: AssetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return asset_service.create_asset(db=db, asset_in=asset_in)

@router.get("/", response_model=list[AssetOut])
def read_assets(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1),
    search: str = None,
    category_id: int = None,
    status: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return asset_service.get_assets(
        db=db,
        skip=skip,
        limit=limit,
        search=search,
        category_id=category_id,
        status=status
    )

@router.get("/{asset_id}", response_model=AssetOut)
def read_asset(
    asset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return asset_service.get_asset(db=db, asset_id=asset_id)

@router.put("/{asset_id}", response_model=AssetOut)
def update_asset(
    asset_id: int,
    asset_in: AssetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return asset_service.update_asset(db=db, asset_id=asset_id, asset_in=asset_in)
