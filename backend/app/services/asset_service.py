from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from fastapi import HTTPException, status

from app.models.asset import Asset
from app.schemas.asset import AssetCreate, AssetUpdate

def create_asset(db: Session, asset_in: AssetCreate) -> Asset:
    # Auto-generate asset_tag if not provided
    asset_tag = asset_in.asset_tag
    if not asset_tag:
        last_asset = db.query(Asset).order_by(desc(Asset.id)).first()
        next_id = (last_asset.id + 1) if last_asset else 1
        asset_tag = f"AF-{next_id:04d}"

    # Check for duplicate asset_tag
    existing = db.query(Asset).filter(Asset.asset_tag == asset_tag).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Asset tag already exists")

    # Create new asset
    db_asset = Asset(
        name=asset_in.name,
        asset_tag=asset_tag,
        description=asset_in.description,
        category_id=asset_in.category_id,
        department_id=asset_in.department_id,
        status=asset_in.status,
        purchase_date=asset_in.purchase_date,
        purchase_cost=asset_in.purchase_cost,
        warranty_expiry=asset_in.warranty_expiry,
        location=asset_in.location,
    )
    db.add(db_asset)
    db.commit()
    db.refresh(db_asset)
    return db_asset

def get_assets(db: Session, skip: int = 0, limit: int = 100, search: str = None, category_id: int = None, status: str = None) -> list[Asset]:
    query = db.query(Asset)
    
    if search:
        query = query.filter(or_(
            Asset.name.ilike(f"%{search}%"),
            Asset.asset_tag.ilike(f"%{search}%")
        ))
    
    if category_id:
        query = query.filter(Asset.category_id == category_id)
        
    if status:
        query = query.filter(Asset.status == status)

    return query.offset(skip).limit(limit).all()

def get_asset(db: Session, asset_id: int) -> Asset:
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")
    return asset

def update_asset(db: Session, asset_id: int, asset_in: AssetUpdate) -> Asset:
    db_asset = get_asset(db, asset_id)
    
    update_data = asset_in.model_dump(exclude_unset=True)
    if "asset_tag" in update_data:
        existing = db.query(Asset).filter(Asset.asset_tag == update_data["asset_tag"], Asset.id != asset_id).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Asset tag already exists")
            
    for field, value in update_data.items():
        setattr(db_asset, field, value)
        
    db.commit()
    db.refresh(db_asset)
    return db_asset
