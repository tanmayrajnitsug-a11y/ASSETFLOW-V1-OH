from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import init_db
from app.routers import auth, users, departments, categories, dashboard, assets, allocations, bookings, maintenance, audits

settings = get_settings()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set all CORS enabled origins
if settings.CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

@app.on_event("startup")
def on_startup():
    init_db()

app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(departments.router, prefix="/api")
app.include_router(categories.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(assets.router, prefix="/api")
app.include_router(allocations.router, prefix="/api")
app.include_router(bookings.router, prefix="/api")
app.include_router(maintenance.router, prefix="/api")
app.include_router(audits.router, prefix="/api")

@app.get("/health")
async def health_check():
    return {"status": "ok", "version": settings.VERSION}
