import { useState, useEffect } from 'react';
import {
  Search, Plus, AlertTriangle, X, Filter, CheckCircle, MapPin, ChevronDown, ChevronRight
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
// New Cycle Form — matches backend AuditCycleCreate
// ─────────────────────────────────────────────────────────────
function CycleForm({ departmentsList, onSubmit, onCancel, submitting, error }) {
  const today = new Date().toISOString().split('T')[0];
  const nextMonth = new Date(); nextMonth.setMonth(nextMonth.getMonth() + 1);
  const [form, setForm] = useState({
    department_id: '', location: '', start_date: today, end_date: nextMonth.toISOString().split('T')[0],
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      department_id: form.department_id ? parseInt(form.department_id) : undefined,
      location: form.location || undefined,
      start_date: form.start_date,
      end_date: form.end_date,
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
        <label className="form-label">Department (optional — leave blank for all)</label>
        <select className="form-input" value={form.department_id} onChange={e => setForm({...form, department_id: e.target.value})}>
          <option value="">All Departments</option>
          {departmentsList.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>
      <div>
        <label className="form-label">Location (optional)</label>
        <input type="text" className="form-input" value={form.location} onChange={e => setForm({...form, location: e.target.value})} placeholder="e.g. HQ Floor 2" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label className="form-label">Start Date *</label>
          <input type="date" className="form-input" required value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} />
        </div>
        <div>
          <label className="form-label">End Date *</label>
          <input type="date" className="form-input" required value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: '12px', marginTop: '16px', justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-outline" onClick={onCancel} disabled={submitting}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? <Loader inline /> : 'Start Audit Cycle'}
        </button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────
// Verify Item Form — matches backend AuditItemVerify
// ─────────────────────────────────────────────────────────────
function VerifyForm({ item, assetsList, onSubmit, onCancel, submitting, error }) {
  const [form, setForm] = useState({
    verification_status: 'verified', remarks: ''
  });

  const asset = assetsList.find(a => a.id === item.asset_id);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(item.id, {
      verification_status: form.verification_status,
      remarks: form.remarks || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {error && (
        <div style={{ padding: '10px 14px', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', color: 'var(--danger)', fontSize: '0.8125rem', borderRadius: 'var(--radius-md)' }}>
          {error}
        </div>
      )}
      <div style={{ padding: '12px 16px', background: 'var(--bg-element)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
        <strong>Asset:</strong> {asset ? `${asset.asset_tag} — ${asset.name}` : `Asset #${item.asset_id}`}
      </div>
      <div>
        <label className="form-label">Verification Status *</label>
        <select className="form-input" required value={form.verification_status} onChange={e => setForm({...form, verification_status: e.target.value})}>
          <option value="verified">Verified (Found)</option>
          <option value="missing">Missing</option>
          <option value="damaged">Damaged</option>
        </select>
      </div>
      <div>
        <label className="form-label">Remarks</label>
        <textarea className="form-input" rows={2} value={form.remarks} onChange={e => setForm({...form, remarks: e.target.value})} placeholder="Any notes..." style={{ resize: 'vertical' }} />
      </div>
      <div style={{ display: 'flex', gap: '12px', marginTop: '8px', justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-outline" onClick={onCancel} disabled={submitting}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? <Loader inline /> : 'Verify'}
        </button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────
export default function AuditsPage() {
  const [cycles, setCycles] = useState([]);
  const [assetsList, setAssetsList] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');

  const [expandedCycleId, setExpandedCycleId] = useState(null);

  // Modal state
  const [cycleModalOpen, setCycleModalOpen] = useState(false);
  const [verifyModalItem, setVerifyModalItem] = useState(null); // AuditItem to verify
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    async function fetchDropdowns() {
      try {
        const [assets, depts] = await Promise.all([
          assetService.getAssets({}),
          organizationService.getDepartments(),
        ]);
        setAssetsList(assets || []);
        setDepartmentsList(depts || []);
      } catch (err) {
        console.error('Failed to load dropdown data', err);
      }
    }
    fetchDropdowns();
  }, []);

  const fetchCycles = async () => {
    setLoading(true);
    setPageError('');
    try {
      const res = await auditService.getCycles({});
      setCycles(res || []);
    } catch (err) {
      setPageError('Unable to load audit cycles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCycles(); }, []);

  const getDeptName = (id) => departmentsList.find(d => d.id === id)?.name || (id ? `Dept #${id}` : 'All');
  const getAssetDisplay = (id) => { const a = assetsList.find(x => x.id === id); return a ? `${a.asset_tag} — ${a.name}` : `Asset #${id}`; };

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified': return '#10B981';
      case 'damaged': return '#F59E0B';
      case 'missing': return '#EF4444';
      default: return 'var(--text-muted)';
    }
  };
  const statusLabel = (s) => ({ verified: 'Verified', missing: 'Missing', damaged: 'Damaged' }[s] || 'Pending');

  const handleCreateCycle = async (formData) => {
    setSubmitting(true);
    setModalError('');
    try {
      await auditService.createCycle(formData);
      setCycleModalOpen(false);
      fetchCycles();
    } catch (err) {
      setModalError(err.displayMessage || 'Failed to create audit cycle.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyItem = async (itemId, formData) => {
    setSubmitting(true);
    setModalError('');
    try {
      await auditService.verifyItem(itemId, formData);
      setVerifyModalItem(null);
      fetchCycles();
    } catch (err) {
      setModalError(err.displayMessage || 'Failed to verify item.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseCycle = async (cycleId) => {
    if (!window.confirm('Close this audit cycle? This cannot be undone.')) return;
    try {
      await auditService.closeCycle(cycleId);
      fetchCycles();
    } catch (err) {
      setPageError(err.displayMessage || 'Failed to close cycle.');
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
      {/* ── Header ── */}
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Asset Audits
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Conduct compliance checks and verify asset locations.</p>
        </div>
        <button className="btn btn-primary" style={{ padding: '0 20px', height: '40px' }} onClick={() => { setModalError(''); setCycleModalOpen(true); }}>
          <CheckCircle size={16} style={{ marginRight: '8px' }} />
          New Audit Cycle
        </button>
      </div>

      {pageError && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', padding: '16px 20px', borderRadius: 'var(--radius-md)', marginBottom: '24px', color: 'var(--danger)' }}>
          <AlertTriangle size={18} />
          <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{pageError}</span>
        </div>
      )}

      {/* ── Cycle List ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {loading && cycles.length === 0 ? (
          <div style={{ padding: '60px 0' }}><Loader message="Loading audit cycles..." /></div>
        ) : cycles.length === 0 ? (
          <div className="card" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No audit cycles found. Start one to begin verifying assets.
          </div>
        ) : (
          cycles.map(cycle => {
            const isExpanded = expandedCycleId === cycle.id;
            const items = cycle.items || [];
            const verified = items.filter(i => i.verification_status).length;
            const total = items.length;
            const progress = total > 0 ? Math.round((verified / total) * 100) : 0;

            return (
              <div key={cycle.id} className="card" style={{ overflow: 'hidden' }}>
                {/* Cycle header */}
                <div
                  onClick={() => setExpandedCycleId(isExpanded ? null : cycle.id)}
                  style={{
                    padding: '20px 24px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    borderBottom: isExpanded ? '1px solid var(--border-subtle)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {isExpanded ? <ChevronDown size={16} color="var(--text-muted)" /> : <ChevronRight size={16} color="var(--text-muted)" />}
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '1rem' }}>
                        {getDeptName(cycle.department_id)} — {cycle.location || 'All Locations'}
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {cycle.start_date} → {cycle.end_date} · {verified}/{total} verified
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Progress bar */}
                    <div style={{ width: '100px', height: '6px', background: 'var(--border-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${progress}%`, height: '100%', background: progress === 100 ? '#10B981' : 'var(--accent)', borderRadius: '3px', transition: 'width 0.3s' }} />
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', minWidth: '30px' }}>{progress}%</span>
                    <StatusBadge status={cycle.is_closed ? 'Closed' : 'Active'} />
                  </div>
                </div>

                {/* Expanded items */}
                {isExpanded && (
                  <div style={{ padding: '16px 24px' }}>
                    {!cycle.is_closed && (
                      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                        <button onClick={() => handleCloseCycle(cycle.id)} className="btn btn-outline" style={{ fontSize: '0.8125rem', padding: '6px 14px', minHeight: 0 }}>
                          Close Cycle
                        </button>
                      </div>
                    )}
                    {items.length === 0 ? (
                      <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>No items in this audit cycle.</div>
                    ) : (
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                            <th style={{ padding: '12px 16px', fontWeight: 500, textAlign: 'left' }}>Asset</th>
                            <th style={{ padding: '12px 16px', fontWeight: 500, textAlign: 'left' }}>Status</th>
                            <th style={{ padding: '12px 16px', fontWeight: 500, textAlign: 'left' }}>Remarks</th>
                            <th style={{ padding: '12px 16px', fontWeight: 500, textAlign: 'left' }}>Verified At</th>
                            <th style={{ padding: '12px 16px', fontWeight: 500, textAlign: 'right' }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map(item => (
                            <tr key={item.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                              <td style={{ padding: '12px 16px', color: 'var(--text-primary)', fontWeight: 500 }}>{getAssetDisplay(item.asset_id)}</td>
                              <td style={{ padding: '12px 16px' }}>
                                {item.verification_status ? (
                                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '12px', background: 'var(--bg-element)', fontSize: '0.75rem', fontWeight: 600, color: getStatusColor(item.verification_status), border: `1px solid ${getStatusColor(item.verification_status)}33` }}>
                                    {statusLabel(item.verification_status)}
                                  </div>
                                ) : (
                                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>Not verified</span>
                                )}
                              </td>
                              <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>{item.remarks || '—'}</td>
                              <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>{item.verified_at ? new Date(item.verified_at).toLocaleDateString() : '—'}</td>
                              <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                {!cycle.is_closed && !item.verification_status && (
                                  <button onClick={() => { setModalError(''); setVerifyModalItem(item); }} className="btn btn-primary" style={{ padding: '4px 12px', minHeight: 0, fontSize: '0.75rem' }}>
                                    Verify
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ── Modals ── */}
      <Modal isOpen={cycleModalOpen} onClose={() => setCycleModalOpen(false)} title="New Audit Cycle">
        <CycleForm
          departmentsList={departmentsList}
          onSubmit={handleCreateCycle}
          onCancel={() => setCycleModalOpen(false)}
          submitting={submitting}
          error={modalError}
        />
      </Modal>

      <Modal isOpen={!!verifyModalItem} onClose={() => setVerifyModalItem(null)} title="Verify Asset">
        {verifyModalItem && (
          <VerifyForm
            item={verifyModalItem}
            assetsList={assetsList}
            onSubmit={handleVerifyItem}
            onCancel={() => setVerifyModalItem(null)}
            submitting={submitting}
            error={modalError}
          />
        )}
      </Modal>
    </div>
  );
}
