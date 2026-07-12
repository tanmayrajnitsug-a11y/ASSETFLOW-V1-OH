import { useState, useEffect } from 'react';
import {
  Search, Plus, Edit2, Trash2, Box, AlertTriangle, X, Filter
} from 'lucide-react';
import { assetService } from '../api/services';
import Loader from '../components/Loader';
import StatusBadge from '../components/StatusBadge';

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
// Asset Form Component
// ─────────────────────────────────────────────────────────────
function AssetForm({ initialData, onSubmit, onCancel, submitting, error }) {
  const [form, setForm] = useState(initialData || {
    tag: '', name: '', category: '', department: '', location: '', status: 'Available'
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
        <label className="form-label">Asset Tag</label>
        <input type="text" className="form-input" required value={form.tag} onChange={e => setForm({...form, tag: e.target.value})} placeholder="e.g. AF-0012" />
      </div>
      <div>
        <label className="form-label">Asset Name</label>
        <input type="text" className="form-input" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Dell Laptop" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label className="form-label">Category</label>
          <select className="form-input" required value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
            <option value="">Select...</option>
            <option value="Electronics">Electronics</option>
            <option value="Furniture">Furniture</option>
            <option value="Vehicles">Vehicles</option>
            <option value="Software">Software</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <label className="form-label">Status</label>
          <select className="form-input" required value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
            <option value="Available">Available</option>
            <option value="Allocated">Allocated</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Retired">Retired</option>
          </select>
        </div>
      </div>
      <div>
        <label className="form-label">Department</label>
        <input type="text" className="form-input" required value={form.department} onChange={e => setForm({...form, department: e.target.value})} placeholder="e.g. Engineering" />
      </div>
      <div>
        <label className="form-label">Location</label>
        <input type="text" className="form-input" required value={form.location} onChange={e => setForm({...form, location: e.target.value})} placeholder="e.g. HQ Floor 2" />
      </div>
      <div style={{ display: 'flex', gap: '12px', marginTop: '16px', justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-outline" onClick={onCancel} disabled={submitting}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? <Loader inline /> : 'Save Asset'}
        </button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Page Component
// ─────────────────────────────────────────────────────────────
export default function AssetsPage() {
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  // Data State
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  
  // Modal State
  const [modalState, setModalState] = useState({ isOpen: false, type: null, data: null }); // type: 'add' | 'edit'
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  // Fetch Data
  const fetchData = async () => {
    setLoading(true);
    setPageError('');
    try {
      const res = await assetService.getAssets({ 
        search, 
        category: filterCategory,
        department: filterDepartment,
        status: filterStatus
      });
      setAssets(res.data || []);
    } catch (err) {
      setPageError('Unable to load assets. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    // Add debounce for search, immediate for filters
    const timeout = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, filterCategory, filterDepartment, filterStatus]);

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
        await assetService.updateAsset(modalState.data.id, formData);
      } else {
        await assetService.createAsset(formData);
      }
      closeModal();
      fetchData(); // Refresh after add/edit
    } catch (err) {
      setModalError('Failed to save asset. Please check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this asset?')) return;
    setLoading(true);
    try {
      await assetService.deleteAsset(id);
      fetchData(); // Refresh after delete
    } catch (err) {
      setPageError('Failed to delete asset.');
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
            Asset Registry
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Manage and track all enterprise assets.
          </p>
        </div>
        <button 
          className="btn btn-primary" style={{ padding: '0 20px', height: '40px' }}
          onClick={() => openModal('add')}
        >
          <Plus size={16} style={{ marginRight: '8px' }} />
          Register Asset
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
            type="text" className="form-input" placeholder="Search assets by name or tag..." 
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '36px', height: '38px', fontSize: '0.8125rem' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={16} color="var(--text-muted)" />
          <select className="form-input" style={{ width: '150px', height: '38px', fontSize: '0.8125rem' }} value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
            <option value="">All Categories</option>
            <option value="Electronics">Electronics</option>
            <option value="Furniture">Furniture</option>
            <option value="Vehicles">Vehicles</option>
            <option value="Software">Software</option>
          </select>
          <select className="form-input" style={{ width: '150px', height: '38px', fontSize: '0.8125rem' }} value={filterDepartment} onChange={e => setFilterDepartment(e.target.value)}>
            <option value="">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="Design">Design</option>
            <option value="Sales">Sales</option>
            <option value="Finance">Finance</option>
          </select>
          <select className="form-input" style={{ width: '150px', height: '38px', fontSize: '0.8125rem' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="Available">Available</option>
            <option value="Allocated">Allocated</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Retired">Retired</option>
          </select>
        </div>
      </div>

      {/* ── Content Table ── */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading && assets.length === 0 ? (
          <div style={{ padding: '60px 0' }}><Loader message="Loading assets..." /></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '16px 24px', fontWeight: 500 }}>Tag</th>
                  <th style={{ padding: '16px 24px', fontWeight: 500 }}>Name</th>
                  <th style={{ padding: '16px 24px', fontWeight: 500 }}>Category</th>
                  <th style={{ padding: '16px 24px', fontWeight: 500 }}>Department</th>
                  <th style={{ padding: '16px 24px', fontWeight: 500 }}>Location</th>
                  <th style={{ padding: '16px 24px', fontWeight: 500 }}>Status</th>
                  <th style={{ padding: '16px 24px', fontWeight: 500, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assets.length === 0 && !loading && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>No assets found matching your criteria.</td></tr>
                )}
                {assets.map(asset => (
                  <tr key={asset.id} style={{ borderBottom: '1px solid var(--border-subtle)', opacity: loading ? 0.5 : 1 }}>
                    <td style={{ padding: '16px 24px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{asset.tag}</td>
                    <td style={{ padding: '16px 24px', fontWeight: 500, color: 'var(--text-primary)' }}>{asset.name}</td>
                    <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>{asset.category}</td>
                    <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>{asset.department}</td>
                    <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>{asset.location}</td>
                    <td style={{ padding: '16px 24px' }}><StatusBadge status={asset.status || 'Available'} /></td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button onClick={() => openModal('edit', asset)} className="btn btn-outline" style={{ padding: '6px', minHeight: 0 }}><Edit2 size={14} /></button>
                        <button onClick={() => handleDelete(asset.id)} className="btn btn-outline" style={{ padding: '6px', minHeight: 0, color: 'var(--danger)', borderColor: 'var(--danger-border)' }}><Trash2 size={14} /></button>
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
        title={modalState.type === 'add' ? 'Register Asset' : 'Edit Asset'}
      >
        <AssetForm 
          initialData={modalState.data} 
          onSubmit={handleSubmit} 
          onCancel={closeModal} 
          submitting={submitting} 
          error={modalError}
        />
      </Modal>
    </div>
  );
}
