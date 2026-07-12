import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Eye, EyeOff, Zap, ArrowRight, AlertCircle,
  Lock, Mail, User, CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../api/services';
import Loader from '../components/Loader';

/* ── tiny inline validation helper ── */
function validate(mode, fields) {
  if (!fields.email.trim())    return 'Email address is required.';
  if (!/\S+@\S+\.\S+/.test(fields.email)) return 'Enter a valid email address.';
  if (mode === 'signup' && !fields.name.trim()) return 'Full name is required.';
  if (!fields.password)        return 'Password is required.';
  if (fields.password.length < 6) return 'Password must be at least 6 characters.';
  if (mode === 'signup' && fields.password !== fields.confirm) return 'Passwords do not match.';
  return null;
}

const FEATURES = [
  'Real-time asset tracking & lifecycle management',
  'Smart allocation engine with conflict detection',
  'Resource booking with calendar integration',
  'Full audit trail & compliance reporting',
];

export default function LoginPage() {
  const { login, isAuthenticated, isLoading, error, clearError } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const from      = location.state?.from?.pathname || '/dashboard';

  const [mode,       setMode]       = useState('login');   // 'login' | 'signup'
  const [form,       setForm]       = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPass,   setShowPass]   = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErr,   setFieldErr]   = useState({});
  const [apiErr,     setApiErr]     = useState('');
  const [shake,      setShake]      = useState(false);

  useEffect(() => { if (isAuthenticated) navigate(from, { replace: true }); }, [isAuthenticated]);
  useEffect(() => { if (error) setApiErr(error); }, [error]);

  /* Clear errors when switching modes */
  const switchMode = (m) => {
    setMode(m);
    setForm({ name: '', email: '', password: '', confirm: '' });
    setFieldErr({});
    setApiErr('');
    clearError();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setFieldErr((p) => ({ ...p, [name]: '' }));
    setApiErr('');
    clearError();
  };

  const doShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 450);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const msg = validate(mode, form);
    if (msg) {
      setApiErr(msg);
      doShake();
      return;
    }

    setSubmitting(true);
    setApiErr('');
    try {
      if (mode === 'login') {
        const result = await login(form.email, form.password);
        if (!result.success) {
          setApiErr(result.error || 'Invalid email or password.');
          doShake();
        } else {
          if (rememberMe) localStorage.setItem('af_remember', form.email);
          navigate(from, { replace: true });
        }
      } else {
        /* Signup — call service directly then dispatch into AuthContext */
        await authService.signup(form.name, form.email, form.password);
        /* Re-use login to hydrate AuthContext properly */
        const result = await login(form.email, form.password);
        if (result.success) navigate(from, { replace: true });
        else { setApiErr(result.error || 'Signup succeeded but login failed.'); doShake(); }
      }
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.displayMessage ||
        err.message ||
        'Something went wrong. Please try again.';
      setApiErr(msg);
      doShake();
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = () => {
    setApiErr(''); clearError();
    setForm({ name: '', email: 'admin@assetflow.io', password: 'admin123', confirm: '' });
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
      {/* Ambient radial glow */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: `
          radial-gradient(ellipse 60% 50% at 15% 50%, rgba(103,213,255,0.05) 0%, transparent 70%),
          radial-gradient(ellipse 50% 40% at 85% 15%, rgba(76,185,231,0.04) 0%, transparent 70%)`,
      }} />

      {/* ══════════════════════════════════════
          LEFT PANEL — Branding (desktop)
      ══════════════════════════════════════ */}
      <div style={{
        width: '46%', flexDirection: 'column', justifyContent: 'space-between',
        padding: '48px 52px',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-subtle)',
        position: 'relative', zIndex: 1,
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

        {/* Hero copy */}
        <div>
          <h1 style={{
            fontFamily: 'Cormorant Garamond, serif', fontWeight: 700,
            fontSize: 'clamp(2rem, 3.5vw, 3rem)',
            color: 'var(--text-primary)', lineHeight: 1.1,
            letterSpacing: '-0.025em', marginBottom: 20,
          }}>
            Manage every<br />
            asset.{' '}
            <span style={{ color: 'var(--accent)' }}>At scale.</span>
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.65, maxWidth: 380 }}>
            AssetFlow gives enterprises complete visibility and control over physical assets — from procurement to retirement.
          </p>
          <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {FEATURES.map((f) => (
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
          border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
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

      {/* ══════════════════════════════════════
          RIGHT PANEL — Form
      ══════════════════════════════════════ */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 24px', position: 'relative', zIndex: 1,
      }}>
        <div style={{
          width: '100%', maxWidth: 420,
          transition: 'transform 0.1s',
          transform: shake ? 'translateX(-6px)' : 'none',
        }}>
          {/* Mobile logo */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 10, marginBottom: 36,
          }} className="mobile-logo-block">
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

          {/* ── Mode Toggle Pills ── */}
          <div style={{
            display: 'flex', background: 'var(--bg-card)',
            border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
            padding: 4, marginBottom: 24, gap: 4,
          }}>
            {[['login', 'Sign In'], ['signup', 'Create Account']].map(([m, label]) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                style={{
                  flex: 1, padding: '8px 0', borderRadius: 'var(--radius-md)',
                  border: 'none', cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', fontWeight: 600,
                  transition: 'var(--transition-smooth)',
                  background: mode === m
                    ? 'linear-gradient(135deg, var(--accent), var(--accent-dim))'
                    : 'transparent',
                  color: mode === m ? '#090B0D' : 'var(--text-muted)',
                  boxShadow: mode === m ? '0 0 14px rgba(103,213,255,0.25)' : 'none',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ── Card ── */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            padding: '32px 32px 28px',
            boxShadow: '0 24px 60px rgba(0,0,0,0.4), 0 0 40px rgba(103,213,255,0.04)',
          }}>

            {/* Heading */}
            <div style={{ marginBottom: 24 }}>
              <h2 style={{
                fontFamily: 'Cormorant Garamond, serif', fontWeight: 700,
                fontSize: '1.75rem', color: 'var(--text-primary)',
                letterSpacing: '-0.02em', lineHeight: 1.15,
              }}>
                {mode === 'login' ? 'Welcome back' : 'Create your account'}
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: 6 }}>
                {mode === 'login'
                  ? 'Sign in to your AssetFlow account'
                  : 'Join your organisation on AssetFlow'}
              </p>
            </div>

            {/* Demo hint (login mode only) */}
            {mode === 'login' && (
              <button
                onClick={fillDemo}
                style={{
                  width: '100%', marginBottom: 20, padding: '9px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(103,213,255,0.06)',
                  border: '1px dashed rgba(103,213,255,0.22)',
                  color: 'var(--accent)', fontSize: '0.78rem', fontWeight: 500,
                  fontFamily: 'Inter, sans-serif', cursor: 'pointer',
                  textAlign: 'left', display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'var(--transition-fast)',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(103,213,255,0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(103,213,255,0.06)'}
              >
                <span style={{ fontWeight: 700 }}>Demo:</span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  admin@assetflow.io / admin123
                </span>
                <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Click to fill ↑
                </span>
              </button>
            )}

            {/* Error banner */}
            {apiErr && (
              <div
                className="anim-fade-in"
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '11px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--danger-bg)',
                  border: '1px solid var(--danger-border)',
                  color: 'var(--danger)', fontSize: '0.8125rem', marginBottom: 20,
                }}
              >
                <AlertCircle size={14} style={{ marginTop: 1, flexShrink: 0 }} />
                <span>{apiErr}</span>
              </div>
            )}

            {/* ── Form ── */}
            <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Full name (signup only) */}
              {mode === 'signup' && (
                <FormField
                  id="signup-name"
                  label="Full name"
                  name="name"
                  type="text"
                  placeholder="Jane Smith"
                  value={form.name}
                  onChange={handleChange}
                  error={fieldErr.name}
                  icon={<User size={14} color="var(--text-muted)" />}
                />
              )}

              {/* Email */}
              <FormField
                id="login-email"
                label="Email address"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="name@company.com"
                value={form.email}
                onChange={handleChange}
                error={fieldErr.email}
                icon={<Mail size={14} color="var(--text-muted)" />}
              />

              {/* Password */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label className="form-label" style={{ margin: 0 }}>Password</label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      style={{ fontSize: '0.78rem', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--accent)'}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={14} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <input
                    id="login-password"
                    name="password"
                    type={showPass ? 'text' : 'password'}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="form-input"
                    style={{ paddingLeft: 36, paddingRight: 40 }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((p) => !p)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                  >
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Confirm password (signup only) */}
              {mode === 'signup' && (
                <FormField
                  id="signup-confirm"
                  label="Confirm password"
                  name="confirm"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={form.confirm}
                  onChange={handleChange}
                  error={fieldErr.confirm}
                  icon={<Lock size={14} color="var(--text-muted)" />}
                />
              )}

              {/* Remember me (login only) */}
              {mode === 'login' && (
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{ accentColor: 'var(--accent)', width: 15, height: 15, cursor: 'pointer' }}
                  />
                  Remember me on this device
                </label>
              )}

              {/* Submit */}
              <button
                id="login-submit"
                type="submit"
                disabled={submitting}
                className="btn btn-primary btn-lg"
                style={{
                  width: '100%', marginTop: 4, fontSize: '0.9375rem',
                  justifyContent: 'center',
                  opacity: submitting ? 0.7 : 1,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                }}
              >
                {submitting ? (
                  <><Loader inline /><span style={{ marginLeft: 8 }}>{mode === 'login' ? 'Signing in…' : 'Creating account…'}</span></>
                ) : (
                  <><span>{mode === 'login' ? 'Sign in' : 'Create account'}</span><ArrowRight size={16} /></>
                )}
              </button>
            </form>
          </div>

          {/* Footer note */}
          <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.72rem', color: 'var(--text-faint)', lineHeight: 1.5 }}>
            {mode === 'login'
              ? 'New accounts are employee-level. Admin roles are assigned by your organisation admin.'
              : 'By creating an account you agree to our Terms of Service and Privacy Policy.'}
          </p>
          <p style={{ textAlign: 'center', marginTop: 16, fontSize: '0.72rem', color: 'var(--text-faint)' }}>
            © 2026 AssetFlow Enterprise · Secure encrypted login
          </p>
        </div>
      </div>

      {/* Responsive CSS */}
      <style>{`
        .login-left-panel { display: none; }
        @media (min-width: 1024px) { .login-left-panel { display: flex; } }
        .mobile-logo-block { display: flex; }
        @media (min-width: 1024px) { .mobile-logo-block { display: none; } }
        .hidden-sm { display: none; }
        @media (min-width: 640px) { .hidden-sm { display: flex; } }
      `}</style>
    </div>
  );
}

/* ── Reusable form field ── */
function FormField({ id, label, name, type, value, onChange, placeholder, autoComplete, icon, error }) {
  return (
    <div>
      <label htmlFor={id} className="form-label">{label}</label>
      <div style={{ position: 'relative' }}>
        {icon && (
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            {icon}
          </span>
        )}
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="form-input"
          style={{ paddingLeft: icon ? 36 : 12 }}
          required
        />
      </div>
      {error && <p style={{ fontSize: '0.72rem', color: 'var(--danger)', marginTop: 4 }}>{error}</p>}
    </div>
  );
}
