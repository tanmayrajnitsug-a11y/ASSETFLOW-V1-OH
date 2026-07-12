import { useState, useEffect } from 'react';
import {
  Search, Plus, Edit2, Trash2, AlertTriangle, X, Filter, Calendar
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
// Booking Form Component
// ─────────────────────────────────────────────────────────────
function BookingForm({ initialData, assetsList, employeesList, onSubmit, onCancel, submitting, error }) {
  const [form, setForm] = useState(initialData || {
    asset: '', employee: '', booking_date: new Date().toISOString().split('T')[0], start_time: '09:00', end_time: '10:00', purpose: '', status: 'Pending'
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label className="form-label">Asset</label>
          <select className="form-input" required value={form.asset} onChange={e => setForm({...form, asset: e.target.value})}>
            <option value="">Select Asset...</option>
            {assetsList.map(a => <option key={a.id} value={a.name}>{a.name} ({a.tag})</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">Employee</label>
          <select className="form-input" required value={form.employee} onChange={e => setForm({...form, employee: e.target.value})}>
            <option value="">Select Employee...</option>
            {employeesList.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="form-label">Booking Date</label>
        <input type="date" className="form-input" required value={form.booking_date} onChange={e => setForm({...form, booking_date: e.target.value})} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label className="form-label">Start Time</label>
          <input type="time" className="form-input" required value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} />
        </div>
        <div>
          <label className="form-label">End Time</label>
          <input type="time" className="form-input" required value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})} />
        </div>
      </div>
      <div>
        <label className="form-label">Purpose</label>
        <input type="text" className="form-input" required value={form.purpose} onChange={e => setForm({...form, purpose: e.target.value})} placeholder="e.g. Client Presentation" />
      </div>
      
      {initialData && (
        <div>
          <label className="form-label">Status</label>
          <select className="form-input" required value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      )}

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
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  // Data State
  const [bookings, setBookings] = useState([]);
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
          assetService.getAssets({ category: 'AV Equipment' }), // Assume mostly AV/Rooms are booked, but can just fetch all or filter later
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

  // Fetch Bookings
  const fetchBookings = async () => {
    setLoading(true);
    setPageError('');
    try {
      const res = await bookingService.getBookings({ 
        search, 
        booking_date: filterDate,
        status: filterStatus
      });
      setBookings(res || []);
    } catch (err) {
      setPageError('Unable to load bookings. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    const timeout = setTimeout(() => {
      fetchBookings();
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, filterDate, filterStatus]);

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
        await bookingService.updateBooking(modalState.data.id, formData);
      } else {
        await bookingService.createBooking(formData);
      }
      closeModal();
      fetchBookings(); 
    } catch (err) {
      setModalError('Failed to save booking. Please check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this booking?')) return;
    setLoading(true);
    try {
      await bookingService.deleteBooking(id);
      fetchBookings(); 
    } catch (err) {
      setPageError('Failed to delete booking.');
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
      {/* ── Header ── */}
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{
            fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem',
            fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px'
          }}>
            Asset Bookings
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Schedule and manage short-term asset reservations.
          </p>
        </div>
        <button 
          className="btn btn-primary" style={{ padding: '0 20px', height: '40px' }}
          onClick={() => openModal('add')}
        >
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
          <input 
            type="text" className="form-input" placeholder="Search by asset, employee or purpose..." 
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '36px', height: '38px', fontSize: '0.8125rem' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={16} color="var(--text-muted)" />
          <div style={{ position: 'relative' }}>
            <Calendar size={14} color="var(--text-muted)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="date" className="form-input" 
              value={filterDate} onChange={e => setFilterDate(e.target.value)}
              style={{ width: '160px', height: '38px', fontSize: '0.8125rem', paddingLeft: '32px' }}
            />
          </div>
          <select className="form-input" style={{ width: '150px', height: '38px', fontSize: '0.8125rem' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {/* ── Content Table ── */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading && bookings.length === 0 ? (
          <div style={{ padding: '60px 0' }}><Loader message="Loading bookings..." /></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '16px 24px', fontWeight: 500 }}>Asset</th>
                  <th style={{ padding: '16px 24px', fontWeight: 500 }}>Employee</th>
                  <th style={{ padding: '16px 24px', fontWeight: 500 }}>Booking Date</th>
                  <th style={{ padding: '16px 24px', fontWeight: 500 }}>Start Time</th>
                  <th style={{ padding: '16px 24px', fontWeight: 500 }}>End Time</th>
                  <th style={{ padding: '16px 24px', fontWeight: 500 }}>Purpose</th>
                  <th style={{ padding: '16px 24px', fontWeight: 500 }}>Status</th>
                  <th style={{ padding: '16px 24px', fontWeight: 500, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.length === 0 && !loading && (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>No bookings found matching your criteria.</td></tr>
                )}
                {bookings.map(book => (
                  <tr key={book.id} style={{ borderBottom: '1px solid var(--border-subtle)', opacity: loading ? 0.5 : 1 }}>
                    <td style={{ padding: '16px 24px', fontWeight: 500, color: 'var(--text-primary)' }}>{book.asset}</td>
                    <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>{book.employee}</td>
                    <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>{book.booking_date}</td>
                    <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>{book.start_time}</td>
                    <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>{book.end_time}</td>
                    <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>{book.purpose}</td>
                    <td style={{ padding: '16px 24px' }}><StatusBadge status={book.status || 'Pending'} /></td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button onClick={() => openModal('edit', book)} className="btn btn-outline" style={{ padding: '6px', minHeight: 0 }}><Edit2 size={14} /></button>
                        <button onClick={() => handleDelete(book.id)} className="btn btn-outline" style={{ padding: '6px', minHeight: 0, color: 'var(--danger)', borderColor: 'var(--danger-border)' }}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      <Modal 
        isOpen={modalState.isOpen} 
        onClose={closeModal} 
        title={modalState.type === 'add' ? 'New Booking' : 'Edit Booking'}
      >
        <BookingForm 
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
