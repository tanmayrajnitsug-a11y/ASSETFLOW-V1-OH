import client from './client';

// ══════════════════════════════════════════════════════════════════
// FALLBACK DUMMY DATA
// Used automatically when the backend is unreachable (network error
// or the server is not yet running).
// ══════════════════════════════════════════════════════════════════
const delay = (ms = 400) => new Promise((res) => setTimeout(res, ms));

const DUMMY_USER = {
  id: 1,
  name: 'Alex Morgan',
  email: 'admin@assetflow.io',
  role: 'Admin',
  avatar: null,
  organization: 'AssetFlow Corp',
};

const DUMMY_NOTIFICATIONS = [
  { id: 1, type: 'alert',    title: 'Maintenance Overdue',  message: 'Canon Projector maintenance is overdue by 2 days.',  time: '2 min ago',  read: false },
  { id: 2, type: 'approval', title: 'Allocation Approved',  message: 'Allocation request AL-003 approved by admin.',       time: '18 min ago', read: false },
  { id: 3, type: 'booking',  title: 'Booking Confirmed',    message: 'Conference Room A booked for Jul 14, 10:00–11:00.',  time: '45 min ago', read: false },
  { id: 4, type: 'transfer', title: 'Transfer Request',     message: 'AF-0033 transfer to Facilities dept pending approval.', time: '1 hr ago',read: true  },
  { id: 5, type: 'info',     title: 'Audit Cycle Started',  message: 'Q3 2026 Audit cycle initiated. 3 assets need verification.', time: '3 hr ago', read: true },
];

// ══════════════════════════════════════════════════════════════════
// HELPER — try real API, fall back to dummy on network/server error
// ══════════════════════════════════════════════════════════════════
async function tryApi(apiFn, fallbackFn) {
  try {
    return await apiFn();
  } catch (err) {
    // Only fall back for network errors or 5xx — not 4xx auth errors
    const status = err.response?.status;
    if (!status || status >= 500) {
      console.warn('[AssetFlow] API unavailable — using fallback data.', err.displayMessage || err.message);
      return fallbackFn();
    }
    throw err; // Re-throw 4xx so forms get proper error messages
  }
}

// ══════════════════════════════════════════════════════════════════
// AUTH SERVICES
// ══════════════════════════════════════════════════════════════════
export const authService = {
  login: async (email, password) => {
    return tryApi(
      async () => {
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);
        const { data } = await client.post('/auth/login', formData, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('assetflow_token', data.access_token);
        localStorage.setItem('assetflow_user', JSON.stringify(data.user));
        return { token: data.access_token, user: data.user };
      },
      async () => {
        await delay(800);
        if (email === 'admin@assetflow.io' && password === 'admin123') {
          const token = 'dummy_jwt_' + Date.now();
          localStorage.setItem('access_token', token);
          localStorage.setItem('assetflow_token', token);
          localStorage.setItem('assetflow_user', JSON.stringify(DUMMY_USER));
          return { token, user: DUMMY_USER };
        }
        const err = new Error('Invalid email or password.');
        err.response = { status: 401 };
        throw err;
      }
    );
  },

  signup: async (name, email, password) => {
    return tryApi(
      async () => {
        const { data } = await client.post('/auth/signup', { name, email, password });
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('assetflow_token', data.access_token);
        localStorage.setItem('assetflow_user', JSON.stringify(data.user));
        return { token: data.access_token, user: data.user };
      },
      async () => {
        await delay(800);
        const user = { ...DUMMY_USER, name, email, id: Date.now() };
        const token = 'dummy_jwt_' + Date.now();
        localStorage.setItem('access_token', token);
        localStorage.setItem('assetflow_token', token);
        localStorage.setItem('assetflow_user', JSON.stringify(user));
        return { token, user };
      }
    );
  },

  logout: async () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('assetflow_token');
    localStorage.removeItem('assetflow_user');
    try { await client.post('/auth/logout'); } catch { /* best-effort */ }
    return true;
  },

  getProfile: async () => {
    return tryApi(
      async () => { const { data } = await client.get('/auth/me'); return data; },
      async () => { await delay(300); return DUMMY_USER; }
    );
  },
};

// ══════════════════════════════════════════════════════════════════
// DASHBOARD SERVICES
// ══════════════════════════════════════════════════════════════════
export const dashboardService = {
  getDashboardStats: async () => {
    return tryApi(
      async () => { const { data } = await client.get('/dashboard/stats'); return data; },
      async () => {
        await delay(600);
        return {
          available_assets: 128, allocated_assets: 76, maintenance_today: 4,
          active_bookings: 9, pending_transfers: 3, upcoming_returns: 12,
          recent_activity: [
            { id: 1, action: 'Laptop AF-0191 allocated to Priya Shah', time: '27 min ago', type: 'allocation' },
            { id: 2, action: 'Booking confirmed — 3:00–4:00 PM, Conf Room B', time: '1 hr ago', type: 'booking' },
            { id: 3, action: 'Maintenance ticket raised for Canon Projector', time: '2 hr ago', type: 'maintenance' }
          ]
        };
      }
    );
  }
};

// ══════════════════════════════════════════════════════════════════
// ASSET SERVICES  — matches backend AssetOut schema
//   GET    /assets/           → list
//   GET    /assets/{id}       → detail
//   POST   /assets/           → create  (AssetCreate)
//   PUT    /assets/{id}       → update  (AssetUpdate)
// ══════════════════════════════════════════════════════════════════
export const assetService = {
  getAssets: async (filters = {}) => {
    return tryApi(
      async () => {
        const params = {};
        if (filters.search) params.search = filters.search;
        if (filters.category_id) params.category_id = filters.category_id;
        if (filters.status) params.status = filters.status;
        const { data } = await client.get('/assets/', { params });
        return Array.isArray(data) ? data : data.items ?? [];
      },
      async () => {
        await delay(500);
        let assets = [
          { id: 1, asset_tag: 'AF-0001', name: 'Dell Laptop', category_id: 1, department_id: 1, location: 'HQ Floor 2', status: 'available', purchase_cost: 1200, created_at: '2026-07-01T00:00:00', updated_at: '2026-07-01T00:00:00' },
          { id: 2, asset_tag: 'AF-0002', name: 'MacBook Pro', category_id: 1, department_id: 2, location: 'HQ Floor 3', status: 'allocated', purchase_cost: 2499, created_at: '2026-07-02T00:00:00', updated_at: '2026-07-02T00:00:00' },
        ];
        if (filters.search) {
          const q = filters.search.toLowerCase();
          assets = assets.filter((a) => a.name.toLowerCase().includes(q) || a.asset_tag.toLowerCase().includes(q));
        }
        if (filters.status) assets = assets.filter((a) => a.status === filters.status);
        if (filters.category_id) assets = assets.filter((a) => a.category_id === filters.category_id);
        return assets;
      }
    );
  },

  getAssetById: async (id) => {
    return tryApi(
      async () => { const { data } = await client.get(`/assets/${id}`); return data; },
      async () => {
        await delay(300);
        return { id: 1, asset_tag: 'AF-0001', name: 'Dell Laptop', category_id: 1, department_id: 1, location: 'HQ Floor 2', status: 'available' };
      }
    );
  },

  createAsset: async (payload) => {
    return tryApi(
      async () => { const { data } = await client.post('/assets/', payload); return data; },
      async () => { await delay(600); return { ...payload, id: Date.now(), asset_tag: `AF-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}` }; }
    );
  },

  updateAsset: async (id, payload) => {
    return tryApi(
      async () => { const { data } = await client.put(`/assets/${id}`, payload); return data; },
      async () => { await delay(400); return { id, ...payload }; }
    );
  },
};

// ══════════════════════════════════════════════════════════════════
// ORGANIZATION SERVICES — Departments, Categories & Users
// ══════════════════════════════════════════════════════════════════
export const organizationService = {
  // ── Departments ──────────────────────────────────────────────
  getDepartments: async () => {
    return tryApi(
      async () => {
        const { data } = await client.get('/departments/');
        return Array.isArray(data) ? data : data.items ?? [];
      },
      async () => {
        await delay(450);
        return [{ id: 1, name: 'Engineering', description: 'Engineering Dept' }];
      }
    );
  },

  createDepartment: async (payload) => {
    return tryApi(
      async () => { const { data } = await client.post('/departments/', payload); return data; },
      async () => { await delay(500); return { ...payload, id: Date.now() }; }
    );
  },

  updateDepartment: async (id, payload) => {
    return tryApi(
      async () => { const { data } = await client.put(`/departments/${id}`, payload); return data; },
      async () => { await delay(400); return { id, ...payload }; }
    );
  },

  deleteDepartment: async (id) => {
    return tryApi(
      async () => { await client.delete(`/departments/${id}`); return { success: true }; },
      async () => { await delay(300); return { success: true }; }
    );
  },

  // ── Categories ───────────────────────────────────────────────
  getCategories: async () => {
    return tryApi(
      async () => {
        const { data } = await client.get('/categories/');
        return Array.isArray(data) ? data : data.items ?? [];
      },
      async () => {
        await delay(350);
        return [
          { id: 1, name: 'Electronics' },
          { id: 2, name: 'Furniture' },
          { id: 3, name: 'Vehicles' },
        ];
      }
    );
  },

  // ── Users (employees) ────────────────────────────────────────
  getUsers: async (filters = {}) => {
    return tryApi(
      async () => {
        const { data } = await client.get('/users/', { params: filters });
        return Array.isArray(data) ? data : data.items ?? [];
      },
      async () => {
        await delay(450);
        return [{ id: 1, name: 'Alex Morgan', email: 'admin@assetflow.io', role: 'admin' }];
      }
    );
  },

  createEmployee: async (payload) => {
    return tryApi(
      async () => { const { data } = await client.post('/users/', payload); return data; },
      async () => { await delay(500); return { ...payload, id: Date.now() }; }
    );
  },

  updateEmployee: async (id, payload) => {
    return tryApi(
      async () => { const { data } = await client.put(`/users/${id}`, payload); return data; },
      async () => { await delay(400); return { id, ...payload }; }
    );
  },

  deleteEmployee: async (id) => {
    return tryApi(
      async () => { await client.delete(`/users/${id}`); return { success: true }; },
      async () => { await delay(300); return { success: true }; }
    );
  },

  // Legacy alias
  getEmployees: async (filters = {}) => organizationService.getUsers(filters),
};

// ══════════════════════════════════════════════════════════════════
// ALLOCATION SERVICES — matches backend AllocationOut / TransferOut
//   POST   /allocations/                     → allocate
//   GET    /allocations/                     → list
//   POST   /allocations/{id}/return          → return asset
//   POST   /allocations/transfers            → create transfer
//   GET    /allocations/transfers            → list transfers
//   POST   /allocations/transfers/{id}/approve  → approve
//   POST   /allocations/transfers/{id}/complete → complete
// ══════════════════════════════════════════════════════════════════
export const allocationService = {
  getAllocations: async (filters = {}) => {
    return tryApi(
      async () => {
        const params = {};
        if (filters.user_id) params.user_id = filters.user_id;
        if (filters.asset_id) params.asset_id = filters.asset_id;
        const { data } = await client.get('/allocations/', { params });
        return Array.isArray(data) ? data : data.items ?? [];
      },
      async () => {
        await delay(450);
        return [
          { id: 1, asset_id: 1, user_id: 1, allocated_by: 1, status: 'active', notes: 'New Joining', allocated_at: '2026-07-12T00:00:00', returned_at: null },
          { id: 2, asset_id: 2, user_id: 1, allocated_by: 1, status: 'returned', notes: 'Upgrade', allocated_at: '2026-07-10T00:00:00', returned_at: '2026-07-11T00:00:00' },
        ];
      }
    );
  },

  createAllocation: async (payload) => {
    return tryApi(
      async () => { const { data } = await client.post('/allocations/', payload); return data; },
      async () => { await delay(600); return { ...payload, id: Date.now(), status: 'active', allocated_at: new Date().toISOString() }; }
    );
  },

  returnAllocation: async (allocationId) => {
    return tryApi(
      async () => { const { data } = await client.post(`/allocations/${allocationId}/return`); return data; },
      async () => { await delay(400); return { id: allocationId, status: 'returned', returned_at: new Date().toISOString() }; }
    );
  },

  // ── Transfers ────────────────────────────────────────────────
  getTransfers: async (filters = {}) => {
    return tryApi(
      async () => {
        const params = {};
        if (filters.status_filter) params.status_filter = filters.status_filter;
        const { data } = await client.get('/allocations/transfers', { params });
        return Array.isArray(data) ? data : data.items ?? [];
      },
      async () => { await delay(400); return []; }
    );
  },

  createTransfer: async (payload) => {
    return tryApi(
      async () => { const { data } = await client.post('/allocations/transfers', payload); return data; },
      async () => { await delay(600); return { ...payload, id: Date.now(), status: 'pending' }; }
    );
  },

  approveTransfer: async (transferId) => {
    return tryApi(
      async () => { const { data } = await client.post(`/allocations/transfers/${transferId}/approve`); return data; },
      async () => { await delay(400); return { id: transferId, status: 'approved' }; }
    );
  },

  completeTransfer: async (transferId) => {
    return tryApi(
      async () => { const { data } = await client.post(`/allocations/transfers/${transferId}/complete`); return data; },
      async () => { await delay(400); return { id: transferId, status: 'completed' }; }
    );
  },
};

// ══════════════════════════════════════════════════════════════════
// BOOKING SERVICES — matches backend BookingOut schema
//   POST   /bookings/                   → create (BookingCreate)
//   GET    /bookings/                   → list
//   PATCH  /bookings/{id}/status?new_status=  → update status
// ══════════════════════════════════════════════════════════════════
export const bookingService = {
  getBookings: async (filters = {}) => {
    return tryApi(
      async () => {
        const params = {};
        if (filters.asset_id) params.asset_id = filters.asset_id;
        if (filters.user_id) params.user_id = filters.user_id;
        if (filters.status_filter) params.status_filter = filters.status_filter;
        const { data } = await client.get('/bookings/', { params });
        return Array.isArray(data) ? data : data.items ?? [];
      },
      async () => {
        await delay(450);
        const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
        const nextWeek = new Date(); nextWeek.setDate(nextWeek.getDate() + 7);
        return [
          { id: 1, asset_id: 1, user_id: 1, status: 'pending', start_date: tomorrow.toISOString(), end_date: nextWeek.toISOString(), purpose: 'Business trip', approved_by: null, created_at: new Date().toISOString() },
        ];
      }
    );
  },

  createBooking: async (payload) => {
    return tryApi(
      async () => { const { data } = await client.post('/bookings/', payload); return data; },
      async () => { await delay(600); return { ...payload, id: Date.now(), status: 'pending', created_at: new Date().toISOString() }; }
    );
  },

  updateBookingStatus: async (bookingId, newStatus) => {
    return tryApi(
      async () => { const { data } = await client.patch(`/bookings/${bookingId}/status`, null, { params: { new_status: newStatus } }); return data; },
      async () => { await delay(400); return { id: bookingId, status: newStatus }; }
    );
  },
};

// ══════════════════════════════════════════════════════════════════
// MAINTENANCE SERVICES — matches backend MaintenanceOut schema
//   POST   /maintenance/         → create (MaintenanceCreate)
//   GET    /maintenance/         → list
//   PATCH  /maintenance/{id}     → update (MaintenanceUpdate)
// ══════════════════════════════════════════════════════════════════
export const maintenanceService = {
  getTickets: async (filters = {}) => {
    return tryApi(
      async () => {
        const params = {};
        if (filters.asset_id) params.asset_id = filters.asset_id;
        if (filters.status_filter) params.status_filter = filters.status_filter;
        const { data } = await client.get('/maintenance/', { params });
        return Array.isArray(data) ? data : data.items ?? [];
      },
      async () => {
        await delay(450);
        return [
          { id: 1, asset_id: 1, reported_by: 1, issue_description: 'Laptop not starting', priority: 'high', status: 'pending', created_at: '2026-07-12T00:00:00', updated_at: '2026-07-12T00:00:00' },
          { id: 2, asset_id: 2, reported_by: 1, issue_description: 'Lamp replacement needed', priority: 'medium', status: 'approved', created_at: '2026-07-10T00:00:00', updated_at: '2026-07-10T00:00:00' },
          { id: 3, asset_id: 3, reported_by: 1, issue_description: 'Annual inspection', priority: 'low', status: 'resolved', created_at: '2026-07-05T00:00:00', updated_at: '2026-07-05T00:00:00', resolved_at: '2026-07-06T00:00:00' },
        ];
      }
    );
  },

  createTicket: async (payload) => {
    return tryApi(
      async () => { const { data } = await client.post('/maintenance/', payload); return data; },
      async () => { await delay(600); return { ...payload, id: Date.now(), status: 'pending', created_at: new Date().toISOString() }; }
    );
  },

  updateTicket: async (id, payload) => {
    return tryApi(
      async () => { const { data } = await client.patch(`/maintenance/${id}`, payload); return data; },
      async () => { await delay(300); return { id, ...payload }; }
    );
  },
};

// ══════════════════════════════════════════════════════════════════
// AUDIT SERVICES — matches backend AuditCycleOut / AuditItemOut
//   POST   /audits/cycles                → create cycle
//   GET    /audits/cycles                → list cycles
//   GET    /audits/cycles/{id}           → get cycle with items
//   PATCH  /audits/items/{id}/verify     → verify item
//   POST   /audits/cycles/{id}/close     → close cycle
// ══════════════════════════════════════════════════════════════════
export const auditService = {
  getCycles: async (filters = {}) => {
    return tryApi(
      async () => {
        const params = {};
        if (filters.department_id) params.department_id = filters.department_id;
        if (filters.is_closed !== undefined && filters.is_closed !== null) params.is_closed = filters.is_closed;
        const { data } = await client.get('/audits/cycles', { params });
        return Array.isArray(data) ? data : data.items ?? [];
      },
      async () => {
        await delay(450);
        return [
          { id: 1, department_id: 1, location: 'HQ Floor 2', start_date: '2026-07-01', end_date: '2026-07-31', created_by: 1, is_closed: false, created_at: '2026-07-01T00:00:00', closed_at: null, items: [
            { id: 1, audit_cycle_id: 1, asset_id: 1, verified_by: null, verification_status: null, remarks: null, verified_at: null },
            { id: 2, audit_cycle_id: 1, asset_id: 2, verified_by: 1, verification_status: 'verified', remarks: 'OK', verified_at: '2026-07-12T00:00:00' },
          ]},
        ];
      }
    );
  },

  getCycleById: async (cycleId) => {
    return tryApi(
      async () => { const { data } = await client.get(`/audits/cycles/${cycleId}`); return data; },
      async () => { await delay(300); return { id: cycleId, items: [] }; }
    );
  },

  createCycle: async (payload) => {
    return tryApi(
      async () => { const { data } = await client.post('/audits/cycles', payload); return data; },
      async () => { await delay(600); return { ...payload, id: Date.now(), is_closed: false, created_at: new Date().toISOString(), items: [] }; }
    );
  },

  verifyItem: async (itemId, payload) => {
    return tryApi(
      async () => { const { data } = await client.patch(`/audits/items/${itemId}/verify`, payload); return data; },
      async () => { await delay(400); return { id: itemId, ...payload, verified_at: new Date().toISOString() }; }
    );
  },

  closeCycle: async (cycleId) => {
    return tryApi(
      async () => { const { data } = await client.post(`/audits/cycles/${cycleId}/close`); return data; },
      async () => { await delay(400); return { id: cycleId, is_closed: true, closed_at: new Date().toISOString() }; }
    );
  },

  // Legacy aliases for old page code
  getAudits: async (filters) => auditService.getCycles(filters),
  createAudit: async (payload) => auditService.createCycle(payload),
};

// ══════════════════════════════════════════════════════════════════
// NOTIFICATION SERVICES
// ══════════════════════════════════════════════════════════════════
export const notificationService = {
  getNotifications: async () => {
    return tryApi(
      async () => { const { data } = await client.get('/notifications'); return Array.isArray(data) ? data : data.items ?? []; },
      async () => { await delay(300); return [...DUMMY_NOTIFICATIONS]; }
    );
  },
  markAllRead: async () => {
    return tryApi(
      async () => { const { data } = await client.post('/notifications/read-all'); return data; },
      async () => { await delay(200); return { success: true }; }
    );
  },
};

// ══════════════════════════════════════════════════════════════════
// REPORT SERVICES
// ══════════════════════════════════════════════════════════════════
export const reportService = {
  getReports: async () => {
    return tryApi(
      async () => { const { data } = await client.get('/reports'); return data; },
      async () => {
        await delay(600);
        return {
          allocationByDept:   [{ dept: 'Engineering', count: 48 }, { dept: 'Sales', count: 22 }, { dept: 'Design', count: 16 }],
          maintenanceFrequency:[{ month: 'Jan', count: 2 }, { month: 'Feb', count: 3 }, { month: 'Mar', count: 7 }],
        };
      }
    );
  },
};

// ══════════════════════════════════════════════════════════════════
// DEFAULT EXPORT — convenience namespace
// ══════════════════════════════════════════════════════════════════
export default {
  auth:          authService,
  dashboard:     dashboardService,
  assets:        assetService,
  organization:  organizationService,
  allocations:   allocationService,
  bookings:      bookingService,
  maintenance:   maintenanceService,
  audit:         auditService,
  notifications: notificationService,
  reports:       reportService,
};
