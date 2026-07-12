import { useState, useEffect } from 'react';
import {
  Search, Plus, Edit2, Trash2, AlertTriangle, X, Filter, CheckCircle, MapPin
} from 'lucide-react';
import { auditService, assetService, organizationService } from '../../api/services';
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
// Audit Form Component
// ─────────────────────────────────────────────────────────────
function AuditForm({ initialData, assetsList, onSubmit, onCancel, submitting, error }) {
  const [form, setForm] = useState(initialData || {
    audit_name: 'Quarterly Audit Q3', asset_tag: '', verification_status: 'Found', remarks: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const selectedAsset = assetsList.find(a => a.tag === form.asset_tag);
    onSubmit({
      ...form,
      asset: selectedAsset ? selectedAsset.name : form.asset_tag,
      department: selectedAsset ? selectedAsset.department : '',
      expected_location: selectedAsset ? selectedAsset.location : ''
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
        <label className="form-label">Audit Name</label>
        <input type="text" className="form-input" required value={form.audit_name} onChange={e => setForm({...form, audit_name: e.target.value})} placeholder="e.g. Quarterly Audit Q3" />
      </div>
      
      <div>
        <label className="form-label">Asset</label>
        <select className="form-input" required value={form.asset_tag} onChange={e => setForm({...form, asset_tag: e.target.value})}>
          <option value="">Select Asset to verify...</option>
          {assetsList.map(a => <option key={a.id} value={a.tag}>{a.tag} - {a.name}</option>)}
        </select>
      </div>

      <div>
        <label className="form-label">Verification Status</label>
        <select className="form-input" required value={form.verification_status} onChange={e => setForm({...form, verification_status: e.target.value})}>
          <option value="Found">Found</option>
          <option value="Missing">Missing</option>
          <option value="Damaged">Damaged</option>
        </select>
      </div>

      <div>
        <label className="form-label">Remarks</label>
        <textarea className="form-input" required rows={3} value={form.remarks} onChange={e => setForm({...form, remarks: e.target.value})} placeholder="Any additional notes..." style={{ resize: 'vertical' }} />
      </div>

      <div style={{ display: 'flex', gap: '12px', marginTop: '16px', justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-outline" onClick={onCancel} disabled={submitting}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? <Loader inline /> : 'Verify'}
        </button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Page Component
// ─────────────────────────────────────────────────────────────
export default function AuditsPage() {
  const [search, setSearch] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  // Data State
  const [audits, setAudits] = useState([]);
  const [assetsList, setAssetsList] = useState([]);
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
        const [assetsRes, deptsRes] = await Promise.all([
          assetService.getAssets(), 
          organizationService.getDepartments()
        ]);
        setAssetsList(assetsRes.data || []);
        setDepartmentsList(deptsRes || []);
      } catch (err) {
        console.error('Failed to load dropdown data', err);
      }
    }
    fetchDropdowns();
  }, []);

  // Fetch Audits
  const fetchAudits = async () => {
    setLoading(true);
    setPageError('');
    try {
      const res = await auditService.getAudits({ 
        search, 
        department: filterDepartment,
        verification_status: filterStatus
      });
      setAudits(res || []);
    } catch (err) {
      setPageError('Unable to load audits. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    const timeout = setTimeout(() => {
      fetchAudits();
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
        await auditService.updateAudit(modalState.data.id, formData);
      } else {
        await auditService.createAudit(formData);
      }
      closeModal();
      fetchAudits(); 
    } catch (err) {
      setModalError('Failed to save audit record. Please check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this audit record?')) return;
    setLoading(true);
    try {
      await auditService.deleteAudit(id);
      fetchAudits(); 
    } catch (err) {
      setPageError('Failed to delete audit record.');
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Found': return '#10B981';
      case 'Damaged': return '#F59E0B';
      case 'Missing': return '#EF4444';
      default: return 'var(--text-muted)';
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
            Asset Audits
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Conduct compliance checks and verify asset locations.
          </p>
        </div>
        <button 
          className="btn btn-primary" style={{ padding: '0 20px', height: '40px' }}
          onClick={() => openModal('add')}
        >
          <CheckCircle size={16} style={{ marginRight: '8px' }} />
          Start Audit
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
            type="text" className="form-input" placeholder="Search by asset or audit name..." 
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
            <option value="Found">Found</option>
            <option value="Missing">Missing</option>
            <option value="Damaged">Damaged</option>
          </select>
        </div>
      </div>

      {/* ── Content Table ── */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading && audits.length === 0 ? (
          <div style={{ padding: '60px 0' }}><Loader message="Loading audit records..." /></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '16px 24px', fontWeight: 500 }}>Audit Name</th>
                  <th style={{ padding: '16px 24px', fontWeight: 500 }}>Asset</th>
                  <th style={{ padding: '16px 24px', fontWeight: 500 }}>Asset Tag</th>
                  <th style={{ padding: '16px 24px', fontWeight: 500 }}>Department</th>
                  <th style={{ padding: '16px 24px', fontWeight: 500 }}>Expected Location</th>
                  <th style={{ padding: '16px 24px', fontWeight: 500 }}>Verification Status</th>
                  <th style={{ padding: '16px 24px', fontWeight: 500 }}>Verified By</th>
                  <th style={{ padding: '16px 24px', fontWeight: 500 }}>Verified Date</th>
                  <th style={{ padding: '16px 24px', fontWeight: 500, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {audits.length === 0 && !loading && (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>No audit records found.</td></tr>
                )}
                {audits.map(audit => (
                  <tr key={audit.id} style={{ borderBottom: '1px solid var(--border-subtle)', opacity: loading ? 0.5 : 1 }}>
                    <td style={{ padding: '16px 24px', fontWeight: 500, color: 'var(--text-primary)' }}>{audit.audit_name}</td>
                    <td style={{ padding: '16px 24px', color: 'var(--text-primary)' }}>{audit.asset}</td>
                    <td style={{ padding: '16px 24px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{audit.asset_tag}</td>
                    <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>{audit.department}</td>
                    <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={12} /> {audit.expected_location}
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '12px', background: 'var(--bg-element)', fontSize: '0.75rem', fontWeight: 600, color: getStatusColor(audit.verification_status), border: `1px solid ${getStatusColor(audit.verification_status)}33` }}>
                        {audit.verification_status}
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>{audit.verified_by}</td>
                    <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>{audit.verified_at}</td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button onClick={() => openModal('edit', audit)} className="btn btn-outline" style={{ padding: '6px', minHeight: 0 }}><Edit2 size={14} /></button>
                        <button onClick={() => handleDelete(audit.id)} className="btn btn-outline" style={{ padding: '6px', minHeight: 0, color: 'var(--danger)', borderColor: 'var(--danger-border)' }}><Trash2 size={14} /></button>
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
        title={modalState.type === 'add' ? 'Verify Asset' : 'Edit Audit Record'}
      >
        <AuditForm 
          initialData={modalState.data} 
          assetsList={assetsList}
          onSubmit={handleSubmit} 
          onCancel={closeModal} 
          submitting={submitting} 
          error={modalError}
        />
      </Modal>
    </div>
  );
}
