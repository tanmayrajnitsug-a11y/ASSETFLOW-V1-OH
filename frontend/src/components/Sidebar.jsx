import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Package, ArrowLeftRight,
  CalendarCheck, Wrench, ClipboardList, BarChart3, Bell,
  ChevronLeft, Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { label: 'Dashboard',            path: '/dashboard',     icon: LayoutDashboard },
  { label: 'Organization Setup',   path: '/organization',  icon: Building2 },
  { label: 'Assets',               path: '/assets',        icon: Package },
  { label: 'Allocation & Transfer',path: '/allocation',    icon: ArrowLeftRight },
  { label: 'Resource Booking',     path: '/booking',       icon: CalendarCheck },
  { label: 'Maintenance',          path: '/maintenance',   icon: Wrench },
  { label: 'Audit',                path: '/audit',         icon: ClipboardList },
  { label: 'Reports',              path: '/reports',       icon: BarChart3 },
  { label: 'Notifications',        path: '/notifications', icon: Bell },
];

export default function Sidebar({ collapsed, onToggle }) {
  const { user } = useAuth();
  const location = useLocation();

  return (
    <aside className={`app-sidebar${collapsed ? ' collapsed' : ''}`}>

      {/* ── Logo ─────────────────────────── */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Zap size={14} color="var(--accent)" />
        </div>
        {!collapsed && (
          <div style={{ overflow: 'hidden' }}>
            <span className="sidebar-logo-text">AssetFlow</span>
            <span className="sidebar-logo-badge">Enterprise</span>
          </div>
        )}
      </div>

      {/* ── Navigation ───────────────────── */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ label, path, icon: Icon }) => {
          const isActive =
            location.pathname === path ||
            (path !== '/dashboard' && location.pathname.startsWith(path + '/'));

          return (
            <NavLink
              key={path}
              to={path}
              className={`sidebar-nav-item${collapsed ? ' collapsed' : ''}${isActive ? ' active' : ''}`}
              title={collapsed ? label : undefined}
              style={{ marginBottom: 2 }}
            >
              <Icon size={16} className="sidebar-nav-icon" />

              {!collapsed && (
                <span className="sidebar-nav-label">{label}</span>
              )}

              {/* Tooltip in collapsed mode */}
              {collapsed && (
                <span className="sidebar-tooltip">{label}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* ── User footer ──────────────────── */}
      {!collapsed && (
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <p style={{
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {user?.name || 'Admin'}
              </p>
              <p style={{
                fontSize: '0.68rem',
                color: 'var(--text-muted)',
                marginTop: 1,
              }}>
                {user?.role || 'Administrator'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Collapse toggle ──────────────── */}
      <button
        className="sidebar-toggle-btn"
        onClick={onToggle}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        style={{ border: 'none', outline: 'none' }}
      >
        <ChevronLeft
          size={13}
          style={{
            transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
            transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>
    </aside>
  );
}
