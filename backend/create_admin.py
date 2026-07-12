import asyncio
from app.database import get_db, init_db
from app.models.user import User, UserRole
from app.security import hash_password

async def main():
    await init_db()
    async for db in get_db():
        user = User(
            name='Admin User',
            email='admin@assetflow.io',
            hashed_password=hash_password('admin123'),
            role=UserRole.ADMIN
        )
        db.add(user)
        await db.commit()
        print('Admin created successfully')
        break

asyncio.run(main())
