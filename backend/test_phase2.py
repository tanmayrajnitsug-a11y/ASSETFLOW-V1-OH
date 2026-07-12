"""
Test all Phase 2 Person A endpoints: Auth, Users, Departments, Categories
"""
import asyncio
import httpx

BASE = "http://localhost:8000"
PASSED = 0
FAILED = 0

def log(status, endpoint, detail=""):
    global PASSED, FAILED
    icon = "✅" if status else "❌"
    if status:
        PASSED += 1
    else:
        FAILED += 1
    print(f"  {icon} {endpoint} — {detail}")

async def main():
    global PASSED, FAILED
    async with httpx.AsyncClient(base_url=BASE, timeout=10) as c:

        # ── AUTH ──────────────────────────────────────────
        print("\n🔐 AUTH ENDPOINTS")
        
        # Signup
        r = await c.post("/api/auth/signup", json={
            "name": "Test User", "email": "testphase2@test.com", "password": "test123"
        })
        log(r.status_code == 201, "POST /api/auth/signup", f"{r.status_code}")
        
        # Signup duplicate (should fail 400)
        r = await c.post("/api/auth/signup", json={
            "name": "Test User", "email": "testphase2@test.com", "password": "test123"
        })
        log(r.status_code == 400, "POST /api/auth/signup (duplicate)", f"{r.status_code}")

        # Login (form data)
        r = await c.post("/api/auth/login", data={
            "username": "testphase2@test.com", "password": "test123"
        })
        log(r.status_code == 200, "POST /api/auth/login", f"{r.status_code}")
        user_token = r.json()["access_token"]
        user_headers = {"Authorization": f"Bearer {user_token}"}

        # Login wrong password
        r = await c.post("/api/auth/login", data={
            "username": "testphase2@test.com", "password": "wrongpass"
        })
        log(r.status_code == 401, "POST /api/auth/login (wrong pw)", f"{r.status_code}")

        # Get /me
        r = await c.get("/api/auth/me", headers=user_headers)
        log(r.status_code == 200, "GET  /api/auth/me", f"{r.status_code} — name={r.json().get('name')}")
        test_user_id = r.json()["id"]

        # Login as admin
        r = await c.post("/api/auth/login", data={
            "username": "admin@assetflow.io", "password": "admin123"
        })
        log(r.status_code == 200, "POST /api/auth/login (admin)", f"{r.status_code}")
        admin_token = r.json()["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}

        # ── USERS ─────────────────────────────────────────
        print("\n👥 USER ENDPOINTS")

        # List users
        r = await c.get("/api/users/", headers=admin_headers)
        log(r.status_code == 200, "GET  /api/users/", f"{r.status_code} — count={len(r.json())}")

        # Get specific user
        r = await c.get(f"/api/users/{test_user_id}", headers=admin_headers)
        log(r.status_code == 200, f"GET  /api/users/{test_user_id}", f"{r.status_code} — {r.json().get('name')}")

        # Get non-existent user
        r = await c.get("/api/users/9999", headers=admin_headers)
        log(r.status_code == 404, "GET  /api/users/9999 (not found)", f"{r.status_code}")

        # Update user (admin updating test user)
        r = await c.put(f"/api/users/{test_user_id}", headers=admin_headers, json={
            "phone": "9876543210", "employee_id": "EMP-001"
        })
        log(r.status_code == 200, f"PUT  /api/users/{test_user_id}", f"{r.status_code} — phone={r.json().get('phone')}")

        # Update user (non-admin trying to update someone else — should fail)
        r = await c.put("/api/users/1", headers=user_headers, json={"phone": "111"})
        log(r.status_code == 403, "PUT  /api/users/1 (forbidden)", f"{r.status_code}")

        # Assign role (admin only)
        r = await c.patch(f"/api/users/{test_user_id}/role", headers=admin_headers, json={
            "role": "asset_manager"
        })
        log(r.status_code == 200, f"PATCH /api/users/{test_user_id}/role", f"{r.status_code} — role={r.json().get('role')}")

        # Assign role (non-admin — should fail)
        r = await c.patch(f"/api/users/{test_user_id}/role", headers=user_headers, json={
            "role": "admin"
        })
        log(r.status_code == 403, f"PATCH /api/users/{test_user_id}/role (forbidden)", f"{r.status_code}")

        # ── DEPARTMENTS ───────────────────────────────────
        print("\n🏢 DEPARTMENT ENDPOINTS")

        # Create department (admin)
        r = await c.post("/api/departments/", headers=admin_headers, json={
            "name": "Engineering", "description": "Software Engineering Team"
        })
        log(r.status_code == 201, "POST /api/departments/", f"{r.status_code} — name={r.json().get('name')}")
        dept_id = r.json()["id"]

        # Create another department
        r = await c.post("/api/departments/", headers=admin_headers, json={
            "name": "Marketing", "description": "Marketing Team"
        })
        log(r.status_code == 201, "POST /api/departments/ (2nd)", f"{r.status_code}")

        # Create department (non-admin — should fail)
        r = await c.post("/api/departments/", headers=user_headers, json={
            "name": "Illegal Dept"
        })
        log(r.status_code == 403, "POST /api/departments/ (forbidden)", f"{r.status_code}")

        # List departments
        r = await c.get("/api/departments/", headers=admin_headers)
        log(r.status_code == 200, "GET  /api/departments/", f"{r.status_code} — count={len(r.json())}")

        # Get specific department
        r = await c.get(f"/api/departments/{dept_id}", headers=admin_headers)
        log(r.status_code == 200, f"GET  /api/departments/{dept_id}", f"{r.status_code} — {r.json().get('name')}")

        # Get non-existent department
        r = await c.get("/api/departments/9999", headers=admin_headers)
        log(r.status_code == 404, "GET  /api/departments/9999", f"{r.status_code}")

        # Update department
        r = await c.put(f"/api/departments/{dept_id}", headers=admin_headers, json={
            "description": "Full-Stack Engineering"
        })
        log(r.status_code == 200, f"PUT  /api/departments/{dept_id}", f"{r.status_code} — desc={r.json().get('description')}")

        # Delete department
        r = await c.delete(f"/api/departments/{dept_id}", headers=admin_headers)
        log(r.status_code == 204, f"DEL  /api/departments/{dept_id}", f"{r.status_code}")

        # Delete non-existent department
        r = await c.delete("/api/departments/9999", headers=admin_headers)
        log(r.status_code == 404, "DEL  /api/departments/9999", f"{r.status_code}")

        # ── CATEGORIES ────────────────────────────────────
        print("\n📂 CATEGORY ENDPOINTS")

        # Create category (admin)
        r = await c.post("/api/categories/", headers=admin_headers, json={
            "name": "Electronics", "description": "Electronic devices"
        })
        log(r.status_code == 201, "POST /api/categories/", f"{r.status_code} — name={r.json().get('name')}")
        cat_id = r.json()["id"]

        # Create sub-category
        r = await c.post("/api/categories/", headers=admin_headers, json={
            "name": "Laptops", "description": "Laptop devices", "parent_id": cat_id
        })
        log(r.status_code == 201, "POST /api/categories/ (sub)", f"{r.status_code} — parent_id={r.json().get('parent_id')}")

        # Create category (non-admin non-manager — should fail)
        # First reset test user role back to employee
        await c.patch(f"/api/users/{test_user_id}/role", headers=admin_headers, json={"role": "employee"})
        r = await c.post("/api/categories/", headers=user_headers, json={"name": "Illegal Cat"})
        log(r.status_code == 403, "POST /api/categories/ (forbidden)", f"{r.status_code}")

        # List categories
        r = await c.get("/api/categories/", headers=admin_headers)
        log(r.status_code == 200, "GET  /api/categories/", f"{r.status_code} — count={len(r.json())}")

        # Get specific category
        r = await c.get(f"/api/categories/{cat_id}", headers=admin_headers)
        log(r.status_code == 200, f"GET  /api/categories/{cat_id}", f"{r.status_code} — {r.json().get('name')}")

        # Update category
        r = await c.put(f"/api/categories/{cat_id}", headers=admin_headers, json={
            "description": "All electronic equipment"
        })
        log(r.status_code == 200, f"PUT  /api/categories/{cat_id}", f"{r.status_code} — desc={r.json().get('description')}")

        # Delete category
        r = await c.delete(f"/api/categories/{cat_id}", headers=admin_headers)
        log(r.status_code == 204, f"DEL  /api/categories/{cat_id}", f"{r.status_code}")

        # ── UNAUTHENTICATED ACCESS ────────────────────────
        print("\n🔒 UNAUTHENTICATED ACCESS (should all fail)")

        r = await c.get("/api/users/")
        log(r.status_code == 401, "GET  /api/users/ (no token)", f"{r.status_code}")

        r = await c.get("/api/departments/")
        log(r.status_code == 401, "GET  /api/departments/ (no token)", f"{r.status_code}")

        r = await c.get("/api/categories/")
        log(r.status_code == 401, "GET  /api/categories/ (no token)", f"{r.status_code}")

    # ── SUMMARY ───────────────────────────────────────
    total = PASSED + FAILED
    print(f"\n{'='*50}")
    print(f"  RESULTS: {PASSED}/{total} passed, {FAILED} failed")
    print(f"{'='*50}\n")

asyncio.run(main())
