import { useState, useEffect } from 'react';
import {
  Search, Plus, Edit2, AlertTriangle, X, Filter, Users, RotateCcw
} from 'lucide-react';
import { allocationService, assetService, organizationService } from '../../api/services';
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
        width: '100%', maxWidth: '500px', background: 'var(--bg-card)',
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
        <div style={{ padding: '24px', maxHeight: '70vh', overflowY: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Allocation Form — matches backend AllocationCreate
// ─────────────────────────────────────────────────────────────
function AllocationForm({ assetsList, usersList, onSubmit, onCancel, submitting, error }) {
  const [form, setForm] = useState({ asset_id: '', user_id: '', notes: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      asset_id: parseInt(form.asset_id),
      user_id: parseInt(form.user_id),
      status: 'active',
      notes: form.notes || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {error && (
        <div style={{ padding: '10px 14px', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', color: 'var(--danger)', fontSize: '0.8125rem', borderRadius: 'var(--radius-md)' }}>
          {error}
        </div>
      )}
      <div>
        <label className="form-label">Asset *</label>
        <select className="form-input" required value={form.asset_id} onChange={e => setForm({ ...form, asset_id: e.target.value })}>
          <option value="">Select Asset...</option>
          {assetsList.filter(a => a.status === 'available').map(a => <option key={a.id} value={a.id}>{a.asset_tag} — {a.name}</option>)}
        </select>
      </div>
      <div>
        <label className="form-label">Assign To *</label>
        <select className="form-input" required value={form.user_id} onChange={e => setForm({ ...form, user_id: e.target.value })}>
          <option value="">Select User...</option>
          {usersList.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
        </select>
      </div>
      <div>
        <label className="form-label">Notes</label>
        <input type="text" className="form-input" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="e.g. New Joining" />
      </div>
      <div style={{ display: 'flex', gap: '12px', marginTop: '16px', justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-outline" onClick={onCancel} disabled={submitting}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? <Loader inline /> : 'Allocate'}
        </button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Page Component
// ─────────────────────────────────────────────────────────────
export default function AllocationsPage() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [allocations, setAllocations] = useState([]);
  const [assetsList, setAssetsList] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  // Load dropdowns
  useEffect(() => {
    async function fetchDropdowns() {
      try {
        const [assets, users] = await Promise.all([
          assetService.getAssets({}),
          organizationService.getUsers(),
        ]);
        setAssetsList(assets || []);
        setUsersList(users || []);
      } catch (err) {
        console.error('Failed to load dropdown data', err);
      }
    }
    fetchDropdowns();
  }, []);

  // Fetch allocations
  const fetchAllocations = async () => {
    setLoading(true);
    setPageError('');
    try {
      const res = await allocationService.getAllocations({});
      let data = res || [];
      // Client-side filter by status
      if (filterStatus) data = data.filter(a => a.status === filterStatus);
      // Client-side search by notes
      if (search) {
        const q = search.toLowerCase();
        data = data.filter(a => (a.notes || '').toLowerCase().includes(q) || String(a.asset_id).includes(q) || String(a.user_id).includes(q));
      }
      setAllocations(data);
    } catch (err) {
      setPageError('Unable to load allocations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => { fetchAllocations(); }, 300);
    return () => clearTimeout(timeout);
  }, [search, filterStatus]);

  // Resolve IDs
  const getAssetTag = (id) => { const a = assetsList.find(x => x.id === id); return a ? a.asset_tag : `#${id}`; };
  const getAssetName = (id) => { const a = assetsList.find(x => x.id === id); return a ? a.name : `Asset #${id}`; };
  const getUserName = (id) => { const u = usersList.find(x => x.id === id); return u ? u.name : `User #${id}`; };

  const handleSubmit = async (formData) => {
    setSubmitting(true);
    setModalError('');
    try {
      await allocationService.createAllocation(formData);
      setModalOpen(false);
      fetchAllocations();
      // Refresh available assets
      const assets = await assetService.getAssets({});
      setAssetsList(assets || []);
    } catch (err) {
      setModalError(err.displayMessage || 'Failed to create allocation.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReturn = async (allocationId) => {
    if (!window.confirm('Return this asset?')) return;
    setLoading(true);
    try {
      await allocationService.returnAllocation(allocationId);
      fetchAllocations();
    } catch (err) {
      setPageError(err.displayMessage || 'Failed to return asset.');
      setLoading(false);
    }
  };

  const statusLabel = (s) => ({ active: 'Active', returned: 'Returned' }[s] || s);

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
      {/* ── Header ── */}
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Asset Allocations
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Manage and track asset assignments.</p>
        </div>
        <button className="btn btn-primary" style={{ padding: '0 20px', height: '40px' }} onClick={() => { setModalError(''); setModalOpen(true); }}>
          <Plus size={16} style={{ marginRight: '8px' }} />
          New Allocation
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
          <input type="text" className="form-input" placeholder="Search by notes or ID..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '36px', height: '38px', fontSize: '0.8125rem' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={16} color="var(--text-muted)" />
          <select className="form-input" style={{ width: '150px', height: '38px', fontSize: '0.8125rem' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="returned">Returned</option>
          </select>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading && allocations.length === 0 ? (
          <div style={{ padding: '60px 0' }}><Loader message="Loading allocations..." /></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '16px 24px', fontWeight: 500 }}>Asset</th>
                  <th style={{ padding: '16px 24px', fontWeight: 500 }}>Tag</th>
                  <th style={{ padding: '16px 24px', fontWeight: 500 }}>Assigned To</th>
                  <th style={{ padding: '16px 24px', fontWeight: 500 }}>Allocated On</th>
                  <th style={{ padding: '16px 24px', fontWeight: 500 }}>Notes</th>
                  <th style={{ padding: '16px 24px', fontWeight: 500 }}>Status</th>
                  <th style={{ padding: '16px 24px', fontWeight: 500, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {allocations.length === 0 && !loading && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>No allocations found.</td></tr>
                )}
                {allocations.map(alloc => (
                  <tr key={alloc.id} style={{ borderBottom: '1px solid var(--border-subtle)', opacity: loading ? 0.5 : 1 }}>
                    <td style={{ padding: '16px 24px', fontWeight: 500, color: 'var(--text-primary)' }}>{getAssetName(alloc.asset_id)}</td>
                    <td style={{ padding: '16px 24px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{getAssetTag(alloc.asset_id)}</td>
                    <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--accent-bg)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Users size={12} />
                        </div>
                        {getUserName(alloc.user_id)}
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>{alloc.allocated_at ? new Date(alloc.allocated_at).toLocaleDateString() : '—'}</td>
                    <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>{alloc.notes || '—'}</td>
                    <td style={{ padding: '16px 24px' }}><StatusBadge status={statusLabel(alloc.status)} /></td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      {alloc.status === 'active' && (
                        <button onClick={() => handleReturn(alloc.id)} className="btn btn-outline" style={{ padding: '6px 10px', minHeight: 0, fontSize: '0.75rem', gap: '4px', display: 'inline-flex', alignItems: 'center' }}>
                          <RotateCcw size={12} /> Return
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal ── */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="New Allocation">
        <AllocationForm
          assetsList={assetsList}
          usersList={usersList}
          onSubmit={handleSubmit}
          onCancel={() => setModalOpen(false)}
          submitting={submitting}
          error={modalError}
        />
      </Modal>
    </div>
  );
}