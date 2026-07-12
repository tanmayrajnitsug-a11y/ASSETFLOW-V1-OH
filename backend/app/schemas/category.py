from datetime import datetime
from pydantic import BaseModel

class CategoryBase(BaseModel):
    name: str
    description: str | None = None
    parent_id: int | None = None

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    parent_id: int | None = None

class CategoryResponse(CategoryBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
