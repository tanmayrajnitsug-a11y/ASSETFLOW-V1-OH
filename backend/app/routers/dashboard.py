from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models.user import User
from app.models.department import Department
from app.models.category import Category
from app.security import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats")
async def dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Fetching basic counts
    users_count = await db.scalar(select(func.count(User.id)))
    depts_count = await db.scalar(select(func.count(Department.id)))
    cats_count = await db.scalar(select(func.count(Category.id)))

    # Return the exact JSON structure expected by dashboard.jsx
    return {
        "stats": {
            "available_assets": 0,
            "allocated_assets": 0,
            "maintenance_today": 0,
            "active_bookings": 0,
            "pending_transfers": 0,
            "upcoming_returns": 0,
            "total_users": users_count or 0,
            "total_departments": depts_count or 0,
            "total_categories": cats_count or 0,
        },
        "recent_activity": [
            # The frontend expects objects like: 
            # {"id": 1, "type": "allocation", "action": "Laptop to John", "time": "2h ago"}
        ],
        "categoryBreakdown": [
            # Dummy data so the DonutChart doesn't crash on undefined 'value' and 'color'
            {"label": "Hardware", "value": 0, "color": "#67D5FF"},
            {"label": "Software", "value": 0, "color": "#818CF8"}
        ],
        "maintenanceTrend": [
            # Dummy data so the MiniBarChart doesn't crash on undefined 'tickets'
            {"month": "Jan", "tickets": 0},
            {"month": "Feb", "tickets": 0}
        ]
    }