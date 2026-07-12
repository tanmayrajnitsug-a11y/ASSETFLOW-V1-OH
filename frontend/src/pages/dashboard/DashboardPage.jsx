import { useState, useEffect } from 'react';
import {
  Box, Users, Activity, Calendar, Wrench, ArrowRightLeft,
  ArrowUpRight, ArrowDownRight, AlertTriangle, ChevronRight
} from 'lucide-react';
import { dashboardService } from '../../api/services';
import Loader from '../../components/Loader';

// ─────────────────────────────────────────────────────────────
// Components
// ─────────────────────────────────────────────────────────────
function StatCard({ title, value, subtitle, trend, type, icon: Icon }) {
  const isUp = trend > 0;
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
        {trend !== 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            color: isUp ? 'var(--success)' : 'var(--danger)',
            fontSize: '0.75rem', fontWeight: 600
          }}>
            {isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {Math.abs(trend)}%
          </div>
        )}
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

function MiniBarChart({ data }) {
  const max = Math.max(...data.map(d => d.tickets));
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', height: '120px', gap: '12px', marginTop: '24px' }}>
      {data.map((item, i) => {
        const h = max === 0 ? 0 : (item.tickets / max) * 100;
        const isCurrent = i === data.length - 1;
        return (
          <div key={item.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '100%', height: `${h}%`, minHeight: '4px',
              background: isCurrent ? 'var(--accent)' : 'rgba(103,213,255,0.15)',
              borderRadius: '4px 4px 0 0', transition: 'height 1s cubic-bezier(0.4, 0, 0.2, 1)'
            }} />
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{item.month}</div>
          </div>
        );
      })}
    </div>
  );
}

function DonutChart({ data }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  let currentAngle = 0;
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '32px', marginTop: '16px' }}>
      <div style={{ position: 'relative', width: '120px', height: '120px', flexShrink: 0 }}>
        <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
          <circle cx="50" cy="50" r="42" fill="none" stroke="var(--bg-secondary)" strokeWidth="12" />
          {data.map((d, i) => {
            const percentage = total === 0 ? 0 : d.value / total;
            const dashArray = `${percentage * 264} 264`;
            const offset = -(currentAngle * 264);
            currentAngle += percentage;
            return (
              <circle
                key={d.label} cx="50" cy="50" r="42" fill="none"
                stroke={d.color} strokeWidth="12"
                strokeDasharray={dashArray} strokeDashoffset={offset}
                style={{ transition: 'stroke-dasharray 1s ease, stroke-dashoffset 1s ease', strokeLinecap: 'round' }}
              />
            );
          })}
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>{total}</span>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Total</span>
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {data.map(d => (
          <div key={d.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: d.color }} />
              <span style={{ color: 'var(--text-secondary)' }}>{d.label}</span>
            </div>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{d.value}</span>
          </div>
        ))}
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
        if (mounted) setError('Failed to load dashboard data. Please try again later.');
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

  const { stats, recent_activity, categoryBreakdown, maintenanceTrend } = data;

  const kpis = [
    { title: 'Total Assets', value: stats.available_assets + stats.allocated_assets, subtitle: 'vs last month', trend: 4, type: 'info', icon: Box },
    { title: 'Allocated', value: stats.allocated_assets, subtitle: 'currently out', trend: 2, type: 'info', icon: Users },
    { title: 'Available', value: stats.available_assets, subtitle: 'in stock', trend: -3, type: 'success', icon: Activity },
    { title: 'Active Bookings', value: stats.active_bookings, subtitle: 'this week', trend: 12, type: 'info', icon: Calendar },
    { title: 'Maintenance', value: stats.maintenance_today, subtitle: 'tickets open', trend: 0, type: 'warning', icon: Wrench },
    { title: 'Pending Transfers', value: stats.pending_transfers, subtitle: 'awaiting approval', trend: 0, type: 'info', icon: ArrowRightLeft },
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

      {/* ── Alert Banner ── */}
      {stats.upcoming_returns > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--warning-bg)', border: '1px solid var(--warning-border)',
          borderRadius: 'var(--radius-md)', padding: '16px 20px', marginBottom: '32px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertTriangle size={18} color="var(--warning)" />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--warning)', fontWeight: 600 }}>{stats.upcoming_returns} assets</strong> overdue or returning soon · Flagged for follow-up
            </span>
          </div>
          <button className="btn btn-outline" style={{ padding: '6px 16px', fontSize: '0.8125rem' }}>Review</button>
        </div>
      )}

      {/* ── KPIs ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '24px', marginBottom: '32px'
      }}>
        {kpis.map((kpi, i) => (
          <StatCard key={i} {...kpi} />
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* ── Recent Activity ── */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Recent Activity</h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Live asset operations feed</p>
              </div>
              <button className="btn btn-outline" style={{ padding: '6px 16px', fontSize: '0.8125rem' }}>View all</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {recent_activity.length > 0 ? recent_activity.map((item, i) => (
                <div key={item.id} style={{
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
          
          {/* ── Charts Row ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div className="card" style={{ padding: '24px' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <div>
                   <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Maintenance Frequency</h3>
                   <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tickets raised per month</p>
                 </div>
                 <ArrowUpRight size={16} color="var(--accent)" />
               </div>
               <MiniBarChart data={maintenanceTrend} />
            </div>
            <div className="card" style={{ padding: '24px' }}>
               <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Asset Distribution</h3>
               <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Breakdown by category</p>
               <DonutChart data={categoryBreakdown} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* ── Quick Actions ── */}
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '20px' }}>Quick Actions</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                { label: 'Register Asset', icon: Box, color: 'var(--info)' },
                { label: 'Book Resource', icon: Calendar, color: 'var(--success)' },
                { label: 'Run Report', icon: Activity, color: 'var(--warning)' },
                { label: 'Raise Alert', icon: AlertTriangle, color: 'var(--danger)' }
              ].map((action, i) => (
                <button key={i} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: '12px', padding: '20px 12px', borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-base)', border: '1px solid var(--border)', cursor: 'pointer',
                  transition: 'var(--transition-fast)'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = action.color; e.currentTarget.style.background = `color-mix(in srgb, ${action.color} 5%, transparent)`; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-base)'; }}
                >
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '8px',
                    background: `color-mix(in srgb, ${action.color} 10%, transparent)`,
                    color: action.color, display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <action.icon size={16} />
                  </div>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)' }}>{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Notifications Panel (Static Placeholder) ── */}
           <div className="card" style={{ padding: '24px', flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)' }}>Notifications</h3>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--danger)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700 }}>3</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {[
                { title: 'Maintenance Overdue', desc: 'Canon Projector — 2 days', type: 'danger' },
                { title: 'Allocation Approved', desc: 'AL-003 approved by admin', type: 'success' },
                { title: 'Booking Confirmed', desc: 'Conf Room A — Jul 14, 10:00 AM', type: 'info' }
              ].map((notif, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: `var(--${notif.type})`, marginTop: '6px', boxShadow: `0 0 8px var(--${notif.type})` }} />
                  <div>
                    <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '2px' }}>{notif.title}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{notif.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
