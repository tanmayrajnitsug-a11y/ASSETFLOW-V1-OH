import httpx
import asyncio

async def run():
    async with httpx.AsyncClient(base_url="http://localhost:8000/api") as c:
        # login
        r = await c.post("/auth/login", data={"username": "admin@assetflow.io", "password": "admin123"}, headers={"Content-Type": "application/x-www-form-urlencoded"})
        print("Login:", r.status_code)
        token = r.json()["access_token"]
        
        # patch
        r2 = await c.patch("/maintenance/1", json={"status": "in_progress", "priority": "high", "issue_description": "test"}, headers={"Authorization": f"Bearer {token}"})
        print("Patch:", r2.status_code)
        if r2.status_code != 200:
            print("Error:", r2.text)

asyncio.run(run())
