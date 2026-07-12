import client from './client';

// ──────────────────────────────────────────────
// DUMMY DATA (remove when backend is ready)
// ──────────────────────────────────────────────
const delay = (ms = 400) => new Promise((res) => setTimeout(res, ms));

const DUMMY_USER = {
  id: 1,
  name: 'Alex Morgan',
  email: 'admin@assetflow.io',
  role: 'Admin',
  avatar: null,
  organization: 'AssetFlow Corp',
};

const DUMMY_ASSETS = [
  { id: 'AF-0191', name: 'Dell Laptop', category: 'IT Equipment', status: 'Available', location: 'HQ Floor 2', assignedTo: null, purchaseDate: '2024-01-15', value: 1200 },
  { id: 'AF-0192', name: 'MacBook Pro 14"', category: 'IT Equipment', status: 'Allocated', location: 'Engineering', assignedTo: 'Priya Shah', purchaseDate: '2024-03-02', value: 2499 },
  { id: 'AF-0193', name: 'Office Chair (Ergonomic)', category: 'Furniture', status: 'Available', location: 'Warehouse', assignedTo: null, purchaseDate: '2023-11-10', value: 420 },
  { id: 'AF-0194', name: 'Canon Projector', category: 'AV Equipment', status: 'Maintenance', location: 'Conf Room A', assignedTo: null, purchaseDate: '2023-06-20', value: 800 },
  { id: 'AF-0195', name: 'iPhone 15 Pro', category: 'Mobile Devices', status: 'Allocated', location: 'Sales Dept', assignedTo: 'Arjun Dev', purchaseDate: '2024-05-01', value: 1099 },
  { id: 'AF-0196', name: 'HP Printer XL', category: 'IT Equipment', status: 'Retired', location: 'Storage', assignedTo: null, purchaseDate: '2021-03-14', value: 350 },
  { id: 'AF-0197', name: 'Standing Desk', category: 'Furniture', status: 'Available', location: 'HQ Floor 3', assignedTo: null, purchaseDate: '2024-02-28', value: 650 },
  { id: 'AF-0198', name: 'Sony Headphones', category: 'AV Equipment', status: 'Allocated', location: 'Design Dept', assignedTo: 'Meera Nair', purchaseDate: '2024-04-10', value: 280 },
  { id: 'AF-0199', name: '4K Monitor 32"', category: 'IT Equipment', status: 'Available', location: 'HQ Floor 2', assignedTo: null, purchaseDate: '2024-01-22', value: 750 },
  { id: 'AF-0200', name: 'UPS Battery Backup', category: 'IT Equipment', status: 'Available', location: 'Server Room', assignedTo: null, purchaseDate: '2023-09-05', value: 195 },
];

const DUMMY_DEPARTMENTS = [
  { id: 1, name: 'Engineering', head: 'Rohan Verma', employees: 24, assets: 48, location: 'HQ Floor 2' },
  { id: 2, name: 'Design', head: 'Meera Nair', employees: 8, assets: 16, location: 'HQ Floor 3' },
  { id: 3, name: 'Sales', head: 'Arjun Dev', employees: 15, assets: 22, location: 'HQ Floor 1' },
  { id: 4, name: 'Finance', head: 'Kavita Rao', employees: 6, assets: 12, location: 'HQ Floor 1' },
  { id: 5, name: 'Facilities', head: 'Suresh Patel', employees: 10, assets: 35, location: 'Warehouse' },
];

const DUMMY_EMPLOYEES = [
  { id: 'EMP-001', name: 'Rohan Verma', department: 'Engineering', role: 'Team Lead', email: 'rohan@assetflow.io', assets: 3, status: 'Active' },
  { id: 'EMP-002', name: 'Meera Nair', department: 'Design', role: 'Senior Designer', email: 'meera@assetflow.io', assets: 2, status: 'Active' },
  { id: 'EMP-003', name: 'Arjun Dev', department: 'Sales', role: 'Sales Manager', email: 'arjun@assetflow.io', assets: 2, status: 'Active' },
  { id: 'EMP-004', name: 'Priya Shah', department: 'Engineering', role: 'Full Stack Dev', email: 'priya@assetflow.io', assets: 1, status: 'Active' },
  { id: 'EMP-005', name: 'Kavita Rao', department: 'Finance', role: 'CFO', email: 'kavita@assetflow.io', assets: 1, status: 'Active' },
  { id: 'EMP-006', name: 'Suresh Patel', department: 'Facilities', role: 'Facilities Head', email: 'suresh@assetflow.io', assets: 4, status: 'Active' },
];

const DUMMY_ALLOCATIONS = [
  { id: 'AL-001', asset: 'MacBook Pro 14"', assetId: 'AF-0192', employee: 'Priya Shah', department: 'Engineering', allocatedOn: '2024-03-02', status: 'Active', notes: 'Primary work machine' },
  { id: 'AL-002', asset: 'iPhone 15 Pro', assetId: 'AF-0195', employee: 'Arjun Dev', department: 'Sales', allocatedOn: '2024-05-01', status: 'Active', notes: 'For client meetings' },
  { id: 'AL-003', asset: 'Sony Headphones', assetId: 'AF-0198', employee: 'Meera Nair', department: 'Design', allocatedOn: '2024-04-10', status: 'Active', notes: '' },
  { id: 'AL-004', asset: 'Dell Laptop', assetId: 'AF-0191', employee: 'Rohan Verma', department: 'Engineering', allocatedOn: '2024-01-15', status: 'Returned', notes: 'Returned for upgrade' },
];

const DUMMY_BOOKINGS = [
  { id: 'BK-001', resource: 'Conference Room A', bookedBy: 'Priya Shah', department: 'Engineering', date: '2026-07-14', startTime: '10:00', endTime: '11:00', status: 'Confirmed', purpose: 'Sprint Planning' },
  { id: 'BK-002', resource: 'Projector Unit 1', bookedBy: 'Arjun Dev', department: 'Sales', date: '2026-07-14', startTime: '14:00', endTime: '15:30', status: 'Confirmed', purpose: 'Client demo' },
  { id: 'BK-003', resource: 'Conference Room B', bookedBy: 'Meera Nair', department: 'Design', date: '2026-07-15', startTime: '09:00', endTime: '10:30', status: 'Pending', purpose: 'Design Review' },
  { id: 'BK-004', resource: 'Training Room', bookedBy: 'Suresh Patel', department: 'Facilities', date: '2026-07-16', startTime: '13:00', endTime: '17:00', status: 'Confirmed', purpose: 'Safety Orientation' },
  { id: 'BK-005', resource: 'Conference Room A', bookedBy: 'Kavita Rao', department: 'Finance', date: '2026-07-17', startTime: '11:00', endTime: '12:00', status: 'Cancelled', purpose: 'Budget Review' },
];

const DUMMY_MAINTENANCE = [
  { id: 'MN-0001', asset: 'Canon Projector', assetId: 'AF-0194', type: 'Repair', priority: 'High', assignedTo: 'Tech Team', reportedBy: 'Arjun Dev', reportedOn: '2026-07-10', status: 'In Progress', description: 'Lamp replacement needed, overheating issue' },
  { id: 'MN-0002', asset: 'HP Printer XL', assetId: 'AF-0196', type: 'Routine', priority: 'Low', assignedTo: 'Suresh Patel', reportedBy: 'Kavita Rao', reportedOn: '2026-07-08', status: 'Pending', description: 'Monthly maintenance check' },
  { id: 'MN-0003', asset: 'Dell Laptop', assetId: 'AF-0191', type: 'Repair', priority: 'Medium', assignedTo: 'IT Support', reportedBy: 'Rohan Verma', reportedOn: '2026-07-11', status: 'Approved', description: 'Keyboard keys sticking, minor issue' },
  { id: 'MN-0004', asset: 'UPS Battery Backup', assetId: 'AF-0200', type: 'Inspection', priority: 'Medium', assignedTo: 'Tech Team', reportedBy: 'Suresh Patel', reportedOn: '2026-07-05', status: 'Resolved', description: 'Annual battery inspection — passed' },
  { id: 'MN-0005', asset: '4K Monitor 32"', assetId: 'AF-0199', type: 'Repair', priority: 'High', assignedTo: 'IT Support', reportedBy: 'Priya Shah', reportedOn: '2026-07-12', status: 'Pending', description: 'Display flickering at startup' },
];

const DUMMY_AUDIT_LOGS = [
  { id: 'AUD-001', asset: 'MacBook Pro 14"', assetId: 'AF-0192', action: 'Allocation', performedBy: 'Admin', timestamp: '2026-07-11T09:30:00', details: 'Allocated to Priya Shah', verified: true },
  { id: 'AUD-002', asset: 'Canon Projector', assetId: 'AF-0194', action: 'Maintenance Request', performedBy: 'Arjun Dev', timestamp: '2026-07-10T14:15:00', details: 'Submitted maintenance ticket MN-0001', verified: true },
  { id: 'AUD-003', asset: 'HP Printer XL', assetId: 'AF-0196', action: 'Status Change', performedBy: 'Admin', timestamp: '2026-07-09T11:00:00', details: 'Status changed from Active → Retired', verified: false },
  { id: 'AUD-004', asset: 'iPhone 15 Pro', assetId: 'AF-0195', action: 'Transfer', performedBy: 'Rohan Verma', timestamp: '2026-07-08T16:45:00', details: 'Transferred from Engineering to Sales dept', verified: true },
  { id: 'AUD-005', asset: 'Standing Desk', assetId: 'AF-0197', action: 'Registration', performedBy: 'Admin', timestamp: '2026-07-07T10:00:00', details: 'New asset registered in system', verified: true },
  { id: 'AUD-006', asset: 'Dell Laptop', assetId: 'AF-0191', action: 'Maintenance Resolved', performedBy: 'IT Support', timestamp: '2026-07-06T13:30:00', details: 'Ticket MN-0003 resolved', verified: false },
];

const DUMMY_NOTIFICATIONS = [
  { id: 1, type: 'alert', title: 'Maintenance Overdue', message: 'Canon Projector (AF-0194) maintenance is overdue by 2 days.', time: '2 min ago', read: false },
  { id: 2, type: 'approval', title: 'Allocation Approved', message: 'Allocation request AL-003 approved by admin.', time: '18 min ago', read: false },
  { id: 3, type: 'booking', title: 'Booking Confirmed', message: 'Conference Room A booked for Jul 14, 10:00–11:00 AM.', time: '45 min ago', read: false },
  { id: 4, type: 'transfer', title: 'Transfer Request', message: 'AF-0033 transfer to Facilities dept pending your approval.', time: '1 hr ago', read: true },
  { id: 5, type: 'info', title: 'Audit Cycle Started', message: 'Q3 2026 Audit cycle has been initiated. 3 assets need verification.', time: '3 hr ago', read: true },
  { id: 6, type: 'alert', title: 'Asset Flagged', message: 'AF-0009 flagged for discrepancy during audit check.', time: '5 hr ago', read: true },
];

const DUMMY_DASHBOARD = {
  stats: {
    totalAssets: 128,
    allocated: 94,
    available: 26,
    maintenance: 8,
    activeBookings: 4,
    pendingTransfers: 3,
    upcomingReturns: 11,
  },
  recentActivity: [
    { id: 1, action: 'Laptop AF-0191 allocated to Priya Shah', time: '27 min ago', type: 'allocation' },
    { id: 2, action: 'Booking confirmed — 3:00 to 4:00 PM, Conf Room B', time: '1 hr ago', type: 'booking' },
    { id: 3, action: 'Maintenance ticket raised for Canon Projector', time: '2 hr ago', type: 'maintenance' },
    { id: 4, action: 'Transfer approved — AF-0033 to Facilities dept', time: '4 hr ago', type: 'transfer' },
    { id: 5, action: 'Audit discrepancy flagged — AF-0009 corrupted', time: '6 hr ago', type: 'audit' },
  ],
  categoryBreakdown: [
    { label: 'IT Equipment', value: 54, color: '#67D5FF' },
    { label: 'Furniture', value: 28, color: '#4CB9E7' },
    { label: 'AV Equipment', value: 22, color: '#22C55E' },
    { label: 'Mobile Devices', value: 14, color: '#F59E0B' },
    { label: 'Other', value: 10, color: '#7C8798' },
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

// ──────────────────────────────────────────────
// AUTH SERVICES
// ──────────────────────────────────────────────
export const authService = {
  login: async (email, password) => {
    await delay(800);
    if (email === 'admin@assetflow.io' && password === 'admin123') {
      const token = 'dummy_jwt_token_' + Date.now();
      return { token, user: DUMMY_USER };
    }
    throw new Error('Invalid credentials');
  },

  logout: async () => {
    await delay(200);
    localStorage.removeItem('assetflow_token');
    localStorage.removeItem('assetflow_user');
    return true;
  },

  getProfile: async () => {
    await delay(300);
    return DUMMY_USER;
  },
};

// ──────────────────────────────────────────────
// DASHBOARD SERVICES
// ──────────────────────────────────────────────
export const dashboardService = {
  getDashboardData: async () => {
    await delay(600);
    return DUMMY_DASHBOARD;
  },
};

// ──────────────────────────────────────────────
// ASSET SERVICES
// ──────────────────────────────────────────────
export const assetService = {
  getAssets: async (filters = {}) => {
    await delay(500);
    let assets = [...DUMMY_ASSETS];
    if (filters.search) {
      const q = filters.search.toLowerCase();
      assets = assets.filter((a) =>
        a.name.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q)
      );
    }
    if (filters.status) assets = assets.filter((a) => a.status === filters.status);
    if (filters.category) assets = assets.filter((a) => a.category === filters.category);
    return { data: assets, total: assets.length };
  },

  getAssetById: async (id) => {
    await delay(300);
    return DUMMY_ASSETS.find((a) => a.id === id) || null;
  },

  createAsset: async (payload) => {
    await delay(600);
    return { ...payload, id: `AF-${String(DUMMY_ASSETS.length + 1).padStart(4, '0')}` };
  },

  updateAsset: async (id, payload) => {
    await delay(400);
    return { id, ...payload };
  },

  deleteAsset: async (id) => {
    await delay(300);
    return { success: true };
  },
};

// ──────────────────────────────────────────────
// DEPARTMENT & EMPLOYEE SERVICES
// ──────────────────────────────────────────────
export const organizationService = {
  getDepartments: async () => {
    await delay(450);
    return DUMMY_DEPARTMENTS;
  },

  getEmployees: async (filters = {}) => {
    await delay(450);
    let employees = [...DUMMY_EMPLOYEES];
    if (filters.department) employees = employees.filter((e) => e.department === filters.department);
    return employees;
  },

  createDepartment: async (payload) => {
    await delay(500);
    return { ...payload, id: DUMMY_DEPARTMENTS.length + 1 };
  },

  createEmployee: async (payload) => {
    await delay(500);
    return { ...payload, id: `EMP-${String(DUMMY_EMPLOYEES.length + 1).padStart(3, '0')}` };
  },
};

// ──────────────────────────────────────────────
// ALLOCATION SERVICES
// ──────────────────────────────────────────────
export const allocationService = {
  getAllocations: async () => {
    await delay(450);
    return DUMMY_ALLOCATIONS;
  },

  createAllocation: async (payload) => {
    await delay(600);
    return { ...payload, id: `AL-${String(DUMMY_ALLOCATIONS.length + 1).padStart(3, '0')}`, status: 'Active' };
  },

  createTransferRequest: async (payload) => {
    await delay(600);
    return { ...payload, id: `TR-${Date.now()}`, status: 'Pending' };
  },
};

// ──────────────────────────────────────────────
// BOOKING SERVICES
// ──────────────────────────────────────────────
export const bookingService = {
  getBookings: async () => {
    await delay(450);
    return DUMMY_BOOKINGS;
  },

  createBooking: async (payload) => {
    await delay(600);
    return { ...payload, id: `BK-${String(DUMMY_BOOKINGS.length + 1).padStart(3, '0')}`, status: 'Pending' };
  },

  cancelBooking: async (id) => {
    await delay(300);
    return { success: true };
  },
};

// ──────────────────────────────────────────────
// MAINTENANCE SERVICES
// ──────────────────────────────────────────────
export const maintenanceService = {
  getTickets: async () => {
    await delay(450);
    return DUMMY_MAINTENANCE;
  },

  createTicket: async (payload) => {
    await delay(600);
    return { ...payload, id: `MN-${String(DUMMY_MAINTENANCE.length + 1).padStart(4, '0')}`, status: 'Pending' };
  },

  updateTicketStatus: async (id, status) => {
    await delay(300);
    return { id, status };
  },
};

// ──────────────────────────────────────────────
// AUDIT SERVICES
// ──────────────────────────────────────────────
export const auditService = {
  getAuditLogs: async () => {
    await delay(450);
    return DUMMY_AUDIT_LOGS;
  },

  runAuditCheck: async () => {
    await delay(1200);
    return { flagged: 2, verified: 4, message: '2 assets flagged — discrepancy report generated automatically.' };
  },
};

// ──────────────────────────────────────────────
// NOTIFICATION SERVICES
// ──────────────────────────────────────────────
export const notificationService = {
  getNotifications: async () => {
    await delay(300);
    return DUMMY_NOTIFICATIONS;
  },

  markAllRead: async () => {
    await delay(200);
    return { success: true };
  },
};

// ──────────────────────────────────────────────
// REPORT SERVICES
// ──────────────────────────────────────────────
export const reportService = {
  getReports: async () => {
    await delay(600);
    return {
      allocationByDept: [
        { dept: 'Engineering', count: 48 },
        { dept: 'Sales', count: 22 },
        { dept: 'Design', count: 16 },
        { dept: 'Finance', count: 12 },
        { dept: 'Facilities', count: 35 },
      ],
      maintenanceFrequency: [
        { month: 'Jan', count: 2 },
        { month: 'Feb', count: 3 },
        { month: 'Mar', count: 7 },
        { month: 'Apr', count: 4 },
        { month: 'May', count: 9 },
        { month: 'Jun', count: 5 },
        { month: 'Jul', count: 8 },
      ],
      mostUsedAssets: [
        { asset: 'Conference Room A', bookings: 42 },
        { asset: 'Projector Unit 1', bookings: 31 },
        { asset: 'Training Room', bookings: 27 },
        { asset: 'Conference Room B', bookings: 18 },
      ],
      lateReturns: [
        { asset: 'AF-0027 – Dell Laptop', daysLate: 8 },
        { asset: 'AF-0044 – Sony Camera', daysLate: 13 },
        { asset: 'Laptop AF-0031', daysLate: 97 },
      ],
      assetsDueForMaintenance: [
        { id: 'AF-0027', name: 'Forklift A', daysLeft: 4 },
        { id: 'AF-0031', name: 'Laptop 12"', daysLeft: 18 },
      ],
    };
  },
};

export default {
  auth: authService,
  dashboard: dashboardService,
  assets: assetService,
  organization: organizationService,
  allocations: allocationService,
  bookings: bookingService,
  maintenance: maintenanceService,
  audit: auditService,
  notifications: notificationService,
  reports: reportService,
};
