from datetime import datetime
from pydantic import BaseModel

class DepartmentBase(BaseModel):
    name: str
    description: str | None = None
    head_id: int | None = None

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    head_id: int | None = None

class DepartmentResponse(DepartmentBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
