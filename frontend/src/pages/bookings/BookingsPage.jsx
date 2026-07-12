import { useState, useEffect } from 'react';
import {
  Search, Plus, AlertTriangle, X, Filter, Calendar
} from 'lucide-react';
import { bookingService, assetService, organizationService } from '../../api/services';
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
// Booking Form — matches backend BookingCreate
// ─────────────────────────────────────────────────────────────
function BookingForm({ assetsList, onSubmit, onCancel, submitting, error }) {
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(); nextWeek.setDate(nextWeek.getDate() + 7);

  const [form, setForm] = useState({
    asset_id: '',
    start_date: tomorrow.toISOString().split('T')[0],
    end_date: nextWeek.toISOString().split('T')[0],
    purpose: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      asset_id: parseInt(form.asset_id),
      start_date: new Date(form.start_date).toISOString(),
      end_date: new Date(form.end_date).toISOString(),
      purpose: form.purpose || undefined,
      status: 'pending',
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
          {assetsList.map(a => <option key={a.id} value={a.id}>{a.asset_tag} — {a.name}</option>)}
        </select>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label className="form-label">Start Date *</label>
          <input type="date" className="form-input" required value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
        </div>
        <div>
          <label className="form-label">End Date *</label>
          <input type="date" className="form-input" required value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} />
        </div>
      </div>
      <div>
        <label className="form-label">Purpose</label>
        <input type="text" className="form-input" value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })} placeholder="e.g. Client Presentation" />
      </div>
      <div style={{ display: 'flex', gap: '12px', marginTop: '16px', justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-outline" onClick={onCancel} disabled={submitting}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? <Loader inline /> : 'Book'}
        </button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Page Component
// ─────────────────────────────────────────────────────────────
export default function BookingsPage() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [bookings, setBookings] = useState([]);
  const [assetsList, setAssetsList] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

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

  const fetchBookings = async () => {
    setLoading(true);
    setPageError('');
    try {
      const params = {};
      if (filterStatus) params.status_filter = filterStatus;
      const res = await bookingService.getBookings(params);
      let data = res || [];
      if (search) {
        const q = search.toLowerCase();
        data = data.filter(b => (b.purpose || '').toLowerCase().includes(q) || String(b.asset_id).includes(q));
      }
      setBookings(data);
    } catch (err) {
      setPageError('Unable to load bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => { fetchBookings(); }, 300);
    return () => clearTimeout(timeout);
  }, [search, filterStatus]);

  const getAssetName = (id) => { const a = assetsList.find(x => x.id === id); return a ? `${a.asset_tag} — ${a.name}` : `Asset #${id}`; };
  const getUserName = (id) => { const u = usersList.find(x => x.id === id); return u ? u.name : `User #${id}`; };
  const statusLabel = (s) => ({ pending: 'Pending', approved: 'Approved', active: 'Active', completed: 'Completed', cancelled: 'Cancelled' }[s] || s);
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString() : '—';

  const handleSubmit = async (formData) => {
    setSubmitting(true);
    setModalError('');
    try {
      await bookingService.createBooking(formData);
      setModalOpen(false);
      fetchBookings();
    } catch (err) {
      setModalError(err.displayMessage || 'Failed to create booking. The asset may already be booked for this period.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    setLoading(true);
    try {
      await bookingService.updateBookingStatus(bookingId, newStatus);
      fetchBookings();
    } catch (err) {
      setPageError(err.displayMessage || 'Failed to update status.');
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Asset Bookings
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Schedule and manage asset reservations.</p>
        </div>
        <button className="btn btn-primary" style={{ padding: '0 20px', height: '40px' }} onClick={() => { setModalError(''); setModalOpen(true); }}>
          <Plus size={16} style={{ marginRight: '8px' }} />
          New Booking
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
          <input type="text" className="form-input" placeholder="Search by purpose..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '36px', height: '38px', fontSize: '0.8125rem' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={16} color="var(--text-muted)" />
          <select className="form-input" style={{ width: '150px', height: '38px', fontSize: '0.8125rem' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading && bookings.length === 0 ? (
          <div style={{ padding: '60px 0' }}><Loader message="Loading bookings..." /></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '16px 24px', fontWeight: 500 }}>Asset</th>
                  <th style={{ padding: '16px 24px', fontWeight: 500 }}>Booked By</th>
                  <th style={{ padding: '16px 24px', fontWeight: 500 }}>Start Date</th>
                  <th style={{ padding: '16px 24px', fontWeight: 500 }}>End Date</th>
                  <th style={{ padding: '16px 24px', fontWeight: 500 }}>Purpose</th>
                  <th style={{ padding: '16px 24px', fontWeight: 500 }}>Status</th>
                  <th style={{ padding: '16px 24px', fontWeight: 500, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.length === 0 && !loading && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>No bookings found.</td></tr>
                )}
                {bookings.map(b => (
                  <tr key={b.id} style={{ borderBottom: '1px solid var(--border-subtle)', opacity: loading ? 0.5 : 1 }}>
                    <td style={{ padding: '16px 24px', fontWeight: 500, color: 'var(--text-primary)' }}>{getAssetName(b.asset_id)}</td>
                    <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>{getUserName(b.user_id)}</td>
                    <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>{fmtDate(b.start_date)}</td>
                    <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>{fmtDate(b.end_date)}</td>
                    <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>{b.purpose || '—'}</td>
                    <td style={{ padding: '16px 24px' }}><StatusBadge status={statusLabel(b.status)} /></td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      {b.status === 'pending' && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                          <button onClick={() => handleStatusChange(b.id, 'approved')} className="btn btn-outline" style={{ padding: '4px 10px', minHeight: 0, fontSize: '0.75rem', color: '#10B981' }}>Approve</button>
                          <button onClick={() => handleStatusChange(b.id, 'cancelled')} className="btn btn-outline" style={{ padding: '4px 10px', minHeight: 0, fontSize: '0.75rem', color: 'var(--danger)' }}>Cancel</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="New Booking">
        <BookingForm
          assetsList={assetsList}
          onSubmit={handleSubmit}
          onCancel={() => setModalOpen(false)}
          submitting={submitting}
          error={modalError}
        />
      </Modal>
    </div>
  );
}