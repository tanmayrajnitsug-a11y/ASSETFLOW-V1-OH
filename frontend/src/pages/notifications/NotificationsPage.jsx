import { useState, useEffect } from 'react';
import { notificationService } from '../../api/services';
import Loader from '../../components/Loader';
import { 
  Bell, CheckCircle2, AlertTriangle, Users, Calendar, 
  Wrench, ArrowRightLeft, Clock, Check
} from 'lucide-react';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('unread'); // 'all' or 'unread'

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data || []);
      setError('');
    } catch (err) {
      setError('Unable to load notifications. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications(notifications.map(n => ({ ...n, is_read: true, read: true })));
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const getIconForType = (type) => {
    switch(type) {
      case 'alert':
      case 'danger':
        return <AlertTriangle size={18} color="var(--danger)" />;
      case 'approval':
      case 'success':
        return <CheckCircle2 size={18} color="var(--success)" />;
      case 'booking':
        return <Calendar size={18} color="var(--info)" />;
      case 'transfer':
      case 'allocation':
        return <ArrowRightLeft size={18} color="var(--accent)" />;
      case 'maintenance':
        return <Wrench size={18} color="var(--warning)" />;
      case 'info':
      default:
        return <Bell size={18} color="var(--text-muted)" />;
    }
  };

  const getBgForType = (type) => {
    switch(type) {
      case 'alert':
      case 'danger': return 'var(--danger-bg)';
      case 'approval':
      case 'success': return 'var(--success-bg)';
      case 'booking': return 'var(--info-bg)';
      case 'transfer':
      case 'allocation': return 'rgba(103,213,255,0.08)';
      case 'maintenance': return 'var(--warning-bg)';
      case 'info':
      default: return 'var(--bg-element)';
    }
  };

  const filteredNotifs = filter === 'unread' 
    ? notifications.filter(n => !(n.is_read || n.read))
    : notifications;

  const unreadCount = notifications.filter(n => !(n.is_read || n.read)).length;

  if (loading && notifications.length === 0) return <Loader fullScreen message="Loading notifications..." />;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%', paddingBottom: '40px' }}>
      {/* ── Header ── */}
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Notifications
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Stay updated with system alerts and activities.</p>
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-outline" style={{ padding: '0 20px', height: '40px' }} onClick={handleMarkAllRead}>
            <Check size={16} style={{ marginRight: '8px' }} />
            Mark all as read
          </button>
        )}
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', padding: '16px 20px', borderRadius: 'var(--radius-md)', marginBottom: '24px', color: 'var(--danger)' }}>
          <AlertTriangle size={18} />
          <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{error}</span>
        </div>
      )}

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '24px' }}>
        <button
          onClick={() => setFilter('unread')}
          style={{
            padding: '12px 16px', background: 'none', border: 'none',
            fontSize: '0.9375rem', fontWeight: 500, cursor: 'pointer',
            color: filter === 'unread' ? 'var(--accent)' : 'var(--text-muted)',
            borderBottom: filter === 'unread' ? '2px solid var(--accent)' : '2px solid transparent',
            marginBottom: '-1px', transition: 'var(--transition-fast)',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          Unread
          {unreadCount > 0 && (
            <span style={{ background: filter === 'unread' ? 'var(--accent)' : 'var(--text-faint)', color: 'var(--bg-base)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
              {unreadCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setFilter('all')}
          style={{
            padding: '12px 16px', background: 'none', border: 'none',
            fontSize: '0.9375rem', fontWeight: 500, cursor: 'pointer',
            color: filter === 'all' ? 'var(--accent)' : 'var(--text-muted)',
            borderBottom: filter === 'all' ? '2px solid var(--accent)' : '2px solid transparent',
            marginBottom: '-1px', transition: 'var(--transition-fast)',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          All
        </button>
      </div>

      {/* ── Feed ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filteredNotifs.length === 0 ? (
          <div className="card" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Bell size={32} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <p>No {filter === 'unread' ? 'unread' : ''} notifications to display.</p>
          </div>
        ) : (
          filteredNotifs.map((notif) => {
            const isUnread = !(notif.is_read || notif.read);
            
            return (
              <div 
                key={notif.id} 
                className="card anim-fade-in" 
                style={{ 
                  padding: '20px', 
                  display: 'flex', 
                  gap: '16px', 
                  alignItems: 'flex-start',
                  border: isUnread ? '1px solid var(--border)' : '1px solid var(--border-subtle)',
                  background: isUnread ? 'var(--bg-card)' : 'var(--bg-element)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {isUnread && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: 'var(--accent)' }} />}
                
                <div style={{
                  width: '40px', height: '40px', borderRadius: 'var(--radius-md)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: getBgForType(notif.type),
                  flexShrink: 0
                }}>
                  {getIconForType(notif.type)}
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <h4 style={{ fontSize: '0.9375rem', fontWeight: isUnread ? 600 : 500, color: isUnread ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                      {notif.title}
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} />
                      {notif.time || (notif.created_at ? new Date(notif.created_at).toLocaleString() : '')}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: isUnread ? 'var(--text-secondary)' : 'var(--text-muted)', lineHeight: 1.5 }}>
                    {notif.message}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
