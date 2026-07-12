import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Eye, EyeOff, Zap, ArrowRight, AlertCircle,
  Lock, Mail, CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';

const DEMO_EMAIL = 'admin@assetflow.io';
const DEMO_PASS  = 'admin123';

const FEATURES = [
  'Real-time asset tracking & lifecycle management',
  'Smart allocation engine with conflict detection',
  'Resource booking with calendar integration',
  'Full audit trail & compliance reporting',
];

export default function Login() {
  const { login, isAuthenticated, isLoading, error, clearError } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const from      = location.state?.from?.pathname || '/dashboard';

  const [form,       setForm]       = useState({ email: '', password: '' });
  const [showPass,   setShowPass]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localErr,   setLocalErr]   = useState('');
  const [shake,      setShake]      = useState(false);

  useEffect(() => { if (isAuthenticated) navigate(from, { replace: true }); }, [isAuthenticated]);
  useEffect(() => { if (error) setLocalErr(error); }, [error]);

  const handleChange = (e) => {
    setLocalErr(''); clearError();
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setLocalErr('Please enter your email and password.');
      doShake(); return;
    }
    setSubmitting(true);
    const result = await login(form.email, form.password);
    setSubmitting(false);
    if (result.success) navigate(from, { replace: true });
    else doShake();
  };

  const fillDemo = () => {
    setLocalErr(''); clearError();
    setForm({ email: DEMO_EMAIL, password: DEMO_PASS });
  };

  const doShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 450);
  };

  if (isLoading && !submitting) return <Loader fullScreen message="Checking session…" />;

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'var(--bg-base)',
      fontFamily: 'Inter, sans-serif',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* ── Background noise / gradient ── */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: `
          radial-gradient(ellipse 60% 50% at 15% 50%, rgba(103,213,255,0.05) 0%, transparent 70%),
          radial-gradient(ellipse 50% 40% at 85% 15%, rgba(76,185,231,0.04) 0%, transparent 70%)
        `,
      }} />

      {/* ════════════════════════════════
          LEFT PANEL — Branding
      ════════════════════════════════ */}
      <div style={{
        display: 'none',
        width: '46%',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '48px 52px',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-subtle)',
        position: 'relative',
        zIndex: 1,
      }} className="login-left-panel">

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, rgba(103,213,255,0.16), rgba(76,185,231,0.06))',
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
            <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--accent)', textTransform: 'uppercase' }}>
              Enterprise
            </div>
          </div>
        </div>

        {/* Hero */}
        <div>
          <h1 style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontWeight: 700,
            fontSize: 'clamp(2rem, 3.5vw, 3rem)',
            color: 'var(--text-primary)',
            lineHeight: 1.1,
            letterSpacing: '-0.025em',
            marginBottom: 20,
          }}>
            Manage every<br />
            asset.{' '}
            <span style={{ color: 'var(--accent)' }}>At scale.</span>
          </h1>

          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.65, maxWidth: 380 }}>
            AssetFlow gives enterprises complete visibility and control over physical assets — from procurement to retirement.
          </p>

          <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {FEATURES.map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <CheckCircle2 size={15} color="var(--accent)" style={{ marginTop: 2, flexShrink: 0 }} />
                <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonial */}
        <div style={{
          padding: '20px 24px',
          background: 'rgba(103,213,255,0.04)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
        }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.65, fontStyle: 'italic' }}>
            "AssetFlow cut our asset tracking overhead by 60% and gave us the audit confidence we never had before."
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 }}>
            <div className="sidebar-avatar" style={{ width: 30, height: 30, fontSize: '0.7rem' }}>R</div>
            <div>
              <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>Rohan Verma</p>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Head of Engineering, AssetFlow Corp</p>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════
          RIGHT PANEL — Login Form
      ════════════════════════════════ */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{
          width: '100%',
          maxWidth: 400,
          transition: 'transform 0.1s',
          transform: shake ? 'translateX(-6px)' : 'none',
        }}>

          {/* Mobile logo (visible on small screens only) */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 10, marginBottom: 36,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, rgba(103,213,255,0.16), rgba(76,185,231,0.06))',
              border: '1px solid var(--border-strong)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Zap size={16} color="var(--accent)" />
            </div>
            <div>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, fontSize: '1.25rem', color: 'var(--text-primary)' }}>
                AssetFlow
              </div>
              <div style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--accent)', textTransform: 'uppercase' }}>
                Enterprise
              </div>
            </div>
          </div>

          {/* ── Card ───────────────── */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            padding: '36px 36px 32px',
            boxShadow: '0 24px 60px rgba(0,0,0,0.45), 0 0 0 1px rgba(103,213,255,0.04), 0 0 40px rgba(103,213,255,0.04)',
          }}>

            {/* Heading */}
            <div style={{ marginBottom: 28 }}>
              <h2 style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontWeight: 700,
                fontSize: '1.875rem',
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
                lineHeight: 1.15,
              }}>
                Welcome back
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: 6 }}>
                Sign in to your AssetFlow account
              </p>
            </div>

            {/* Demo hint */}
            <button
              onClick={fillDemo}
              style={{
                width: '100%',
                marginBottom: 24,
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(103,213,255,0.06)',
                border: '1px dashed rgba(103,213,255,0.22)',
                color: 'var(--accent)',
                fontSize: '0.78rem',
                fontWeight: 500,
                fontFamily: 'Inter, sans-serif',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'var(--transition-fast)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(103,213,255,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(103,213,255,0.06)'}
            >
              <span style={{ fontWeight: 700 }}>Demo:</span>
              <span style={{ color: 'var(--text-secondary)' }}>
                admin@assetflow.io / admin123
              </span>
              <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Click to fill
              </span>
            </button>

            {/* Error */}
            {localErr && (
              <div
                className="anim-fade-in"
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '11px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--danger-bg)',
                  border: '1px solid var(--danger-border)',
                  color: 'var(--danger)',
                  fontSize: '0.8125rem',
                  marginBottom: 20,
                }}
              >
                <AlertCircle size={14} style={{ marginTop: 1, flexShrink: 0 }} />
                <span>{localErr}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Email */}
              <div>
                <label className="form-label">Email address</label>
                <div style={{ position: 'relative' }}>
                  <Mail
                    size={14}
                    color="var(--text-muted)"
                    style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                  />
                  <input
                    id="login-email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="name@company.com"
                    className="form-input"
                    style={{ paddingLeft: 36 }}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label className="form-label" style={{ margin: 0 }}>Password</label>
                  <button
                    type="button"
                    style={{
                      fontSize: '0.78rem', color: 'var(--accent)', background: 'none',
                      border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-hover)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--accent)'}
                  >
                    Forgot password?
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock
                    size={14}
                    color="var(--text-muted)"
                    style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                  />
                  <input
                    id="login-password"
                    type={showPass ? 'text' : 'password'}
                    name="password"
                    autoComplete="current-password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="form-input"
                    style={{ paddingLeft: 36, paddingRight: 40 }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(p => !p)}
                    style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      color: 'var(--text-muted)', background: 'none', border: 'none',
                      cursor: 'pointer', display: 'flex', alignItems: 'center',
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                  >
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                id="login-submit"
                type="submit"
                disabled={submitting}
                className="btn btn-primary btn-lg"
                style={{
                  width: '100%',
                  marginTop: 4,
                  fontSize: '0.9375rem',
                  justifyContent: 'center',
                  opacity: submitting ? 0.7 : 1,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                }}
              >
                {submitting ? (
                  <><Loader inline /><span style={{ marginLeft: 8 }}>Signing in…</span></>
                ) : (
                  <><span>Sign in</span><ArrowRight size={16} /></>
                )}
              </button>
            </form>

            {/* Register */}
            <div style={{
              marginTop: 24,
              paddingTop: 24,
              borderTop: '1px solid var(--border-subtle)',
              textAlign: 'center',
            }}>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Don't have an account?
              </p>
              <button
                className="btn btn-ghost btn-md"
                style={{ marginTop: 10, width: '100%', justifyContent: 'center', fontSize: '0.875rem' }}
              >
                Create Account
              </button>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-faint)', marginTop: 10, lineHeight: 1.5 }}>
                New accounts are employee-level. Admin roles are assigned by your organization admin.
              </p>
            </div>
          </div>

          {/* Footer */}
          <p style={{
            textAlign: 'center', marginTop: 24,
            fontSize: '0.72rem', color: 'var(--text-faint)',
          }}>
            © 2026 AssetFlow Enterprise · Secure encrypted login
          </p>
        </div>
      </div>

      {/* CSS for left panel responsive visibility */}
      <style>{`
        @media (min-width: 1024px) {
          .login-left-panel { display: flex !important; }
        }
        .hidden-sm { display: none; }
        @media (min-width: 640px) {
          .hidden-sm { display: flex; }
        }
      `}</style>
    </div>
  );
}
