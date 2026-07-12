import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Bell, Search, LogOut, Settings, User,
  ChevronDown, Sun, HelpCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const PAGE_META = {
  '/dashboard':     { title: 'Dashboard',              sub: 'Enterprise overview & KPIs' },
  '/organization':  { title: 'Organization Setup',     sub: 'Departments, employees & categories' },
  '/assets':        { title: 'Asset Registry',         sub: 'Browse and manage all assets' },
  '/allocation':    { title: 'Allocation & Transfer',  sub: 'Assign assets and request transfers' },
  '/booking':       { title: 'Resource Booking',       sub: 'Book shared resources and rooms' },
  '/maintenance':   { title: 'Maintenance',            sub: 'Track and manage maintenance tickets' },
  '/audit':         { title: 'Audit Log',              sub: 'Asset audit records & verification' },
  '/reports':       { title: 'Reports & Analytics',   sub: 'Insights, trends and data exports' },
  '/notifications': { title: 'Notifications',         sub: 'Alerts, approvals & activity feed' },
};

export default function Navbar({ unreadCount = 0 }) {
  const { user, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const menuRef   = useRef(null);

  const [menuOpen,       setMenuOpen]       = useState(false);
  const [searchFocused,  setSearchFocused]  = useState(false);

  const meta = PAGE_META[location.pathname] || { title: 'AssetFlow', sub: '' };

  /* Close dropdown on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate('/login');
  };

  return (
    <header className="app-navbar">

      {/* ── Page title block ────────── */}
      <div className="navbar-title-block">
        <div className="navbar-page-title">{meta.title}</div>
        {meta.sub && <div className="navbar-page-sub">{meta.sub}</div>}
      </div>

      {/* ── Search ──────────────────── */}
      <div className="navbar-search">
        <Search
          size={14}
          style={{
            position: 'absolute',
            left: 11,
            color: searchFocused ? 'var(--accent)' : 'var(--text-faint)',
            pointerEvents: 'none',
            transition: 'color 0.15s',
          }}
        />
        <input
          type="text"
          placeholder="Search assets, people..."
          className="navbar-search-input"
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />
      </div>

      {/* ── Divider ─────────────────── */}
      <div className="navbar-divider" />

      {/* ── Help ────────────────────── */}
      <button
        className="navbar-icon-btn"
        title="Help"
        onClick={() => {}}
      >
        <HelpCircle size={16} />
      </button>

      {/* ── Notifications ───────────── */}
      <button
        className="navbar-icon-btn"
        title="Notifications"
        onClick={() => navigate('/notifications')}
        style={{ position: 'relative' }}
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              minWidth: 16,
              height: 16,
              padding: '0 3px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--danger)',
              color: '#fff',
              fontSize: '0.58rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 6px rgba(239,68,68,0.5)',
              border: '1.5px solid var(--bg-base)',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* ── Divider ─────────────────── */}
      <div className="navbar-divider" />

      {/* ── User menu ───────────────── */}
      <div style={{ position: 'relative' }} ref={menuRef}>
        <button
          onClick={() => setMenuOpen(p => !p)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 10px',
            borderRadius: 'var(--radius-md)',
            background: menuOpen ? 'rgba(103,213,255,0.09)' : 'rgba(255,255,255,0.03)',
            border: '1px solid ' + (menuOpen ? 'rgba(103,213,255,0.25)' : 'var(--border)'),
            cursor: 'pointer',
            transition: 'var(--transition-fast)',
          }}
        >
          {/* Avatar */}
          <div className="sidebar-avatar" style={{ width: 28, height: 28, fontSize: '0.65rem' }}>
            {user?.name?.charAt(0) || 'A'}
          </div>

          {/* Name + role (hidden on small screens) */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
               className="hidden-sm">
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>
              {user?.name || 'Admin'}
            </span>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 1 }}>
              {user?.role || 'Admin'}
            </span>
          </div>

          <ChevronDown
            size={13}
            style={{
              color: 'var(--text-muted)',
              transform: menuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
            }}
          />
        </button>

        {/* Dropdown */}
        {menuOpen && (
          <div
            className="anim-slide-down"
            style={{
              position: 'absolute',
              right: 0,
              top: 'calc(100% + 8px)',
              width: 200,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-modal)',
              overflow: 'hidden',
              zIndex: 50,
            }}
          >
            {/* Header */}
            <div style={{
              padding: '14px 16px',
              borderBottom: '1px solid var(--border-subtle)',
            }}>
              <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {user?.name}
              </p>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.email}
              </p>
            </div>

            {/* Actions */}
            {[
              { icon: User,     label: 'My Profile',   action: () => setMenuOpen(false) },
              { icon: Settings, label: 'Settings',     action: () => setMenuOpen(false) },
              { icon: Sun,      label: 'Appearance',   action: () => setMenuOpen(false) },
            ].map(({ icon: Icon, label, action }) => (
              <DropItem key={label} icon={<Icon size={13} />} label={label} onClick={action} />
            ))}

            <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 0' }} />

            {/* Logout */}
            <DropItem
              icon={<LogOut size={13} />}
              label="Sign out"
              onClick={handleLogout}
              danger
            />
            <div style={{ height: 4 }} />
          </div>
        )}
      </div>
    </header>
  );
}

/* Small helper so we avoid repetition */
function DropItem({ icon, label, onClick, danger = false }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        padding: '9px 16px',
        fontSize: '0.8125rem',
        fontWeight: 500,
        fontFamily: 'Inter, sans-serif',
        color: danger
          ? (hovered ? 'var(--danger)' : '#c0333a')
          : (hovered ? 'var(--accent)' : 'var(--text-secondary)'),
        background: hovered
          ? (danger ? 'var(--danger-bg)' : 'rgba(103,213,255,0.06)')
          : 'transparent',
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'var(--transition-fast)',
      }}
    >
      {icon}
      {label}
    </button>
  );
}
