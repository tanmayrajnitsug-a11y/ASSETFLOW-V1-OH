from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import or_, func, select
from fastapi import HTTPException, status

from app.models.asset import Asset
from app.schemas.asset import AssetCreate, AssetUpdate

async def create_asset(db: AsyncSession, asset_in: AssetCreate) -> Asset:
    # Auto-generate asset_tag if not provided
    asset_tag = asset_in.asset_tag
    if not asset_tag:
        result = await db.execute(select(func.max(Asset.id)))
        max_id = result.scalar() or 0
        next_id = max_id + 1
        asset_tag = f"AF-{next_id:04d}"

    # Check for duplicate asset_tag
    stmt = select(Asset).filter(Asset.asset_tag == asset_tag)
    result = await db.execute(stmt)
    existing = result.scalar_one_or_none()
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
    await db.commit()
    await db.refresh(db_asset)
    return db_asset

async def get_assets(db: AsyncSession, skip: int = 0, limit: int = 100, search: str = None, category_id: int = None, status: str = None) -> list[Asset]:
    stmt = select(Asset)
    
    if search:
        stmt = stmt.filter(or_(
            Asset.name.ilike(f"%{search}%"),
            Asset.asset_tag.ilike(f"%{search}%")
        ))
    
    if category_id:
        stmt = stmt.filter(Asset.category_id == category_id)
        
    if status:
        stmt = stmt.filter(Asset.status == status)

    stmt = stmt.offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()

async def get_asset(db: AsyncSession, asset_id: int) -> Asset:
    stmt = select(Asset).filter(Asset.id == asset_id)
    result = await db.execute(stmt)
    asset = result.scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")
    return asset

async def update_asset(db: AsyncSession, asset_id: int, asset_in: AssetUpdate) -> Asset:
    db_asset = await get_asset(db, asset_id)
    
    update_data = asset_in.model_dump(exclude_unset=True)
    if "asset_tag" in update_data:
        stmt = select(Asset).filter(Asset.asset_tag == update_data["asset_tag"], Asset.id != asset_id)
        result = await db.execute(stmt)
        existing = result.scalar_one_or_none()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Asset tag already exists")
            
    for field, value in update_data.items():
        setattr(db_asset, field, value)
        
    await db.commit()
    await db.refresh(db_asset)
    return db_asset
