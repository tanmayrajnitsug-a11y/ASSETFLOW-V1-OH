import asyncio
from app.database import async_session
from app.services.maintenance_service import update_maintenance_status
from app.schemas.maintenance import MaintenanceUpdate, MaintenanceOut
from app.models.maintenance import MaintenanceStatus

async def run():
    async with async_session() as db:
        req = MaintenanceUpdate(status=MaintenanceStatus.IN_PROGRESS, priority="high", issue_description="test")
        try:
            res = await update_maintenance_status(db, 1, req, 1)
            out = MaintenanceOut.model_validate(res)
            print("Serialized:", out.model_dump_json())
        except Exception as e:
            print("Failed:", e)

asyncio.run(run())
