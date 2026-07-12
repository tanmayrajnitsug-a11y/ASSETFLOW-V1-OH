import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const SIDEBAR_KEY = 'af_sidebar_collapsed';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(SIDEBAR_KEY) === 'true'; }
    catch { return false; }
  });

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, collapsed);
  }, [collapsed]);

  return (
    <div className="app-shell">
      {/* ── Sidebar ── */}
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(p => !p)} />

      {/* ── Right column ── */}
      <div className="app-main">
        <Navbar unreadCount={3} />

        <main className="app-content">
          <div className="anim-fade-up">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
