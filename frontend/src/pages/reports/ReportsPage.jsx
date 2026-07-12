import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis
} from 'recharts';
import { reportService } from '../../api/services';
import Loader from '../../components/Loader';
import { AlertTriangle, Download, TrendingUp, Box, Users, Wrench } from 'lucide-react';

const COLORS = ['#67D5FF', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];

export default function ReportsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    async function fetchReports() {
      try {
        const result = await reportService.getReports();
        if (mounted) {
          setData(result);
          setError('');
        }
      } catch (err) {
        if (mounted) setError('Failed to load reports data. Please try again later.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchReports();
    return () => { mounted = false; };
  }, []);

  if (loading) return <Loader fullScreen message="Loading analytics..." />;
  if (error) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--danger)' }}>
      <AlertTriangle size={48} style={{ marginBottom: '16px', opacity: 0.8 }} />
      <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', marginBottom: '8px' }}>Oops!</h2>
      <p style={{ fontSize: '0.875rem' }}>{error}</p>
    </div>
  );

  // Fallback for API providing dummy structure vs real backend structure
  // The real backend returns { dashboard, asset_utilization, maintenance_frequency, department_allocation, booking_heatmap }
  // The dummy API returns { allocationByDept, maintenanceFrequency }
  
  const isRealBackend = !!data.asset_utilization;

  let kpis = [];
  let pieData = [];
  let deptData = [];
  let maintData = [];
  let heatmapData = [];

  if (isRealBackend) {
    kpis = [
      { title: 'Total Assets', value: data.dashboard?.total_assets || 0, icon: Box, type: 'info' },
      { title: 'Utilization', value: `${data.asset_utilization?.utilization_percentage || 0}%`, icon: TrendingUp, type: 'success' },
      { title: 'Open Maintenance', value: data.dashboard?.open_maintenance_requests || 0, icon: Wrench, type: 'warning' },
      { title: 'Active Bookings', value: data.dashboard?.active_bookings || 0, icon: Users, type: 'info' }
    ];

    if (data.asset_utilization?.status_breakdown) {
      pieData = Object.entries(data.asset_utilization.status_breakdown).map(([key, val]) => ({
        name: key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' '),
        value: val
      }));
    }

    if (data.department_allocation?.departments) {
      deptData = data.department_allocation.departments.map(d => ({
        name: d.department_name,
        count: d.asset_count
      }));
    }

    if (data.maintenance_frequency?.assets) {
      maintData = data.maintenance_frequency.assets.map(a => ({
        name: a.asset_name,
        tickets: a.request_count
      }));
    }

    if (data.booking_heatmap?.heatmap) {
      heatmapData = data.booking_heatmap.heatmap.map(h => ({
        day: h.day.substring(0, 3),
        dayIndex: h.day_index,
        hour: h.hour,
        count: h.count
      }));
    }
  } else {
    // Dummy Data adapter
    kpis = [
      { title: 'Total Assets', value: 120, icon: Box, type: 'info' },
      { title: 'Utilization', value: '64%', icon: TrendingUp, type: 'success' },
      { title: 'Open Maintenance', value: 3, icon: Wrench, type: 'warning' },
      { title: 'Active Bookings', value: 9, icon: Users, type: 'info' }
    ];
    pieData = [
      { name: 'Available', value: 76 },
      { name: 'Allocated', value: 38 },
      { name: 'Maintenance', value: 6 }
    ];
    deptData = data.allocationByDept?.map(d => ({ name: d.dept, count: d.count })) || [];
    maintData = data.maintenanceFrequency?.map(m => ({ name: m.month, tickets: m.count })) || [];
  }

  const handleExport = () => {
    alert("Export functionality coming soon!");
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '12px', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-card)' }}>
          <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '4px' }}>{label}</p>
          {payload.map((entry, index) => (
            <p key={`item-${index}`} style={{ color: entry.color || 'var(--accent)', fontSize: '0.875rem' }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%', paddingBottom: '40px' }}>
      {/* ── Header ── */}
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Reports & Analytics
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Visualize asset utilization, maintenance trends, and resource allocation.</p>
        </div>
        <button className="btn btn-outline" style={{ padding: '0 20px', height: '40px' }} onClick={handleExport}>
          <Download size={16} style={{ marginRight: '8px' }} />
          Export PDF
        </button>
      </div>

      {/* ── KPIs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        {kpis.map((kpi, i) => (
          <div key={i} className="card stat-card anim-fade-in" style={{ padding: '24px', animationDelay: `${i * 0.1}s` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: 'var(--radius-md)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: `var(--${kpi.type}-bg)`, color: `var(--${kpi.type})`,
                border: `1px solid var(--${kpi.type}-border)`
              }}>
                <kpi.icon size={20} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1, marginBottom: '8px', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}>
                {kpi.value}
              </div>
              <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                {kpi.title}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        {/* ── Asset Status Breakdown ── */}
        <div className="card anim-fade-in" style={{ padding: '24px', animationDelay: '0.2s' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Asset Status</h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '24px' }}>Current distribution by availability</p>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={5}
                  dataKey="value" stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Department Allocation ── */}
        <div className="card anim-fade-in" style={{ padding: '24px', animationDelay: '0.3s' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Department Allocation</h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '24px' }}>Number of assets per department</p>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
                <Tooltip cursor={{ fill: 'rgba(103,213,255,0.05)' }} content={<CustomTooltip />} />
                <Bar dataKey="count" fill="var(--accent)" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px' }}>
        {/* ── Maintenance Frequency ── */}
        <div className="card anim-fade-in" style={{ padding: '24px', animationDelay: '0.4s' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Maintenance by Asset</h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '24px' }}>Assets with highest ticket frequency</p>
          <div style={{ height: '300px', width: '100%' }}>
            {maintData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={maintData.slice(0, 10)} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" horizontal={true} vertical={false} />
                  <XAxis type="number" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} width={100} />
                  <Tooltip cursor={{ fill: 'rgba(245,158,11,0.05)' }} content={<CustomTooltip />} />
                  <Bar dataKey="tickets" fill="var(--warning)" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>No maintenance data available.</div>
            )}
          </div>
        </div>

        {/* ── Booking Heatmap (Optional based on data) ── */}
        <div className="card anim-fade-in" style={{ padding: '24px', animationDelay: '0.5s' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Booking Heatmap</h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '24px' }}>Resource reservation activity</p>
          <div style={{ height: '300px', width: '100%' }}>
            {heatmapData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis type="number" dataKey="hour" name="Hour" unit="h" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickCount={12} />
                  <YAxis type="category" dataKey="day" name="Day" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <ZAxis type="number" dataKey="count" range={[0, 500]} name="Bookings" />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                  <Scatter data={heatmapData} fill="var(--success)" opacity={0.7} />
                </ScatterChart>
              </ResponsiveContainer>
            ) : (
               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>Insufficient booking data for heatmap.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
