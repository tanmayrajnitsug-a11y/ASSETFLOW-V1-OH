import { useState, useEffect } from 'react';
import {
  Search, Plus, Edit2, AlertTriangle, X, Filter, Wrench, Clock
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
// Maintenance Form — matches backend MaintenanceCreate
// Fields: asset_id (int), issue_description (str), priority (str)
// reported_by is auto-set from JWT by the router
// ─────────────────────────────────────────────────────────────
function MaintenanceForm({ initialData, assetsList, onSubmit, onCancel, submitting, error, isEdit }) {
  const [form, setForm] = useState(initialData || {
    asset_id: '', issue_description: '', priority: 'medium', status: 'pending'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isEdit) {
      // Only send updatable fields
      onSubmit({
        issue_description: form.issue_description,
        priority: form.priority,
        status: form.status,
      });
    } else {
      onSubmit({
        asset_id: parseInt(form.asset_id),
        issue_description: form.issue_description,
        priority: form.priority,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {error && (
        <div style={{ padding: '10px 14px', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', color: 'var(--danger)', fontSize: '0.8125rem', borderRadius: 'var(--radius-md)' }}>
          {error}
        </div>
      )}

      {!isEdit && (
        <div>
          <label className="form-label">Asset *</label>
          <select className="form-input" required value={form.asset_id} onChange={e => setForm({...form, asset_id: e.target.value})}>
            <option value="">Select Asset...</option>
            {assetsList.map(a => <option key={a.id} value={a.id}>{a.asset_tag} — {a.name}</option>)}
          </select>
        </div>
      )}

      <div>
        <label className="form-label">Issue Description *</label>
        <textarea className="form-input" required rows={3} value={form.issue_description} onChange={e => setForm({...form, issue_description: e.target.value})} placeholder="Describe the issue in detail..." style={{ resize: 'vertical' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label className="form-label">Priority *</label>
          <select className="form-input" required value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        {isEdit && (
          <div>
            <label className="form-label">Status</label>
            <select className="form-input" required value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '12px', marginTop: '16px', justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-outline" onClick={onCancel} disabled={submitting}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? <Loader inline /> : isEdit ? 'Update' : 'Submit Request'}
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
  const [filterPriority, setFilterPriority] = useState('');

  const [tickets, setTickets] = useState([]);
  const [assetsList, setAssetsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');

  const [modalState, setModalState] = useState({ isOpen: false, type: null, data: null });
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    async function fetchDropdowns() {
      try {
        const assets = await assetService.getAssets({});
        setAssetsList(assets || []);
      } catch (err) {
        console.error('Failed to load assets', err);
      }
    }
    fetchDropdowns();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    setPageError('');
    try {
      const res = await maintenanceService.getTickets({});
      let data = res || [];
      if (filterPriority) data = data.filter(t => t.priority === filterPriority);
      if (search) {
        const q = search.toLowerCase();
        data = data.filter(t => (t.issue_description || '').toLowerCase().includes(q));
      }
      setTickets(data);
    } catch (err) {
      setPageError('Unable to load maintenance requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => { fetchTickets(); }, 300);
    return () => clearTimeout(timeout);
  }, [search, filterPriority]);

  const openModal = (type, data = null) => {
    setModalError('');
    if (data) data = { ...data, asset_id: String(data.asset_id) };
    setModalState({ isOpen: true, type, data });
  };
  const closeModal = () => { setModalState({ isOpen: false, type: null, data: null }); setModalError(''); };

  const getAssetName = (id) => { const a = assetsList.find(x => x.id === id); return a ? `${a.asset_tag} — ${a.name}` : `Asset #${id}`; };

  const handleSubmit = async (formData) => {
    setSubmitting(true);
    setModalError('');
    try {
      if (modalState.type === 'edit') {
        await maintenanceService.updateTicket(modalState.data.id, formData);
      } else {
        await maintenanceService.createTicket(formData);
      }
      closeModal();
      fetchTickets();
    } catch (err) {
      setModalError(err.displayMessage || 'Failed to save request.');
    } finally {
      setSubmitting(false);
    }
  };

  // Kanban columns — using backend enum values
  const pendingTickets = tickets.filter(t => t.status === 'pending' || t.status === 'approved');
  const inProgressTickets = tickets.filter(t => t.status === 'in_progress');
  const resolvedTickets = tickets.filter(t => t.status === 'resolved');

  const priorityColors = {
    low: 'var(--text-muted)',
    medium: '#F59E0B',
    high: '#EF4444',
    critical: '#B91C1C'
  };

  const priorityLabel = (p) => ({ low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' }[p] || p);

  const TicketCard = ({ ticket }) => (
    <div
      style={{
        background: 'var(--bg-element)', border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)', padding: '16px', marginBottom: '12px',
        boxShadow: 'var(--shadow-sm)', transition: 'var(--transition-fast)'
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
          {ticket.issue_description?.substring(0, 60)}{(ticket.issue_description?.length || 0) > 60 ? '…' : ''}
        </div>
        <button onClick={() => openModal('edit', ticket)} className="btn btn-outline" style={{ padding: '4px', minHeight: 0, border: 'none' }}><Edit2 size={14} /></button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
        <Wrench size={12} />
        {getAssetName(ticket.asset_id)}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 500, color: priorityColors[ticket.priority] || 'var(--text-muted)' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: priorityColors[ticket.priority] || 'var(--text-muted)' }} />
            {priorityLabel(ticket.priority)}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <Clock size={10} /> {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() : '—'}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Maintenance
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Track repairs, inspections, and maintenance requests.</p>
        </div>
        <button className="btn btn-primary" style={{ padding: '0 20px', height: '40px' }} onClick={() => openModal('add')}>
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
          <input type="text" className="form-input" placeholder="Search issues..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '36px', height: '38px', fontSize: '0.8125rem' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={16} color="var(--text-muted)" />
          <select className="form-input" style={{ width: '150px', height: '38px', fontSize: '0.8125rem' }} value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      {/* ── Kanban Board ── */}
      <div style={{ flex: 1, minHeight: 0, overflowX: 'auto' }}>
        {loading && tickets.length === 0 ? (
          <div style={{ padding: '60px 0' }}><Loader message="Loading maintenance board..." /></div>
        ) : (
          <div style={{ display: 'flex', gap: '24px', height: '100%', minWidth: '900px' }}>
            {/* Pending / Approved */}
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

            {/* In Progress */}
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

            {/* Resolved */}
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

      <Modal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={modalState.type === 'add' ? 'New Maintenance Request' : 'Edit Request'}
      >
        <MaintenanceForm
          initialData={modalState.data}
          assetsList={assetsList}
          onSubmit={handleSubmit}
          onCancel={closeModal}
          submitting={submitting}
          error={modalError}
          isEdit={modalState.type === 'edit'}
        />
      </Modal>
    </div>
  );
}
