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

const DUMMY_DEPARTMENTS = [
  { id: 1, name: 'Engineering',  head: 'Rohan Verma',   employees: 24, assets: 48, location: 'HQ Floor 2', status: 'Active' },
  { id: 2, name: 'Design',       head: 'Meera Nair',    employees: 8,  assets: 16, location: 'HQ Floor 3', status: 'Active' },
  { id: 3, name: 'Sales',        head: 'Arjun Dev',     employees: 15, assets: 22, location: 'HQ Floor 1', status: 'Active' },
  { id: 4, name: 'Finance',      head: 'Kavita Rao',    employees: 6,  assets: 12, location: 'HQ Floor 1', status: 'Active' },
  { id: 5, name: 'Facilities',   head: 'Suresh Patel',  employees: 10, assets: 35, location: 'Warehouse',  status: 'Active' },
];

const DUMMY_EMPLOYEES = [
  { id: 1, name: 'Rohan Verma',  email: 'rohan@assetflow.io',  department: 'Engineering', role: 'Team Lead',      assets: 3, status: 'Active' },
  { id: 2, name: 'Meera Nair',   email: 'meera@assetflow.io',  department: 'Design',       role: 'Sr. Designer',  assets: 2, status: 'Active' },
  { id: 3, name: 'Arjun Dev',    email: 'arjun@assetflow.io',  department: 'Sales',        role: 'Sales Manager', assets: 2, status: 'Active' },
  { id: 4, name: 'Priya Shah',   email: 'priya@assetflow.io',  department: 'Engineering', role: 'Full Stack Dev', assets: 1, status: 'Active' },
  { id: 5, name: 'Kavita Rao',   email: 'kavita@assetflow.io', department: 'Finance',      role: 'CFO',           assets: 1, status: 'Active' },
  { id: 6, name: 'Suresh Patel', email: 'suresh@assetflow.io', department: 'Facilities',   role: 'Facilities Head', assets: 4, status: 'Active' },
];

const DUMMY_ASSETS = [
  { id: 'AF-0191', name: 'Dell Laptop',          category: 'IT Equipment',  status: 'Available',   location: 'HQ Floor 2', assignedTo: null,         purchaseDate: '2024-01-15', value: 1200 },
  { id: 'AF-0192', name: 'MacBook Pro 14"',      category: 'IT Equipment',  status: 'Allocated',   location: 'Engineering', assignedTo: 'Priya Shah',  purchaseDate: '2024-03-02', value: 2499 },
  { id: 'AF-0193', name: 'Office Chair',         category: 'Furniture',     status: 'Available',   location: 'Warehouse',   assignedTo: null,          purchaseDate: '2023-11-10', value: 420 },
  { id: 'AF-0194', name: 'Canon Projector',      category: 'AV Equipment',  status: 'Maintenance', location: 'Conf Room A', assignedTo: null,          purchaseDate: '2023-06-20', value: 800 },
  { id: 'AF-0195', name: 'iPhone 15 Pro',        category: 'Mobile Devices',status: 'Allocated',   location: 'Sales Dept',  assignedTo: 'Arjun Dev',   purchaseDate: '2024-05-01', value: 1099 },
  { id: 'AF-0196', name: 'HP Printer XL',        category: 'IT Equipment',  status: 'Retired',     location: 'Storage',     assignedTo: null,          purchaseDate: '2021-03-14', value: 350 },
  { id: 'AF-0197', name: 'Standing Desk',        category: 'Furniture',     status: 'Available',   location: 'HQ Floor 3',  assignedTo: null,          purchaseDate: '2024-02-28', value: 650 },
  { id: 'AF-0198', name: 'Sony Headphones',      category: 'AV Equipment',  status: 'Allocated',   location: 'Design Dept', assignedTo: 'Meera Nair',  purchaseDate: '2024-04-10', value: 280 },
  { id: 'AF-0199', name: '4K Monitor 32"',       category: 'IT Equipment',  status: 'Available',   location: 'HQ Floor 2',  assignedTo: null,          purchaseDate: '2024-01-22', value: 750 },
  { id: 'AF-0200', name: 'UPS Battery Backup',   category: 'IT Equipment',  status: 'Available',   location: 'Server Room', assignedTo: null,          purchaseDate: '2023-09-05', value: 195 },
];

const DUMMY_ALLOCATIONS = [
  { id: 'AL-001', asset: 'MacBook Pro 14"', assetId: 'AF-0192', employee: 'Priya Shah',  department: 'Engineering', allocatedOn: '2024-03-02', status: 'Active',   notes: 'Primary work machine' },
  { id: 'AL-002', asset: 'iPhone 15 Pro',   assetId: 'AF-0195', employee: 'Arjun Dev',   department: 'Sales',       allocatedOn: '2024-05-01', status: 'Active',   notes: 'For client meetings' },
  { id: 'AL-003', asset: 'Sony Headphones', assetId: 'AF-0198', employee: 'Meera Nair',  department: 'Design',      allocatedOn: '2024-04-10', status: 'Active',   notes: '' },
  { id: 'AL-004', asset: 'Dell Laptop',     assetId: 'AF-0191', employee: 'Rohan Verma', department: 'Engineering', allocatedOn: '2024-01-15', status: 'Returned', notes: 'Returned for upgrade' },
];

const DUMMY_BOOKINGS = [
  { id: 'BK-001', resource: 'Conference Room A', bookedBy: 'Priya Shah',  department: 'Engineering', date: '2026-07-14', startTime: '10:00', endTime: '11:00', status: 'Confirmed', purpose: 'Sprint Planning' },
  { id: 'BK-002', resource: 'Projector Unit 1',  bookedBy: 'Arjun Dev',   department: 'Sales',       date: '2026-07-14', startTime: '14:00', endTime: '15:30', status: 'Confirmed', purpose: 'Client demo' },
  { id: 'BK-003', resource: 'Conference Room B', bookedBy: 'Meera Nair',  department: 'Design',      date: '2026-07-15', startTime: '09:00', endTime: '10:30', status: 'Pending',   purpose: 'Design Review' },
  { id: 'BK-004', resource: 'Training Room',     bookedBy: 'Suresh Patel',department: 'Facilities',  date: '2026-07-16', startTime: '13:00', endTime: '17:00', status: 'Confirmed', purpose: 'Safety Orientation' },
  { id: 'BK-005', resource: 'Conference Room A', bookedBy: 'Kavita Rao',  department: 'Finance',     date: '2026-07-17', startTime: '11:00', endTime: '12:00', status: 'Cancelled', purpose: 'Budget Review' },
];

const DUMMY_MAINTENANCE = [
  { id: 'MN-0001', asset: 'Canon Projector', assetId: 'AF-0194', type: 'Repair',    priority: 'High',   assignedTo: 'Tech Team',  reportedBy: 'Arjun Dev',   reportedOn: '2026-07-10', status: 'In Progress', description: 'Lamp replacement needed' },
  { id: 'MN-0002', asset: 'HP Printer XL',   assetId: 'AF-0196', type: 'Routine',   priority: 'Low',    assignedTo: 'Suresh Patel', reportedBy: 'Kavita Rao', reportedOn: '2026-07-08', status: 'Pending',     description: 'Monthly maintenance check' },
  { id: 'MN-0003', asset: 'Dell Laptop',      assetId: 'AF-0191', type: 'Repair',    priority: 'Medium', assignedTo: 'IT Support',  reportedBy: 'Rohan Verma', reportedOn: '2026-07-11', status: 'Approved',    description: 'Keyboard keys sticking' },
  { id: 'MN-0004', asset: 'UPS Battery',      assetId: 'AF-0200', type: 'Inspection',priority: 'Medium', assignedTo: 'Tech Team',   reportedBy: 'Suresh Patel',reportedOn: '2026-07-05', status: 'Resolved',   description: 'Annual battery inspection' },
  { id: 'MN-0005', asset: '4K Monitor 32"',   assetId: 'AF-0199', type: 'Repair',    priority: 'High',   assignedTo: 'IT Support',  reportedBy: 'Priya Shah',  reportedOn: '2026-07-12', status: 'Pending',    description: 'Display flickering' },
];

const DUMMY_AUDIT_LOGS = [
  { id: 'AUD-001', asset: 'MacBook Pro 14"', assetId: 'AF-0192', action: 'Allocation',          performedBy: 'Admin',      timestamp: '2026-07-11T09:30:00', details: 'Allocated to Priya Shah',               verified: true  },
  { id: 'AUD-002', asset: 'Canon Projector', assetId: 'AF-0194', action: 'Maintenance Request', performedBy: 'Arjun Dev',   timestamp: '2026-07-10T14:15:00', details: 'Submitted maintenance ticket MN-0001',  verified: true  },
  { id: 'AUD-003', asset: 'HP Printer XL',   assetId: 'AF-0196', action: 'Status Change',       performedBy: 'Admin',      timestamp: '2026-07-09T11:00:00', details: 'Status changed Active → Retired',       verified: false },
  { id: 'AUD-004', asset: 'iPhone 15 Pro',   assetId: 'AF-0195', action: 'Transfer',            performedBy: 'Rohan Verma',timestamp: '2026-07-08T16:45:00', details: 'Transferred Engineering → Sales',       verified: true  },
  { id: 'AUD-005', asset: 'Standing Desk',   assetId: 'AF-0197', action: 'Registration',        performedBy: 'Admin',      timestamp: '2026-07-07T10:00:00', details: 'New asset registered in system',         verified: true  },
];

const DUMMY_NOTIFICATIONS = [
  { id: 1, type: 'alert',    title: 'Maintenance Overdue',  message: 'Canon Projector maintenance is overdue by 2 days.',  time: '2 min ago',  read: false },
  { id: 2, type: 'approval', title: 'Allocation Approved',  message: 'Allocation request AL-003 approved by admin.',       time: '18 min ago', read: false },
  { id: 3, type: 'booking',  title: 'Booking Confirmed',    message: 'Conference Room A booked for Jul 14, 10:00–11:00.',  time: '45 min ago', read: false },
  { id: 4, type: 'transfer', title: 'Transfer Request',     message: 'AF-0033 transfer to Facilities dept pending approval.', time: '1 hr ago',read: true  },
  { id: 5, type: 'info',     title: 'Audit Cycle Started',  message: 'Q3 2026 Audit cycle initiated. 3 assets need verification.', time: '3 hr ago', read: true },
];

const DUMMY_DASHBOARD = {
  stats: {
    available_assets:   128,
    allocated_assets:   94,
    maintenance_today:  8,
    active_bookings:    4,
    pending_transfers:  3,
    upcoming_returns:   11,
  },
  recent_activity: [
    { id: 1, action: 'Laptop AF-0191 allocated to Priya Shah',          time: '27 min ago', type: 'allocation'  },
    { id: 2, action: 'Booking confirmed — 3:00–4:00 PM, Conf Room B',   time: '1 hr ago',   type: 'booking'     },
    { id: 3, action: 'Maintenance ticket raised for Canon Projector',   time: '2 hr ago',   type: 'maintenance' },
    { id: 4, action: 'Transfer approved — AF-0033 to Facilities dept',  time: '4 hr ago',   type: 'transfer'    },
    { id: 5, action: 'Audit discrepancy flagged — AF-0009 corrupted',   time: '6 hr ago',   type: 'audit'       },
  ],
  categoryBreakdown: [
    { label: 'IT Equipment',   value: 54, color: '#67D5FF' },
    { label: 'Furniture',      value: 28, color: '#4CB9E7' },
    { label: 'AV Equipment',   value: 22, color: '#22C55E' },
    { label: 'Mobile Devices', value: 14, color: '#F59E0B' },
    { label: 'Other',          value: 10, color: '#7C8798' },
  ],
  maintenanceTrend: [
    { month: 'Feb', tickets: 3 },
    { month: 'Mar', tickets: 7 },
    { month: 'Apr', tickets: 4 },
    { month: 'May', tickets: 9 },
    { month: 'Jun', tickets: 5 },
    { month: 'Jul', tickets: 8 },
  ],
};

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
  /**
   * Login via POST /auth/login
   * Response: { access_token, token_type, user }
   */
  login: async (email, password) => {
    return tryApi(
      async () => {
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);
        const { data } = await client.post('/auth/login', formData, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
        // Store with the key the backend expects
        localStorage.setItem('access_token', data.access_token);
        // Also write legacy key so AuthContext / Navbar keep working
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

  /**
   * Sign up via POST /auth/signup
   * Response: { access_token, token_type, user }
   */
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
      async () => {
        const { data } = await client.get('/auth/me');
        return data;
      },
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
      async () => {
        const { data } = await client.get('/dashboard/stats');
        return data;
      },
      async () => {
        await delay(600);
        return {
          available_assets: 128,
          allocated_assets: 76,
          maintenance_today: 4,
          active_bookings: 9,
          pending_transfers: 3,
          upcoming_returns: 12,
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
// ASSET SERVICES
// ══════════════════════════════════════════════════════════════════
export const assetService = {
  getAssets: async (filters = {}) => {
    return tryApi(
      async () => {
        const { data } = await client.get('/assets', { params: filters });
        return { data: data.items ?? data, total: data.total ?? data.length };
      },
      async () => {
        await delay(500);
        let assets = [
          { id: 1, tag: 'AF-0012', name: 'Dell Laptop', category: 'Electronics', department: 'Engineering', location: 'HQ Floor 2', status: 'Available' },
          { id: 2, tag: 'AF-0013', name: 'MacBook Pro', category: 'Electronics', department: 'Design', location: 'HQ Floor 3', status: 'Allocated' }
        ];
        if (filters.search) {
          const q = filters.search.toLowerCase();
          assets = assets.filter((a) =>
            a.name.toLowerCase().includes(q) ||
            a.tag.toLowerCase().includes(q) ||
            a.category.toLowerCase().includes(q)
          );
        }
        if (filters.status)   assets = assets.filter((a) => a.status   === filters.status);
        if (filters.category) assets = assets.filter((a) => a.category === filters.category);
        if (filters.department) assets = assets.filter((a) => a.department === filters.department);
        return { data: assets, total: assets.length };
      }
    );
  },

  getAssetById: async (id) => {
    return tryApi(
      async () => { const { data } = await client.get(`/assets/${id}`); return data; },
      async () => { 
        await delay(300); 
        return { id: 1, tag: 'AF-0012', name: 'Dell Laptop', category: 'Electronics', department: 'Engineering', location: 'HQ Floor 2', status: 'Available' };
      }
    );
  },

  createAsset: async (payload) => {
    return tryApi(
      async () => { const { data } = await client.post('/assets', payload); return data; },
      async () => { await delay(600); return { ...payload, id: Date.now(), tag: `AF-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}` }; }
    );
  },

  updateAsset: async (id, payload) => {
    return tryApi(
      async () => { const { data } = await client.put(`/assets/${id}`, payload); return data; },
      async () => { await delay(400); return { id, ...payload }; }
    );
  },

  deleteAsset: async (id) => {
    return tryApi(
      async () => { await client.delete(`/assets/${id}`); return { success: true }; },
      async () => { await delay(300); return { success: true }; }
    );
  },
};

// ══════════════════════════════════════════════════════════════════
// ORGANIZATION SERVICES — Departments & Employees
// ══════════════════════════════════════════════════════════════════
export const organizationService = {
  // ── Departments ──────────────────────────────────────────────
  getDepartments: async () => {
    return tryApi(
      async () => {
        const { data } = await client.get('/departments');
        return Array.isArray(data) ? data : data.items ?? [];
      },
      async () => { 
        await delay(450); 
        return [
          { id: 1, name: 'Engineering', head: 'John Doe', status: 'Active' }
        ]; 
      }
    );
  },

  createDepartment: async (payload) => {
    return tryApi(
      async () => { const { data } = await client.post('/departments', payload); return data; },
      async () => { await delay(500); return { ...payload, id: Date.now(), status: 'Active' }; }
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

  // ── Employees ────────────────────────────────────────────────
  getEmployees: async (filters = {}) => {
    return tryApi(
      async () => {
        const { data } = await client.get('/employees', { params: filters });
        return Array.isArray(data) ? data : data.items ?? [];
      },
      async () => {
        await delay(450);
        let employees = [
          { id: 1, name: 'Alex Morgan', email: 'alex@test.com', department: 'Engineering', status: 'Active' }
        ];
        if (filters.department) employees = employees.filter((e) => e.department === filters.department);
        return employees;
      }
    );
  },

  createEmployee: async (payload) => {
    return tryApi(
      async () => { const { data } = await client.post('/employees', payload); return data; },
      async () => { await delay(500); return { ...payload, id: Date.now(), status: 'Active' }; }
    );
  },

  updateEmployee: async (id, payload) => {
    return tryApi(
      async () => { const { data } = await client.put(`/employees/${id}`, payload); return data; },
      async () => { await delay(400); return { id, ...payload }; }
    );
  },

  deleteEmployee: async (id) => {
    return tryApi(
      async () => { await client.delete(`/employees/${id}`); return { success: true }; },
      async () => { await delay(300); return { success: true }; }
    );
  },
};

// ══════════════════════════════════════════════════════════════════
// ALLOCATION SERVICES
// ══════════════════════════════════════════════════════════════════
export const allocationService = {
  getAllocations: async (filters = {}) => {
    return tryApi(
      async () => { const { data } = await client.get('/allocations', { params: filters }); return Array.isArray(data) ? data : data.items ?? []; },
      async () => {
        await delay(450);
        let allocations = [
          { id: 1, asset: 'Dell Laptop', asset_tag: 'AF-0012', employee: 'Alex Morgan', department: 'Engineering', allocated_date: '2026-07-12', status: 'Allocated', reason: 'New Joining' },
          { id: 2, asset: 'MacBook Pro', asset_tag: 'AF-0013', employee: 'Priya Shah', department: 'Design', allocated_date: '2026-07-10', status: 'Returned', reason: 'Upgrade' }
        ];
        if (filters.search) {
          const q = filters.search.toLowerCase();
          allocations = allocations.filter((a) =>
            a.asset.toLowerCase().includes(q) ||
            a.asset_tag.toLowerCase().includes(q) ||
            a.employee.toLowerCase().includes(q)
          );
        }
        if (filters.department) allocations = allocations.filter((a) => a.department === filters.department);
        if (filters.status) allocations = allocations.filter((a) => a.status === filters.status);
        return allocations;
      }
    );
  },
  createAllocation: async (payload) => {
    return tryApi(
      async () => { const { data } = await client.post('/allocations', payload); return data; },
      async () => { await delay(600); return { ...payload, id: `AL-${String(DUMMY_ALLOCATIONS.length + 1).padStart(3, '0')}`, status: 'Active' }; }
    );
  },
  createTransferRequest: async (payload) => {
    return tryApi(
      async () => { const { data } = await client.post('/allocations/transfer', payload); return data; },
      async () => { await delay(600); return { ...payload, id: `TR-${Date.now()}`, status: 'Pending' }; }
    );
  },
};

// ══════════════════════════════════════════════════════════════════
// BOOKING SERVICES
// ══════════════════════════════════════════════════════════════════
export const bookingService = {
  getBookings: async (filters = {}) => {
    return tryApi(
      async () => { const { data } = await client.get('/bookings', { params: filters }); return Array.isArray(data) ? data : data.items ?? []; },
      async () => {
        await delay(450);
        let bookings = [
          { id: 1, asset: 'Projector Unit 1', employee: 'Alex Morgan', booking_date: '2026-07-15', start_time: '10:00', end_time: '11:00', purpose: 'Presentation', status: 'Approved' },
          { id: 2, asset: 'Conference Room B', employee: 'Meera Nair', booking_date: '2026-07-16', start_time: '09:00', end_time: '10:30', purpose: 'Design Sync', status: 'Pending' }
        ];
        if (filters.search) {
          const q = filters.search.toLowerCase();
          bookings = bookings.filter((b) =>
            b.asset.toLowerCase().includes(q) ||
            b.employee.toLowerCase().includes(q) ||
            b.purpose.toLowerCase().includes(q)
          );
        }
        if (filters.booking_date) bookings = bookings.filter((b) => b.booking_date === filters.booking_date);
        if (filters.status) bookings = bookings.filter((b) => b.status === filters.status);
        return bookings;
      }
    );
  },
  createBooking: async (payload) => {
    return tryApi(
      async () => { const { data } = await client.post('/bookings', payload); return data; },
      async () => { await delay(600); return { ...payload, id: Date.now(), status: payload.status || 'Pending' }; }
    );
  },
  updateBooking: async (id, payload) => {
    return tryApi(
      async () => { const { data } = await client.put(`/bookings/${id}`, payload); return data; },
      async () => { await delay(400); return { id, ...payload }; }
    );
  },
  deleteBooking: async (id) => {
    return tryApi(
      async () => { await client.delete(`/bookings/${id}`); return { success: true }; },
      async () => { await delay(300); return { success: true }; }
    );
  },
};

// ══════════════════════════════════════════════════════════════════
// MAINTENANCE SERVICES
// ══════════════════════════════════════════════════════════════════
export const maintenanceService = {
  getTickets: async (filters = {}) => {
    return tryApi(
      async () => { const { data } = await client.get('/maintenance', { params: filters }); return Array.isArray(data) ? data : data.items ?? []; },
      async () => {
        await delay(450);
        let tickets = [
          { id: 1, asset: 'Dell Laptop', title: 'Laptop not starting', description: 'Black screen after power on.', priority: 'High', status: 'Pending', assigned_to: 'IT Support', created_at: '2026-07-12' },
          { id: 2, asset: 'Canon Projector', title: 'Lamp replacement needed', description: 'Projector lamp is completely burnt out.', priority: 'Medium', status: 'In Progress', assigned_to: 'Tech Team', created_at: '2026-07-10' },
          { id: 3, asset: 'UPS Battery', title: 'Annual Inspection', description: 'Regular battery inspection and testing.', priority: 'Low', status: 'Resolved', assigned_to: 'Suresh Patel', created_at: '2026-07-05' }
        ];
        if (filters.search) {
          const q = filters.search.toLowerCase();
          tickets = tickets.filter((t) =>
            t.asset.toLowerCase().includes(q) ||
            t.title.toLowerCase().includes(q) ||
            t.description.toLowerCase().includes(q)
          );
        }
        if (filters.status) tickets = tickets.filter((t) => t.status === filters.status);
        if (filters.priority) tickets = tickets.filter((t) => t.priority === filters.priority);
        return tickets;
      }
    );
  },
  createTicket: async (payload) => {
    return tryApi(
      async () => { const { data } = await client.post('/maintenance', payload); return data; },
      async () => { await delay(600); return { ...payload, id: Date.now(), status: payload.status || 'Pending' }; }
    );
  },
  updateTicket: async (id, payload) => {
    return tryApi(
      async () => { const { data } = await client.put(`/maintenance/${id}`, payload); return data; },
      async () => { await delay(300); return { id, ...payload }; }
    );
  },
  deleteTicket: async (id) => {
    return tryApi(
      async () => { await client.delete(`/maintenance/${id}`); return { success: true }; },
      async () => { await delay(300); return { success: true }; }
    );
  },
};

// ══════════════════════════════════════════════════════════════════
// AUDIT SERVICES
// ══════════════════════════════════════════════════════════════════
export const auditService = {
  getAudits: async (filters = {}) => {
    return tryApi(
      async () => { const { data } = await client.get('/audits', { params: filters }); return Array.isArray(data) ? data : data.items ?? []; },
      async () => { 
        await delay(450); 
        let audits = [
          { id: 1, audit_name: 'Quarterly Audit Q3', asset: 'Dell Laptop', asset_tag: 'AF-0012', department: 'Engineering', expected_location: 'HQ Floor 2', verification_status: 'Found', remarks: 'Verified successfully', verified_by: 'Admin', verified_at: '2026-07-12' },
          { id: 2, audit_name: 'Quarterly Audit Q3', asset: 'MacBook Pro', asset_tag: 'AF-0013', department: 'Design', expected_location: 'HQ Floor 3', verification_status: 'Missing', remarks: 'Not found at desk', verified_by: 'Admin', verified_at: '2026-07-12' }
        ];
        if (filters.search) {
          const q = filters.search.toLowerCase();
          audits = audits.filter((a) =>
            a.audit_name.toLowerCase().includes(q) ||
            a.asset.toLowerCase().includes(q) ||
            a.asset_tag.toLowerCase().includes(q)
          );
        }
        if (filters.department) audits = audits.filter((a) => a.department === filters.department);
        if (filters.verification_status) audits = audits.filter((a) => a.verification_status === filters.verification_status);
        return audits;
      }
    );
  },
  createAudit: async (payload) => {
    return tryApi(
      async () => { const { data } = await client.post('/audits', payload); return data; },
      async () => { await delay(600); return { ...payload, id: Date.now(), verified_by: 'Admin', verified_at: new Date().toISOString().split('T')[0] }; }
    );
  },
  updateAudit: async (id, payload) => {
    return tryApi(
      async () => { const { data } = await client.put(`/audits/${id}`, payload); return data; },
      async () => { await delay(300); return { id, ...payload, verified_by: 'Admin', verified_at: new Date().toISOString().split('T')[0] }; }
    );
  },
  deleteAudit: async (id) => {
    return tryApi(
      async () => { await client.delete(`/audits/${id}`); return { success: true }; },
      async () => { await delay(300); return { success: true }; }
    );
  }
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
          allocationByDept:   [{ dept: 'Engineering', count: 48 }, { dept: 'Sales', count: 22 }, { dept: 'Design', count: 16 }, { dept: 'Finance', count: 12 }, { dept: 'Facilities', count: 35 }],
          maintenanceFrequency:[{ month: 'Jan', count: 2 }, { month: 'Feb', count: 3 }, { month: 'Mar', count: 7 }, { month: 'Apr', count: 4 }, { month: 'May', count: 9 }, { month: 'Jun', count: 5 }, { month: 'Jul', count: 8 }],
          mostUsedAssets:     [{ asset: 'Conference Room A', bookings: 42 }, { asset: 'Projector Unit 1', bookings: 31 }, { asset: 'Training Room', bookings: 27 }],
          lateReturns:        [{ asset: 'AF-0027 – Dell Laptop', daysLate: 8 }, { asset: 'AF-0044 – Sony Camera', daysLate: 13 }],
          assetsDueForMaintenance: [{ id: 'AF-0027', name: 'Forklift A', daysLeft: 4 }],
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
