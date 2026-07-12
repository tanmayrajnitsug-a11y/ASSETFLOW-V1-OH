"""
End-to-end integration test for AssetFlow API.
Tests the full workflow: signup -> login -> create dept -> create category ->
register asset -> allocate -> return -> book -> maintenance -> audit -> reports -> notifications.
"""
import asyncio
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import httpx

BASE = "http://127.0.0.1:8000/api"

async def main():
    async with httpx.AsyncClient(timeout=15) as c:
        results = []

        def check(name, r, expect=None):
            ok = r.status_code in (expect or [200, 201])
            status = "✅" if ok else "❌"
            results.append((status, name, r.status_code))
            print(f"  {status} {name} → {r.status_code}")
            if not ok:
                print(f"     Response: {r.text[:300]}")
            return r

        # ── Auth ──────────────────────────────────────
        print("\n═══ AUTH ═══")
        r = check("Signup", await c.post(f"{BASE}/auth/signup", json={
            "name": "IntegTest", "email": "integ@test.com", "password": "Test@1234"
        }), [200, 201, 400])  # 400 if user exists

        r = check("Login", await c.post(f"{BASE}/auth/login", data={
            "username": "admin@assetflow.com", "password": "Admin@1234"
        }, headers={"Content-Type": "application/x-www-form-urlencoded"}))
        token = r.json().get("access_token", "")
        headers = {"Authorization": f"Bearer {token}"}

        r = check("Get Me", await c.get(f"{BASE}/auth/me", headers=headers))
        user_id = r.json().get("id", 1)

        # ── Departments ───────────────────────────────
        print("\n═══ DEPARTMENTS ═══")
        r = check("Create Department", await c.post(f"{BASE}/departments/", json={
            "name": "Engineering", "description": "Eng dept"
        }, headers=headers), [200, 201, 400])
        dept_id = r.json().get("id", 1)

        check("List Departments", await c.get(f"{BASE}/departments/", headers=headers))

        # ── Categories ────────────────────────────────
        print("\n═══ CATEGORIES ═══")
        r = check("Create Category", await c.post(f"{BASE}/categories/", json={
            "name": "Laptops", "description": "Laptop devices"
        }, headers=headers), [200, 201, 400])
        cat_id = r.json().get("id", 1)

        check("List Categories", await c.get(f"{BASE}/categories/", headers=headers))

        # ── Assets ────────────────────────────────────
        print("\n═══ ASSETS ═══")
        r = check("Register Asset", await c.post(f"{BASE}/assets/", json={
            "name": "Dell XPS 15",
            "asset_tag": "AF-INTEG-001",
            "category_id": cat_id,
            "department_id": dept_id,
            "status": "available",
            "location": "HQ Floor 2",
            "purchase_cost": 1500.00
        }, headers=headers), [200, 201])
        asset_id = r.json().get("id", 1)

        check("List Assets", await c.get(f"{BASE}/assets/", headers=headers))
        check("Get Asset", await c.get(f"{BASE}/assets/{asset_id}", headers=headers))

        # ── Allocations ───────────────────────────────
        print("\n═══ ALLOCATIONS ═══")
        r = check("Allocate Asset", await c.post(f"{BASE}/allocations/", json={
            "asset_id": asset_id,
            "user_id": user_id,
            "allocated_by": user_id,
            "status": "active",
            "notes": "Integration test allocation"
        }, headers=headers), [200, 201])
        alloc_id = r.json().get("id", 1)

        check("List Allocations", await c.get(f"{BASE}/allocations/", headers=headers))
        check("Return Asset", await c.post(f"{BASE}/allocations/{alloc_id}/return", headers=headers))

        # ── Bookings ──────────────────────────────────
        print("\n═══ BOOKINGS ═══")
        r = check("Create Booking", await c.post(f"{BASE}/bookings/", json={
            "asset_id": asset_id,
            "user_id": user_id,
            "status": "pending",
            "start_date": "2026-08-01T09:00:00",
            "end_date": "2026-08-01T17:00:00",
            "purpose": "Integration test"
        }, headers=headers), [200, 201])
        booking_id = r.json().get("id", 1)

        check("List Bookings", await c.get(f"{BASE}/bookings/", headers=headers))
        check("Update Booking Status", await c.patch(
            f"{BASE}/bookings/{booking_id}/status",
            params={"new_status": "approved"},
            headers=headers
        ))

        # ── Maintenance ───────────────────────────────
        print("\n═══ MAINTENANCE ═══")
        r = check("Create Maintenance", await c.post(f"{BASE}/maintenance/", json={
            "asset_id": asset_id,
            "reported_by": user_id,
            "issue_description": "Screen flickering during integration test",
            "priority": "high"
        }, headers=headers), [200, 201])
        maint_id = r.json().get("id", 1)

        check("List Maintenance", await c.get(f"{BASE}/maintenance/", headers=headers))
        check("Update Maintenance", await c.patch(
            f"{BASE}/maintenance/{maint_id}",
            params={"new_status": "approved"},
            headers=headers
        ))

        # ── Audits ────────────────────────────────────
        print("\n═══ AUDITS ═══")
        r = check("Create Audit Cycle", await c.post(f"{BASE}/audits/cycles", json={
            "department_id": dept_id,
            "location": "HQ Floor 2",
            "start_date": "2026-07-01",
            "end_date": "2026-07-31",
            "created_by": user_id
        }, headers=headers), [200, 201])
        cycle_id = r.json().get("id", 1)

        check("List Audit Cycles", await c.get(f"{BASE}/audits/cycles", headers=headers))

        # ── Reports ───────────────────────────────────
        print("\n═══ REPORTS ═══")
        check("Dashboard KPIs", await c.get(f"{BASE}/reports/dashboard", headers=headers))
        check("Asset Utilization", await c.get(f"{BASE}/reports/asset-utilization", headers=headers))
        check("Maintenance Freq", await c.get(f"{BASE}/reports/maintenance-frequency", headers=headers))
        check("Dept Allocation", await c.get(f"{BASE}/reports/department-allocation", headers=headers))
        check("Booking Heatmap", await c.get(f"{BASE}/reports/booking-heatmap", headers=headers))
        check("All Reports", await c.get(f"{BASE}/reports", headers=headers))

        # ── Notifications ─────────────────────────────
        print("\n═══ NOTIFICATIONS ═══")
        check("List Notifications", await c.get(f"{BASE}/notifications/", headers=headers))
        check("Mark All Read", await c.post(f"{BASE}/notifications/read-all", headers=headers))
        check("Activity Logs", await c.get(f"{BASE}/notifications/activity-logs", headers=headers))

        # ── Dashboard ─────────────────────────────────
        print("\n═══ DASHBOARD ═══")
        check("Dashboard Stats", await c.get(f"{BASE}/dashboard/stats", headers=headers))

        # ── Users ─────────────────────────────────────
        print("\n═══ USERS ═══")
        check("List Users", await c.get(f"{BASE}/users/", headers=headers))

        # ── Summary ───────────────────────────────────
        print("\n" + "═"*50)
        passed = sum(1 for s, _, _ in results if s == "✅")
        failed = sum(1 for s, _, _ in results if s == "❌")
        print(f"  TOTAL: {len(results)} tests | ✅ {passed} passed | ❌ {failed} failed")
        if failed:
            print("\n  Failed tests:")
            for s, name, code in results:
                if s == "❌":
                    print(f"    ❌ {name} → {code}")
        print("═"*50)

asyncio.run(main())
