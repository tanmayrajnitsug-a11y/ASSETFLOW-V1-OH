import { Zap } from 'lucide-react';

export default function Loader({ fullScreen = false, size = 'md', message = '', inline = false }) {
  const dim = { sm: 18, md: 32, lg: 48 }[size] || 32;
  const bw  = { sm: 2,  md: 2,  lg: 3  }[size] || 2;

  const spinner = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div
        style={{
          width:  dim,
          height: dim,
          borderRadius: '50%',
          border: `${bw}px solid transparent`,
          borderTopColor:    'var(--accent)',
          borderRightColor:  'rgba(103,213,255,0.3)',
          borderBottomColor: 'rgba(103,213,255,0.1)',
          borderLeftColor:   'rgba(103,213,255,0.2)',
          animation: 'spin 0.75s linear infinite',
        }}
      />
      {message && (
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontFamily: 'Inter, sans-serif' }}>
          {message}
        </p>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (inline) {
    return (
      <>
        <div
          style={{
            width: 14, height: 14,
            borderRadius: '50%',
            border: '2px solid transparent',
            borderTopColor: 'var(--accent)',
            borderRightColor: 'rgba(103,213,255,0.25)',
            display: 'inline-block',
            animation: 'spin 0.75s linear infinite',
            verticalAlign: 'middle',
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </>
    );
  }

  if (fullScreen) {
    return (
      <div style={{
        position: 'fixed', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-base)', zIndex: 999,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
          {/* Brand mark */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8,
          }}>
            <div style={{
              width: 40, height: 40,
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, rgba(103,213,255,0.18), rgba(76,185,231,0.06))',
              border: '1px solid var(--border-strong)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 16px rgba(103,213,255,0.1)',
            }}>
              <Zap size={18} color="var(--accent)" />
            </div>
            <div>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, fontSize: '1.375rem', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                AssetFlow
              </div>
              <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--accent)', textTransform: 'uppercase', marginTop: 1 }}>
                Enterprise
              </div>
            </div>
          </div>
          {spinner}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0' }}>
      {spinner}
    </div>
  );
}
