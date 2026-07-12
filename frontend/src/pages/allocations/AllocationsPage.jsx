import { useState, useEffect } from 'react';
import {
  Search, Plus, Edit2, Trash2, AlertTriangle, X, Filter, Users
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
// Allocation Form Component
// ─────────────────────────────────────────────────────────────
function AllocationForm({ initialData, assetsList, employeesList, departmentsList, onSubmit, onCancel, submitting, error }) {
  const [form, setForm] = useState(initialData || {
    asset_tag: '', employee: '', department: '', reason: '', status: 'Allocated', allocated_date: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Map selected asset_tag to its name for the payload (if backend requires it)
    const selectedAsset = assetsList.find(a => a.tag === form.asset_tag);
    onSubmit({
      ...form,
      asset: selectedAsset ? selectedAsset.name : form.asset_tag
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
        <label className="form-label">Asset</label>
        <select className="form-input" required value={form.asset_tag} onChange={e => setForm({...form, asset_tag: e.target.value})}>
          <option value="">Select Asset...</option>
          {assetsList.map(a => <option key={a.id} value={a.tag}>{a.tag} - {a.name}</option>)}
        </select>
      </div>
      <div>
        <label className="form-label">Employee</label>
        <select className="form-input" required value={form.employee} onChange={e => setForm({...form, employee: e.target.value})}>
          <option value="">Select Employee...</option>
          {employeesList.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
        </select>
      </div>
      <div>
        <label className="form-label">Department</label>
        <select className="form-input" required value={form.department} onChange={e => setForm({...form, department: e.target.value})}>
          <option value="">Select Department...</option>
          {departmentsList.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
        </select>
      </div>
      <div>
        <label className="form-label">Reason / Notes</label>
        <input type="text" className="form-input" value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} placeholder="e.g. New Joining" />
      </div>
      
      {initialData && (
        <div>
          <label className="form-label">Status</label>
          <select className="form-input" required value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
            <option value="Allocated">Allocated</option>
            <option value="Returned">Returned</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
      )}

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
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  // Data State
  const [allocations, setAllocations] = useState([]);
  const [assetsList, setAssetsList] = useState([]);
  const [employeesList, setEmployeesList] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);
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
        const [assetsRes, empsRes, deptsRes] = await Promise.all([
          assetService.getAssets({ status: 'Available' }), // Only show available assets for allocation ideally
          organizationService.getEmployees(),
          organizationService.getDepartments()
        ]);
        setAssetsList(assetsRes.data || []);
        setEmployeesList(empsRes || []);
        setDepartmentsList(deptsRes || []);
      } catch (err) {
        console.error('Failed to load dropdown data', err);
      }
    }
    fetchDropdowns();
  }, []);

  // Fetch Allocations
  const fetchAllocations = async () => {
    setLoading(true);
    setPageError('');
    try {
      const res = await allocationService.getAllocations({ 
        search, 
        department: filterDepartment,
        status: filterStatus
      });
      setAllocations(res || []);
    } catch (err) {
      setPageError('Unable to load allocations. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    const timeout = setTimeout(() => {
      fetchAllocations();
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, filterDepartment, filterStatus]);

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
        await allocationService.updateAllocation(modalState.data.id, formData);
      } else {
        await allocationService.createAllocation(formData);
      }
      closeModal();
      fetchAllocations(); 
    } catch (err) {
      setModalError('Failed to save allocation. Please check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this allocation?')) return;
    setLoading(true);
    try {
      await allocationService.deleteAllocation(id);
      fetchAllocations(); 
    } catch (err) {
      setPageError('Failed to delete allocation.');
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
            Asset Allocations
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Manage and track asset assignments to employees.
          </p>
        </div>
        <button 
          className="btn btn-primary" style={{ padding: '0 20px', height: '40px' }}
          onClick={() => openModal('add')}
        >
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
          <input 
            type="text" className="form-input" placeholder="Search by asset or employee..." 
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '36px', height: '38px', fontSize: '0.8125rem' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={16} color="var(--text-muted)" />
          <select className="form-input" style={{ width: '160px', height: '38px', fontSize: '0.8125rem' }} value={filterDepartment} onChange={e => setFilterDepartment(e.target.value)}>
            <option value="">All Departments</option>
            {departmentsList.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
          </select>
          <select className="form-input" style={{ width: '150px', height: '38px', fontSize: '0.8125rem' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="Allocated">Allocated</option>
            <option value="Returned">Returned</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
      </div>

      {/* ── Content Table ── */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading && allocations.length === 0 ? (
          <div style={{ padding: '60px 0' }}><Loader message="Loading allocations..." /></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '16px 24px', fontWeight: 500 }}>Asset</th>
                  <th style={{ padding: '16px 24px', fontWeight: 500 }}>Asset Tag</th>
                  <th style={{ padding: '16px 24px', fontWeight: 500 }}>Employee</th>
                  <th style={{ padding: '16px 24px', fontWeight: 500 }}>Department</th>
                  <th style={{ padding: '16px 24px', fontWeight: 500 }}>Allocated Date</th>
                  <th style={{ padding: '16px 24px', fontWeight: 500 }}>Status</th>
                  <th style={{ padding: '16px 24px', fontWeight: 500, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {allocations.length === 0 && !loading && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>No allocations found matching your criteria.</td></tr>
                )}
                {allocations.map(alloc => (
                  <tr key={alloc.id} style={{ borderBottom: '1px solid var(--border-subtle)', opacity: loading ? 0.5 : 1 }}>
                    <td style={{ padding: '16px 24px', fontWeight: 500, color: 'var(--text-primary)' }}>{alloc.asset}</td>
                    <td style={{ padding: '16px 24px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{alloc.asset_tag}</td>
                    <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--accent-bg)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Users size={12} />
                        </div>
                        {alloc.employee}
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>{alloc.department}</td>
                    <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>{alloc.allocated_date}</td>
                    <td style={{ padding: '16px 24px' }}><StatusBadge status={alloc.status || 'Allocated'} /></td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button onClick={() => openModal('edit', alloc)} className="btn btn-outline" style={{ padding: '6px', minHeight: 0 }}><Edit2 size={14} /></button>
                        <button onClick={() => handleDelete(alloc.id)} className="btn btn-outline" style={{ padding: '6px', minHeight: 0, color: 'var(--danger)', borderColor: 'var(--danger-border)' }}><Trash2 size={14} /></button>
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
        title={modalState.type === 'add' ? 'New Allocation' : 'Edit Allocation'}
      >
        <AllocationForm 
          initialData={modalState.data} 
          assetsList={assetsList}
          employeesList={employeesList}
          departmentsList={departmentsList}
          onSubmit={handleSubmit} 
          onCancel={closeModal} 
          submitting={submitting} 
          error={modalError}
        />
      </Modal>
    </div>
  );
}
