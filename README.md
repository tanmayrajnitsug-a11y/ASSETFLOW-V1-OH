# AssetFlow ERP

A centralized ERP platform for tracking, allocating, and maintaining physical assets and shared resources.

## Tech Stack

| Layer     | Technology                   |
|-----------|------------------------------|
| Frontend  | React + Tailwind CSS (Vite)  |
| Backend   | FastAPI (Python)             |
| Database  | SQLite (demo) / PostgreSQL   |
| Charts    | Recharts                     |
| Auth      | JWT (python-jose + passlib)  |

## Project Structure

```
ASSETFLOW-V1-OH/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entrypoint
│   │   ├── config.py            # Settings from .env
│   │   ├── database.py          # SQLAlchemy async setup
│   │   ├── security.py          # JWT + password hashing + role guards
│   │   ├── models/              # SQLAlchemy ORM models
│   │   │   ├── user.py
│   │   │   ├── department.py
│   │   │   ├── category.py
│   │   │   ├── asset.py
│   │   │   ├── allocation.py
│   │   │   ├── transfer.py
│   │   │   ├── booking.py
│   │   │   ├── maintenance.py
│   │   │   ├── audit.py
│   │   │   ├── notification.py
│   │   │   └── activity_log.py
│   │   ├── schemas/             # Pydantic request/response schemas
│   │   │   ├── user.py
│   │   │   ├── department.py
│   │   │   ├── category.py
│   │   │   ├── asset.py
│   │   │   ├── allocation.py
│   │   │   ├── booking.py
│   │   │   ├── maintenance.py
│   │   │   └── audit.py
│   │   ├── services/            # Business logic layer
│   │   │   ├── auth_service.py
│   │   │   ├── asset_service.py
│   │   │   ├── allocation_service.py
│   │   │   ├── booking_service.py
│   │   │   ├── maintenance_service.py
│   │   │   └── audit_service.py
│   │   └── routers/             # API route handlers
│   │       ├── auth.py
│   │       ├── users.py
│   │       ├── departments.py
│   │       ├── categories.py
│   │       ├── assets.py
│   │       ├── allocations.py
│   │       ├── bookings.py
│   │       ├── maintenance.py
│   │       ├── audits.py
│   │       ├── reports.py
│   │       └── notifications.py
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.js        # Axios instance with JWT interceptors
│   │   │   └── services.js      # API service modules per domain
│   │   ├── context/
│   │   │   └── AuthContext.jsx   # Auth state management
│   │   ├── components/
│   │   │   ├── AppLayout.jsx     # Sidebar + content layout
│   │   │   └── ProtectedRoute.jsx
│   │   ├── pages/
│   │   │   ├── auth/             # Login / Signup
│   │   │   ├── dashboard/        # KPI cards + quick actions
│   │   │   ├── organization/     # Departments, Categories, Employee Directory
│   │   │   ├── assets/           # Asset registration & search
│   │   │   ├── allocations/      # Allocation & transfer management
│   │   │   ├── bookings/         # Resource booking calendar
│   │   │   ├── maintenance/      # Maintenance request workflow
│   │   │   ├── audits/           # Audit cycles & verification
│   │   │   ├── reports/          # Analytics & charts
│   │   │   └── notifications/    # Notifications & activity logs
│   │   ├── App.jsx               # Root component with routing
│   │   ├── main.jsx              # Entry point
│   │   └── index.css             # Tailwind CSS
│   ├── vite.config.js
│   ├── .env.example
│   └── package.json
│
└── README.md                     # This file
```

## Quick Start

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate            # Windows
pip install -r requirements.txt
cp .env.example .env             # Edit .env values
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install                      # Already done
cp .env.example .env
npm run dev                      # → http://localhost:5173
```

### Default Admin

On first startup, the backend seeds an admin account:
- **Email:** `admin@assetflow.com`
- **Password:** `Admin@1234`

## User Roles

| Role             | Capabilities |
|------------------|-------------|
| **Admin**        | Full system access. Manages org setup, creates audit cycles, assigns roles. |
| **Asset Manager**| Registers assets, approves transfers/maintenance, manages allocations. |
| **Department Head** | Views department assets, approves dept transfers, books resources. |
| **Employee**     | Views own assets, books resources, raises maintenance & transfer requests. |

> **Note:** Signup creates an Employee account only. Admins promote users to other roles from the Employee Directory.

## Architecture Highlights

- **3-Layer Backend:** Routers → Services → Models (clean separation of concerns)
- **Role-based guards:** `require_roles()` dependency ensures secure access control
- **Async everything:** SQLAlchemy async sessions with `aiosqlite` / `asyncpg`
- **JWT auth:** Stateless tokens with configurable expiry
- **Conflict rules:** Double-allocation blocked at service layer; overlap validation for bookings
- **Module-per-feature:** Both frontend and backend are organized by domain feature
