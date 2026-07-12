import { useState, useEffect } from 'react';
import {
  Search, Plus, Edit2, Trash2, Building, Users, AlertTriangle, X
} from 'lucide-react';
import { organizationService } from '../api/services';
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
        <div style={{ padding: '24px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Form Components
// ─────────────────────────────────────────────────────────────
function DepartmentForm({ initialData, onSubmit, onCancel, submitting, error }) {
  const [form, setForm] = useState(initialData || { name: '', head: '' });

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
        <label className="form-label">Department Name</label>
        <input type="text" className="form-input" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Engineering" />
      </div>
      <div>
        <label className="form-label">Department Head</label>
        <input type="text" className="form-input" required value={form.head} onChange={e => setForm({...form, head: e.target.value})} placeholder="e.g. John Doe" />
      </div>
      <div style={{ display: 'flex', gap: '12px', marginTop: '16px', justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-outline" onClick={onCancel} disabled={submitting}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? <Loader inline /> : 'Save Department'}
        </button>
      </div>
    </form>
  );
}

function EmployeeForm({ initialData, departments, onSubmit, onCancel, submitting, error }) {
  const [form, setForm] = useState(initialData || { name: '', email: '', department_id: '' });

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
        <label className="form-label">Full Name</label>
        <input type="text" className="form-input" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Jane Smith" />
      </div>
      <div>
        <label className="form-label">Email Address</label>
        <input type="email" className="form-input" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="e.g. jane@company.com" />
      </div>
      <div>
        <label className="form-label">Department</label>
        <select className="form-input" required value={form.department_id || ''} onChange={e => setForm({...form, department_id: Number(e.target.value)})}>
          <option value="">Select a department...</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>
      <div style={{ display: 'flex', gap: '12px', marginTop: '16px', justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-outline" onClick={onCancel} disabled={submitting}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? <Loader inline /> : 'Save Employee'}
        </button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Page Component
// ─────────────────────────────────────────────────────────────
export default function OrganizationPage() {
  const [activeTab, setActiveTab] = useState('departments');
  const [search, setSearch] = useState('');
  
  // Data State
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  
  // Modal State
  const [modalState, setModalState] = useState({ isOpen: false, type: null, data: null }); // type: 'add_dept' | 'edit_dept' | 'add_emp' | 'edit_emp'
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  // Fetch Data
  const fetchData = async () => {
    setLoading(true);
    setPageError('');
    try {
      const [deptRes, empRes] = await Promise.all([
        organizationService.getDepartments(),
        organizationService.getEmployees()
      ]);
      const mappedEmps = empRes.map(emp => {
        const dept = deptRes.find(d => d.id === emp.department_id);
        return { ...emp, department: dept ? dept.name : 'Unassigned' };
      });
      const mappedDepts = deptRes.map(dept => {
        const headUser = empRes.find(u => u.id === dept.head_id);
        return { ...dept, head: headUser ? headUser.name : 'Unassigned' };
      });
      setDepartments(mappedDepts);
      setEmployees(mappedEmps);
    } catch (err) {
      setPageError('Unable to load organization data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Handlers
  const openModal = (type, data = null) => {
    setModalError('');
    setModalState({ isOpen: true, type, data });
  };
  
  const closeModal = () => {
    setModalState({ isOpen: false, type: null, data: null });
    setModalError('');
  };

  const handleDeptSubmit = async (formData) => {
    setSubmitting(true);
    setModalError('');
    try {
      if (modalState.type === 'edit_dept') {
        await organizationService.updateDepartment(modalState.data.id, formData);
      } else {
        await organizationService.createDepartment(formData);
      }
      closeModal();
      fetchData(); // Refresh after add/edit
    } catch (err) {
      setModalError('Failed to save department. Please check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDept = async (id) => {
    if (!window.confirm('Are you sure you want to delete this department?')) return;
    setLoading(true);
    try {
      await organizationService.deleteDepartment(id);
      fetchData(); // Refresh after delete
    } catch (err) {
      setPageError('Failed to delete department.');
      setLoading(false);
    }
  };

  const handleEmpSubmit = async (formData) => {
    setSubmitting(true);
    setModalError('');
    try {
      if (modalState.type === 'edit_emp') {
        await organizationService.updateEmployee(modalState.data.id, formData);
      } else {
        await organizationService.createEmployee(formData);
      }
      closeModal();
      fetchData(); // Refresh after add/edit
    } catch (err) {
      setModalError('Failed to save employee. Please check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEmp = async (id) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return;
    setLoading(true);
    try {
      await organizationService.deleteEmployee(id);
      fetchData(); // Refresh after delete
    } catch (err) {
      setPageError('Failed to delete employee.');
      setLoading(false);
    }
  };

  // Filtered Data
  const q = search.toLowerCase();
  const filteredDepts = departments.filter(d => 
    d.name?.toLowerCase().includes(q) || d.head?.toLowerCase().includes(q)
  );
  const filteredEmps = employees.filter(e => 
    e.name?.toLowerCase().includes(q) || e.email?.toLowerCase().includes(q) || e.department?.toLowerCase().includes(q)
  );

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
      {/* ── Header ── */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem',
          fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px'
        }}>
          Organization Setup
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Manage departments and the employee directory.
        </p>
      </div>

      {pageError && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', padding: '16px 20px', borderRadius: 'var(--radius-md)', marginBottom: '24px', color: 'var(--danger)' }}>
          <AlertTriangle size={18} />
          <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{pageError}</span>
        </div>
      )}

      {/* ── Tabs & Actions ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '4px' }}>
          {[
            { id: 'departments', label: 'Departments', icon: Building },
            { id: 'employees', label: 'Employees', icon: Users }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 16px', background: 'none', border: 'none',
                fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer',
                color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-muted)',
                borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
                marginBottom: '-5px', transition: 'var(--transition-fast)'
              }}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '260px' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" className="form-input" placeholder="Search..." 
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: '36px', height: '36px', fontSize: '0.8125rem' }}
            />
          </div>
          <button 
            className="btn btn-primary" style={{ padding: '0 16px', height: '36px' }}
            onClick={() => openModal(activeTab === 'departments' ? 'add_dept' : 'add_emp')}
          >
            <Plus size={16} style={{ marginRight: '6px' }} />
            Add {activeTab === 'departments' ? 'Department' : 'Employee'}
          </button>
        </div>
      </div>

      {/* ── Content Table ── */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px 0' }}><Loader message="Loading organization data..." /></div>
        ) : activeTab === 'departments' ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '16px 24px', fontWeight: 500 }}>Department</th>
                  <th style={{ padding: '16px 24px', fontWeight: 500 }}>Head</th>
                  <th style={{ padding: '16px 24px', fontWeight: 500 }}>Status</th>
                  <th style={{ padding: '16px 24px', fontWeight: 500, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDepts.length === 0 && (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>No departments found.</td></tr>
                )}
                {filteredDepts.map(dept => (
                  <tr key={dept.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '16px 24px', fontWeight: 500, color: 'var(--text-primary)' }}>{dept.name}</td>
                    <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>{dept.head}</td>
                    <td style={{ padding: '16px 24px' }}><StatusBadge status={dept.status || 'Active'} /></td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button onClick={() => openModal('edit_dept', dept)} className="btn btn-outline" style={{ padding: '6px', minHeight: 0 }}><Edit2 size={14} /></button>
                        <button onClick={() => handleDeleteDept(dept.id)} className="btn btn-outline" style={{ padding: '6px', minHeight: 0, color: 'var(--danger)', borderColor: 'var(--danger-border)' }}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '16px 24px', fontWeight: 500 }}>Employee</th>
                  <th style={{ padding: '16px 24px', fontWeight: 500 }}>Department</th>
                  <th style={{ padding: '16px 24px', fontWeight: 500 }}>Status</th>
                  <th style={{ padding: '16px 24px', fontWeight: 500, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmps.length === 0 && (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>No employees found.</td></tr>
                )}
                {filteredEmps.map(emp => (
                  <tr key={emp.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{emp.name}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px' }}>{emp.email}</div>
                    </td>
                    <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>{emp.department}</td>
                    <td style={{ padding: '16px 24px' }}><StatusBadge status={emp.status || 'Active'} /></td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button onClick={() => openModal('edit_emp', emp)} className="btn btn-outline" style={{ padding: '6px', minHeight: 0 }}><Edit2 size={14} /></button>
                        <button onClick={() => handleDeleteEmp(emp.id)} className="btn btn-outline" style={{ padding: '6px', minHeight: 0, color: 'var(--danger)', borderColor: 'var(--danger-border)' }}><Trash2 size={14} /></button>
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
        isOpen={modalState.isOpen && modalState.type?.includes('dept')} 
        onClose={closeModal} 
        title={modalState.type === 'add_dept' ? 'Add Department' : 'Edit Department'}
      >
        <DepartmentForm 
          initialData={modalState.data} 
          onSubmit={handleDeptSubmit} 
          onCancel={closeModal} 
          submitting={submitting} 
          error={modalError}
        />
      </Modal>

      <Modal 
        isOpen={modalState.isOpen && modalState.type?.includes('emp')} 
        onClose={closeModal} 
        title={modalState.type === 'add_emp' ? 'Add Employee' : 'Edit Employee'}
      >
        <EmployeeForm 
          initialData={modalState.data} 
          departments={departments}
          onSubmit={handleEmpSubmit} 
          onCancel={closeModal} 
          submitting={submitting} 
          error={modalError}
        />
      </Modal>

    </div>
  );
}
