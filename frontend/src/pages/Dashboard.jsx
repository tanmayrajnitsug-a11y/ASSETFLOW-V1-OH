import { useState, useEffect } from 'react';
import {
  Package, Users, CalendarCheck, Wrench,
  ArrowUpRight, ArrowDownRight, Clock,
  Plus, FileText, ArrowLeftRight, Bell,
  Activity, TrendingUp, AlertTriangle,
} from 'lucide-react';
import { dashboardService } from '../api/services';
import Loader from '../components/Loader';

/* ─── Mini Bar Chart ───────────────────────────────────────── */
function MiniBarChart({ data }) {
  const max = Math.max(...data.map(d => d.tickets), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 64 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div
            style={{
              width: '100%',
              height: `${(d.tickets / max) * 52}px`,
              minHeight: 4,
              borderRadius: '3px 3px 0 0',
              background: i === data.length - 1
                ? 'linear-gradient(180deg, var(--accent), var(--accent-dim))'
                : 'rgba(103,213,255,0.2)',
              transition: 'height 0.4s ease',
            }}
          />
          <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{d.month}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Mini Donut Chart ─────────────────────────────────────── */
function DonutChart({ data }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  let offset = 0;
  const r = 38, cx = 48, cy = 48, circ = 2 * Math.PI * r;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <svg width={96} height={96} viewBox="0 0 96 96" style={{ flexShrink: 0 }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(103,213,255,0.06)" strokeWidth={10} />
        {data.map((seg, i) => {
          const pct  = seg.value / total;
          const dash = pct * circ;
          const el = (
            <circle
              key={i}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={10}
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={-offset + circ * 0.25}
              strokeLinecap="butt"
              style={{ transition: 'stroke-dasharray 0.6s ease' }}
            />
          );
          offset += dash;
          return el;
        })}
        <text x={cx} y={cy - 6} textAnchor="middle" fill="#fff" fontSize={14} fontWeight={700} fontFamily="Inter">
          {total}
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill="var(--text-muted)" fontSize={8} fontFamily="Inter">
          Total
        </text>
      </svg>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data.map((seg, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: seg.color, flexShrink: 0 }} />
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', flex: 1 }}>{seg.label}</span>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Activity icon by type ────────────────────────────────── */
const ACTIVITY_STYLE = {
  allocation:  { color: '#67D5FF', bg: 'rgba(103,213,255,0.1)',  icon: Package },
  booking:     { color: '#22C55E', bg: 'rgba(34,197,94,0.1)',    icon: CalendarCheck },
  maintenance: { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',   icon: Wrench },
  transfer:    { color: '#A78BFA', bg: 'rgba(167,139,250,0.1)',  icon: ArrowLeftRight },
  audit:       { color: '#EF4444', bg: 'rgba(239,68,68,0.1)',    icon: AlertTriangle },
};

/* ─── Stat Card ────────────────────────────────────────────── */
function StatCard({ label, value, sub, icon: Icon, color, trend, trendLabel, delay = 0 }) {
  return (
    <div
      className="stat-card anim-fade-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* icon + label */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div
          style={{
            width: 40, height: 40,
            borderRadius: 'var(--radius-md)',
            background: color ? `${color}18` : 'rgba(103,213,255,0.08)',
            border: `1px solid ${color ? `${color}30` : 'rgba(103,213,255,0.15)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Icon size={18} color={color || 'var(--accent)'} />
        </div>

        {trend !== undefined && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 3,
            fontSize: '0.72rem', fontWeight: 600,
            color: trend >= 0 ? 'var(--success)' : 'var(--danger)',
          }}>
            {trend >= 0
              ? <ArrowUpRight size={13} />
              : <ArrowDownRight size={13} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>

      {/* Value */}
      <div style={{
        fontSize: '2rem', fontWeight: 700,
        fontFamily: 'Inter, sans-serif',
        color: 'var(--text-primary)',
        lineHeight: 1,
        letterSpacing: '-0.03em',
        marginBottom: 6,
      }}>
        {value}
      </div>

      {/* Label */}
      <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 500 }}>
        {label}
      </div>

      {/* Sub text */}
      {sub && (
        <div style={{ fontSize: '0.72rem', color: 'var(--text-faint)', marginTop: 4 }}>
          {sub}
        </div>
      )}

      {/* Trend label */}
      {trendLabel && (
        <div style={{ fontSize: '0.72rem', color: 'var(--text-faint)', marginTop: 4 }}>
          {trendLabel}
        </div>
      )}
    </div>
  );
}

/* ─── Quick Action Button ──────────────────────────────────── */
function QuickAction({ icon: Icon, label, color }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        padding: '16px 12px',
        borderRadius: 'var(--radius-md)',
        background: hovered ? `${color}10` : 'rgba(255,255,255,0.02)',
        border: `1px solid ${hovered ? `${color}30` : 'var(--border)'}`,
        cursor: 'pointer',
        transition: 'var(--transition-smooth)',
        transform: hovered ? 'translateY(-2px)' : 'none',
        width: '100%',
      }}
    >
      <div style={{
        width: 36, height: 36,
        borderRadius: 'var(--radius-sm)',
        background: `${color}15`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={17} color={color} />
      </div>
      <span style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.3 }}>
        {label}
      </span>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DASHBOARD PAGE
═══════════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardService.getDashboardData()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader size="md" message="Loading dashboard…" />;

  const { stats, recentActivity, categoryBreakdown, maintenanceTrend } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* ── Alert Banner ─────────────────────────── */}
      {stats.pendingTransfers > 0 && (
        <div
          className="anim-fade-in"
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 18px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(245,158,11,0.07)',
            border: '1px solid rgba(245,158,11,0.2)',
          }}
        >
          <AlertTriangle size={15} color="var(--warning)" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '0.8375rem', color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--warning)' }}>{stats.maintenance} assets</strong> overdue for action · Flagged for follow-up
          </span>
          <button className="btn btn-secondary btn-sm" style={{ marginLeft: 'auto', flexShrink: 0 }}>
            Review
          </button>
        </div>
      )}

      {/* ── KPI Grid ─────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(176px, 1fr))',
        gap: 16,
      }}>
        <StatCard label="Total Assets"     value={stats.totalAssets}      icon={Package}       color="#67D5FF" trend={4}   trendLabel="vs last month" delay={0}   />
        <StatCard label="Allocated"         value={stats.allocated}        icon={Users}         color="#A78BFA" trend={2}   trendLabel="currently out" delay={50}  />
        <StatCard label="Available"         value={stats.available}        icon={Activity}      color="#22C55E" trend={-3}  trendLabel="in stock"      delay={100} />
        <StatCard label="Active Bookings"   value={stats.activeBookings}   icon={CalendarCheck} color="#4CB9E7" trend={12}  trendLabel="this week"     delay={150} />
        <StatCard label="Maintenance"       value={stats.maintenance}      icon={Wrench}        color="#F59E0B" sub="tickets open"              delay={200} />
        <StatCard label="Pending Transfers" value={stats.pendingTransfers} icon={ArrowLeftRight} color="#A78BFA" sub="awaiting approval"         delay={250} />
        <StatCard label="Upcoming Returns"  value={stats.upcomingReturns}  icon={Clock}         color="#67D5FF" sub="next 7 days"               delay={300} />
      </div>

      {/* ── Main content row ─────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>

        {/* Recent Activity */}
        <div className="card">
          <div className="card-header">
            <div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Recent Activity
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                Live asset operations feed
              </div>
            </div>
            <button className="btn btn-ghost btn-sm">View all</button>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {recentActivity.map((item, i) => {
                const style = ACTIVITY_STYLE[item.type] || ACTIVITY_STYLE.allocation;
                const Icon  = style.icon;
                return (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 12,
                      padding: '12px 0',
                      borderBottom: i < recentActivity.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                    }}
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: 'var(--radius-sm)',
                      background: style.bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, marginTop: 1,
                    }}>
                      <Icon size={14} color={style.color} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '0.8375rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                        {item.action}
                      </p>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 3 }}>
                        {item.time}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Quick Actions */}
          <div className="card">
            <div className="card-header" style={{ paddingBottom: 16 }}>
              <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Quick Actions
              </div>
            </div>
            <div style={{ padding: '0 20px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <QuickAction icon={Plus}          label="Register Asset"    color="#67D5FF" />
              <QuickAction icon={CalendarCheck} label="Book Resource"     color="#22C55E" />
              <QuickAction icon={FileText}       label="Run Report"        color="#F59E0B" />
              <QuickAction icon={Bell}           label="Raise Alert"       color="#EF4444" />
            </div>
          </div>

          {/* Notifications preview */}
          <div className="card">
            <div className="card-header" style={{ paddingBottom: 16 }}>
              <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Notifications
              </div>
              <div style={{
                width: 20, height: 20, borderRadius: 'var(--radius-full)',
                background: 'var(--danger)', color: '#fff',
                fontSize: '0.65rem', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>3</div>
            </div>
            <div style={{ padding: '0 20px 16px', display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[
                { label: 'Maintenance Overdue',  sub: 'Canon Projector — 2 days',       color: 'var(--danger)',  dot: true },
                { label: 'Allocation Approved',  sub: 'AL-003 approved by admin',        color: 'var(--success)', dot: false },
                { label: 'Booking Confirmed',    sub: 'Conf Room A — Jul 14, 10:00 AM', color: 'var(--accent)',  dot: false },
              ].map((n, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '10px 0',
                  borderBottom: i < 2 ? '1px solid var(--border-subtle)' : 'none',
                }}>
                  <div style={{
                    width: 7, height: 7, borderRadius: '50%',
                    background: n.color, marginTop: 5, flexShrink: 0,
                    boxShadow: `0 0 6px ${n.color}`,
                  }} />
                  <div>
                    <p style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-primary)' }}>{n.label}</p>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{n.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Charts Row ───────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Maintenance Trend */}
        <div className="card">
          <div className="card-header">
            <div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Maintenance Frequency
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                Tickets raised per month
              </div>
            </div>
            <TrendingUp size={16} color="var(--accent)" />
          </div>
          <div className="card-body">
            <MiniBarChart data={maintenanceTrend} />
          </div>
        </div>

        {/* Asset Categories */}
        <div className="card">
          <div className="card-header">
            <div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Asset Distribution
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                Breakdown by category
              </div>
            </div>
          </div>
          <div className="card-body">
            <DonutChart data={categoryBreakdown} />
          </div>
        </div>
      </div>
    </div>
  );
}
