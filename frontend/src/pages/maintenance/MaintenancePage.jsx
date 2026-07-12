import { useState, useEffect } from 'react';
import {
  Search, Plus, Edit2, Trash2, AlertTriangle, X, Filter, Wrench, Clock, User
} from 'lucide-react';
import { maintenanceService, assetService, organizationService } from '../../api/services';
import Loader from '../../components/Loader';
import StatusBadge from '../../components/StatusBadge';

// ─────────────────────────────────────────────────────────────
// Reusable Modal Component
// ─────────────────────────────────────────────────────────────
function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(9, 11, 13, 0.8)', backdropFilter: 'blur(8px)',
      padding: '24px'
    }}>
      <div className="card anim-fade-in" style={{
        width: '100%', maxWidth: '550px', background: 'var(--bg-card)',
        border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-modal)', overflow: 'hidden'
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)'
        }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'Cormorant Garamond, serif' }}>
            {title}
          </h3>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
            padding: '4px', borderRadius: '4px', display: 'flex'
          }} onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
            <X size={20} />
          </button>
        </div>
        <div style={{ padding: '24px', maxHeight: '75vh', overflowY: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Maintenance Form Component
// ─────────────────────────────────────────────────────────────
function MaintenanceForm({ initialData, assetsList, employeesList, onSubmit, onCancel, submitting, error }) {
  const [form, setForm] = useState(initialData || {
    asset: '', title: '', description: '', priority: 'Medium', status: 'Pending', assigned_to: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {error && (
        <div style={{ padding: '10px 14px', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', color: 'var(--danger)', fontSize: '0.8125rem', borderRadius: 'var(--radius-md)' }}>
          {error}
        </div>
      )}
      
      <div>
        <label className="form-label">Asset</label>
        <select className="form-input" required value={form.asset} onChange={e => setForm({...form, asset: e.target.value})}>
          <option value="">Select Asset...</option>
          {assetsList.map(a => <option key={a.id} value={a.name}>{a.name} ({a.tag})</option>)}
        </select>
      </div>

      <div>
        <label className="form-label">Issue Title</label>
        <input type="text" className="form-input" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Laptop not starting" />
      </div>

      <div>
        <label className="form-label">Description</label>
        <textarea className="form-input" required rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Describe the issue in detail..." style={{ resize: 'vertical' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label className="form-label">Priority</label>
          <select className="form-input" required value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>
        <div>
          <label className="form-label">Assigned To</label>
          <select className="form-input" required value={form.assigned_to} onChange={e => setForm({...form, assigned_to: e.target.value})}>
            <option value="">Select Assignee...</option>
            <option value="IT Support">IT Support (General)</option>
            <option value="Tech Team">Tech Team (General)</option>
            {employeesList.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
          </select>
        </div>
      </div>
      
      {initialData && (
        <div>
          <label className="form-label">Status</label>
          <select className="form-input" required value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px', marginTop: '16px', justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-outline" onClick={onCancel} disabled={submitting}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? <Loader inline /> : 'Submit Request'}
        </button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Page Component (Kanban Board)
// ─────────────────────────────────────────────────────────────
export default function MaintenancePage() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  
  // Data State
  const [tickets, setTickets] = useState([]);
  const [assetsList, setAssetsList] = useState([]);
  const [employeesList, setEmployeesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  
  // Modal State
  const [modalState, setModalState] = useState({ isOpen: false, type: null, data: null });
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  // Initial Load (Dropdowns)
  useEffect(() => {
    async function fetchDropdowns() {
      try {
        const [assetsRes, empsRes] = await Promise.all([
          assetService.getAssets(), 
          organizationService.getEmployees()
        ]);
        setAssetsList(assetsRes.data || []);
        setEmployeesList(empsRes || []);
      } catch (err) {
        console.error('Failed to load dropdown data', err);
      }
    }
    fetchDropdowns();
  }, []);

  // Fetch Tickets
  const fetchTickets = async () => {
    setLoading(true);
    setPageError('');
    try {
      const res = await maintenanceService.getTickets({ 
        search, 
        status: filterStatus,
        priority: filterPriority
      });
      setTickets(res || []);
    } catch (err) {
      setPageError('Unable to load maintenance requests. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    const timeout = setTimeout(() => {
      fetchTickets();
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, filterStatus, filterPriority]);

  // Handlers
  const openModal = (type, data = null) => {
    setModalError('');
    setModalState({ isOpen: true, type, data });
  };
  
  const closeModal = () => {
    setModalState({ isOpen: false, type: null, data: null });
    setModalError('');
  };

  const handleSubmit = async (formData) => {
    setSubmitting(true);
    setModalError('');
    try {
      if (modalState.type === 'edit') {
        await maintenanceService.updateTicket(modalState.data.id, formData);
      } else {
        await maintenanceService.createTicket({
          ...formData,
          created_at: new Date().toISOString().split('T')[0] // auto set date
        });
      }
      closeModal();
      fetchTickets(); 
    } catch (err) {
      setModalError('Failed to save request. Please check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this maintenance ticket?')) return;
    setLoading(true);
    try {
      await maintenanceService.deleteTicket(id);
      fetchTickets(); 
    } catch (err) {
      setPageError('Failed to delete ticket.');
      setLoading(false);
    }
  };

  // Kanban Columns
  const pendingTickets = tickets.filter(t => t.status === 'Pending');
  const inProgressTickets = tickets.filter(t => t.status === 'In Progress');
  const resolvedTickets = tickets.filter(t => t.status === 'Resolved');

  const TicketCard = ({ ticket }) => {
    const priorityColors = {
      Low: 'var(--text-muted)',
      Medium: '#F59E0B', // amber
      High: '#EF4444',   // red
      Critical: '#B91C1C' // dark red
    };

    return (
      <div 
        style={{ 
          background: 'var(--bg-element)', border: '1px solid var(--border-subtle)', 
          borderRadius: 'var(--radius-lg)', padding: '16px', marginBottom: '12px',
          boxShadow: 'var(--shadow-sm)', transition: 'var(--transition-fast)'
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'var(--border)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'var(--border-subtle)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
            {ticket.title}
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button onClick={() => openModal('edit', ticket)} className="btn btn-outline" style={{ padding: '4px', minHeight: 0, border: 'none' }}><Edit2 size={14} /></button>
            <button onClick={() => handleDelete(ticket.id)} className="btn btn-outline" style={{ padding: '4px', minHeight: 0, border: 'none', color: 'var(--danger)' }}><Trash2 size={14} /></button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
          <Wrench size={12} />
          {ticket.asset}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 500, color: priorityColors[ticket.priority] || 'var(--text-muted)' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: priorityColors[ticket.priority] || 'var(--text-muted)' }} />
              {ticket.priority}
            </div>
            <div style={{ width: 1, height: 10, background: 'var(--border-subtle)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <User size={10} /> {ticket.assigned_to}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <Clock size={10} /> {ticket.created_at}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)' }}>
      {/* ── Header ── */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{
            fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem',
            fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px'
          }}>
            Maintenance
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Track repairs, inspections, and maintenance requests.
          </p>
        </div>
        <button 
          className="btn btn-primary" style={{ padding: '0 20px', height: '40px' }}
          onClick={() => openModal('add')}
        >
          <Plus size={16} style={{ marginRight: '8px' }} />
          New Request
        </button>
      </div>

      {pageError && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', padding: '16px 20px', borderRadius: 'var(--radius-md)', marginBottom: '24px', color: 'var(--danger)' }}>
          <AlertTriangle size={18} />
          <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{pageError}</span>
        </div>
      )}

      {/* ── Filters ── */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" className="form-input" placeholder="Search issues, assets..." 
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '36px', height: '38px', fontSize: '0.8125rem' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={16} color="var(--text-muted)" />
          <select className="form-input" style={{ width: '150px', height: '38px', fontSize: '0.8125rem' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>
          <select className="form-input" style={{ width: '150px', height: '38px', fontSize: '0.8125rem' }} value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
            <option value="">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>
      </div>

      {/* ── Kanban Board ── */}
      <div style={{ flex: 1, minHeight: 0, overflowX: 'auto' }}>
        {loading && tickets.length === 0 ? (
          <div style={{ padding: '60px 0' }}><Loader message="Loading maintenance board..." /></div>
        ) : (
          <div style={{ display: 'flex', gap: '24px', height: '100%', minWidth: '900px' }}>
            
            {/* Column: Pending */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h4 style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B' }} />
                  Pending
                </h4>
                <span style={{ fontSize: '0.75rem', background: 'var(--bg-element)', padding: '2px 8px', borderRadius: '12px', color: 'var(--text-muted)' }}>{pendingTickets.length}</span>
              </div>
              <div style={{ padding: '16px', overflowY: 'auto', flex: 1 }}>
                {pendingTickets.map(t => <TicketCard key={t.id} ticket={t} />)}
                {pendingTickets.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', textAlign: 'center', marginTop: '20px' }}>No pending requests.</div>}
              </div>
            </div>

            {/* Column: In Progress */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h4 style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }} />
                  In Progress
                </h4>
                <span style={{ fontSize: '0.75rem', background: 'var(--bg-element)', padding: '2px 8px', borderRadius: '12px', color: 'var(--text-muted)' }}>{inProgressTickets.length}</span>
              </div>
              <div style={{ padding: '16px', overflowY: 'auto', flex: 1 }}>
                {inProgressTickets.map(t => <TicketCard key={t.id} ticket={t} />)}
                {inProgressTickets.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', textAlign: 'center', marginTop: '20px' }}>No active requests.</div>}
              </div>
            </div>

            {/* Column: Resolved */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h4 style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} />
                  Resolved
                </h4>
                <span style={{ fontSize: '0.75rem', background: 'var(--bg-element)', padding: '2px 8px', borderRadius: '12px', color: 'var(--text-muted)' }}>{resolvedTickets.length}</span>
              </div>
              <div style={{ padding: '16px', overflowY: 'auto', flex: 1 }}>
                {resolvedTickets.map(t => <TicketCard key={t.id} ticket={t} />)}
                {resolvedTickets.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', textAlign: 'center', marginTop: '20px' }}>No resolved requests.</div>}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* ── Modals ── */}
      <Modal 
        isOpen={modalState.isOpen} 
        onClose={closeModal} 
        title={modalState.type === 'add' ? 'New Maintenance Request' : 'Edit Request'}
      >
        <MaintenanceForm 
          initialData={modalState.data} 
          assetsList={assetsList}
          employeesList={employeesList}
          onSubmit={handleSubmit} 
          onCancel={closeModal} 
          submitting={submitting} 
          error={modalError}
        />
      </Modal>
    </div>
  );
}
