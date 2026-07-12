import { useState, useEffect } from 'react';
import {
  Box, Users, Activity, Calendar, Wrench, ArrowRightLeft,
  AlertTriangle
} from 'lucide-react';
import { dashboardService } from '../api/services';
import Loader from '../components/Loader';

// ─────────────────────────────────────────────────────────────
// Components
// ─────────────────────────────────────────────────────────────
function StatCard({ title, value, subtitle, type, icon: Icon }) {
  return (
    <div className="card stat-card anim-fade-in" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: 'var(--radius-md)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: `var(--${type}-bg, rgba(103,213,255,0.08))`,
          color: `var(--${type}, var(--accent))`,
          border: `1px solid var(--${type}-border, rgba(103,213,255,0.12))`
        }}>
          <Icon size={20} />
        </div>
      </div>
      <div>
        <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1, marginBottom: '8px', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}>
          {value}
        </div>
        <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
          {title}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          {subtitle}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Page Component
// ─────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    async function fetchDashboard() {
      try {
        const result = await dashboardService.getDashboardStats();
        if (mounted) {
          setData(result);
          setError('');
        }
      } catch (err) {
        if (mounted) setError('Failed to load dashboard data. Please check your connection and try again.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchDashboard();
    return () => { mounted = false; };
  }, []);

  if (loading) return <Loader fullScreen message="Loading dashboard…" />;
  if (error) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--danger)' }}>
      <AlertTriangle size={48} style={{ marginBottom: '16px', opacity: 0.8 }} />
      <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', marginBottom: '8px' }}>Oops!</h2>
      <p style={{ fontSize: '0.875rem' }}>{error}</p>
    </div>
  );

  const {
    available_assets = 0,
    allocated_assets = 0,
    maintenance_today = 0,
    active_bookings = 0,
    pending_transfers = 0,
    upcoming_returns = 0,
    recent_activity = []
  } = data;

  const kpis = [
    { title: 'Available Assets', value: available_assets, subtitle: 'in stock', type: 'success', icon: Activity },
    { title: 'Allocated Assets', value: allocated_assets, subtitle: 'currently out', type: 'info', icon: Users },
    { title: 'Maintenance Today', value: maintenance_today, subtitle: 'tickets open', type: 'warning', icon: Wrench },
    { title: 'Active Bookings', value: active_bookings, subtitle: 'this week', type: 'info', icon: Calendar },
    { title: 'Pending Transfers', value: pending_transfers, subtitle: 'awaiting approval', type: 'info', icon: ArrowRightLeft },
    { title: 'Upcoming Returns', value: upcoming_returns, subtitle: 'returning soon', type: 'warning', icon: Box },
  ];

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
      {/* ── Header ── */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem',
          fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px'
        }}>
          Dashboard
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Enterprise overview & KPIs
        </p>
      </div>

      {/* ── KPIs ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '24px', marginBottom: '32px'
      }}>
        {kpis.map((kpi, i) => (
          <StatCard key={i} {...kpi} />
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        {/* ── Recent Activity ── */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Recent Activity</h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Live asset operations feed</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {recent_activity.length > 0 ? recent_activity.map((item, i) => (
              <div key={item.id || i} style={{
                display: 'flex', alignItems: 'flex-start', gap: '16px',
                padding: '16px 0', borderBottom: i < recent_activity.length - 1 ? '1px solid var(--border-subtle)' : 'none'
              }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: 'var(--radius-sm)',
                  background: 'var(--info-bg)', color: 'var(--info)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  {item.type === 'allocation' && <Users size={14} />}
                  {item.type === 'booking' && <Calendar size={14} />}
                  {item.type === 'maintenance' && <Wrench size={14} color="var(--warning)" />}
                  {item.type === 'transfer' && <ArrowRightLeft size={14} />}
                  {item.type === 'audit' && <AlertTriangle size={14} color="var(--danger)" />}
                  {!['allocation', 'booking', 'maintenance', 'transfer', 'audit'].includes(item.type) && <Activity size={14} />}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item.action}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>{item.time}</p>
                </div>
              </div>
            )) : (
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>No recent activity.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
