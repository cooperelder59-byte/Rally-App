import { useState, useId } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from 'firebase/auth';
import { auth } from '../services/firebase';

// ─── Logo ─────────────────────────────────────────────────────────────────────

const PRIMARY = '#c8ff3d';

function RallyLogo() {
  return (
    <svg width="32" height="32" viewBox="0 0 40 32" fill="none" aria-hidden="true">
      <polygon points="0,0 13,16 0,32 7,32 20,16 7,0"    fill={PRIMARY} />
      <polygon points="10,0 23,16 10,32 17,32 30,16 17,0" fill={PRIMARY} opacity=".75" />
      <polygon points="20,0 33,16 20,32 27,32 40,16 27,0" fill={PRIMARY} opacity=".5" />
    </svg>
  );
}

function EyeIcon({ open }) {
  // Simple inline SVGs instead of the emoji, which looked identical in both states.
  return open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7c1.6 0 3 .3 4.2.8M22 12s-1.2 2.4-3.4 4.3M9.9 9.9a3 3 0 0 0 4.2 4.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.98v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.98A9 9 0 0 0 0 9c0 1.45.35 2.83.98 4.03l2.97-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .98 4.97l2.97 2.33C4.66 5.17 6.65 3.58 9 3.58z" />
    </svg>
  );
}

// ─── Validation helpers ────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate({ email, password }) {
  const errors = {};
  if (!email.trim()) errors.email = 'Email is required.';
  else if (!EMAIL_RE.test(email.trim())) errors.email = 'Enter a valid email address.';

  if (!password) errors.password = 'Password is required.';
  else if (password.length < 6) errors.password = 'Password must be at least 6 characters.';

  return errors;
}

// Friendlier copy for common Firebase Auth error codes.
function friendlyAuthError(error) {
  switch (error?.code) {
    case 'auth/invalid-email':
      return 'That email address looks invalid.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Contact your workspace admin.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    case 'auth/popup-closed-by-user':
      return null; // user cancelled — no need to show an error
    default:
      return 'Something went wrong logging you in. Please try again.';
  }
}

// ─── Login ────────────────────────────────────────────────────────────────────

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({});
  const [errorMsg, setErrorMsg]   = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const navigate = useNavigate();
  const emailErrId = useId();
  const passwordErrId = useId();

  const busy = isLoading || isGoogleLoading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;

    const errors = validate({ email, password });
    setFieldErrors(errors);
    setErrorMsg('');
    if (Object.keys(errors).length > 0) return;

    setIsLoading(true);
    try {
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      await signInWithEmailAndPassword(auth, email.trim(), password);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      setErrorMsg(friendlyAuthError(error) ?? 'Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (busy) return;
    setIsGoogleLoading(true);
    setErrorMsg('');
    try {
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      await signInWithPopup(auth, new GoogleAuthProvider());
      navigate('/dashboard');
    } catch (error) {
      console.error('Google sign-in error:', error);
      const msg = friendlyAuthError(error);
      if (msg) setErrorMsg(msg);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div style={s.page}>
      {/* Background grid decoration */}
      <div style={s.grid} aria-hidden="true" />

      <div style={s.card}>
        {/* Logo */}
        <div style={s.logoRow}>
          <RallyLogo />
          <span style={s.logoText}>RALLY</span>
        </div>

        <h1 style={s.heading}>Welcome back</h1>
        <p style={s.sub}>Log in to your team workspace.</p>

        <form style={s.form} onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <div style={s.field}>
            <label style={s.label} htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@team.com"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ ...s.input, ...(fieldErrors.email ? s.inputInvalid : {}) }}
              autoComplete="email"
              disabled={busy}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? emailErrId : undefined}
            />
            {fieldErrors.email && (
              <span id={emailErrId} style={s.fieldError}>{fieldErrors.email}</span>
            )}
          </div>

          {/* Password */}
          <div style={s.field}>
            <div style={s.labelRow}>
              <label style={s.label} htmlFor="password">Password</label>
              <Link to="/forgot-password" style={s.forgotLink}>Forgot password?</Link>
            </div>
            <div style={s.passwordWrap}>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ ...s.input, ...(fieldErrors.password ? s.inputInvalid : {}), paddingRight: 44 }}
                autoComplete="current-password"
                disabled={busy}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? passwordErrId : undefined}
              />
              <button
                type="button"
                style={s.eyeBtn}
                onClick={() => setShowPassword(p => !p)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                disabled={busy}
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>
            {fieldErrors.password && (
              <span id={passwordErrId} style={s.fieldError}>{fieldErrors.password}</span>
            )}
          </div>

          {/* Remember me */}
          <label style={s.rememberRow}>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={busy}
              style={s.checkbox}
            />
            Remember me on this device
          </label>

          {/* Error */}
          {errorMsg && (
            <div style={s.error} role="alert">
              <span style={s.errorDot} />
              {errorMsg}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            style={{ ...s.submitBtn, ...(busy ? s.submitBtnLoading : {}) }}
            disabled={busy}
          >
            {isLoading
              ? <><span style={s.spinner} /> Logging in…</>
              : 'Log in'
            }
          </button>

          {/* Divider */}
          <div style={s.dividerRow}>
            <span style={s.dividerLine} />
            <span style={s.dividerText}>or</span>
            <span style={s.dividerLine} />
          </div>

          {/* Google sign-in */}
          <button
            type="button"
            style={{ ...s.googleBtn, ...(busy ? s.submitBtnLoading : {}) }}
            onClick={handleGoogleSignIn}
            disabled={busy}
          >
            {isGoogleLoading
              ? <><span style={s.spinnerDark} /> Connecting…</>
              : <><GoogleIcon /> Continue with Google</>
            }
          </button>
        </form>

        <p style={s.switchText}>
          Don't have an account?{' '}
          <Link to="/register" style={s.switchLink}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const BG      = '#0f0f0f';
const SURFACE = '#161616';
const BORDER  = '#222';
const TEXT    = '#e8e8e8';
const MUTED   = '#666';
const DANGER  = '#ff6b6b';

const s = {
  page: {
    minHeight: '100vh',
    background: BG,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
    padding: '24px 16px',
    position: 'relative',
    overflow: 'hidden',
  },

  // Subtle dot-grid bg
  grid: {
    position: 'absolute', inset: 0,
    backgroundImage: `radial-gradient(circle, #2a2a2a 1px, transparent 1px)`,
    backgroundSize: '28px 28px',
    opacity: 0.5,
    pointerEvents: 'none',
  },

  card: {
    position: 'relative',
    width: '100%',
    maxWidth: 400,
    background: SURFACE,
    border: `1px solid ${BORDER}`,
    borderRadius: 16,
    padding: '40px 36px',
    boxShadow: '0 24px 64px rgba(0,0,0,.6)',
  },

  logoRow: {
    display: 'flex', alignItems: 'center', gap: 10,
    marginBottom: 32,
  },
  logoText: {
    fontSize: 16,
    fontWeight: 700,
    letterSpacing: '0.18em',
    color: PRIMARY,
  },

  heading: {
    margin: '0 0 6px',
    fontSize: 24,
    fontWeight: 700,
    color: TEXT,
    letterSpacing: '-0.02em',
  },
  sub: {
    margin: '0 0 28px',
    fontSize: 14,
    color: MUTED,
  },

  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },

  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  labelRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: MUTED,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  },
  forgotLink: {
    fontSize: 12,
    color: PRIMARY,
    textDecoration: 'none',
    fontWeight: 600,
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    background: '#111',
    border: `1px solid ${BORDER}`,
    borderRadius: 8,
    color: TEXT,
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color .15s',
  },
  inputInvalid: {
    borderColor: DANGER,
  },
  fieldError: {
    fontSize: 12,
    color: DANGER,
  },

  passwordWrap: {
    position: 'relative',
  },
  eyeBtn: {
    position: 'absolute', right: 10, top: '50%',
    transform: 'translateY(-50%)',
    background: 'none', border: 'none',
    cursor: 'pointer',
    lineHeight: 1,
    padding: 4,
    color: MUTED,
    display: 'flex',
  },

  rememberRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 13,
    color: MUTED,
    cursor: 'pointer',
    userSelect: 'none',
  },
  checkbox: {
    width: 14,
    height: 14,
    accentColor: PRIMARY,
    cursor: 'pointer',
  },

  error: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '10px 14px',
    background: 'rgba(255,80,80,.08)',
    border: '1px solid rgba(255,80,80,.2)',
    borderRadius: 8,
    color: DANGER,
    fontSize: 13,
  },
  errorDot: {
    width: 6, height: 6,
    borderRadius: '50%',
    background: DANGER,
    flexShrink: 0,
  },

  submitBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 4,
    padding: '12px',
    background: PRIMARY,
    border: 'none',
    borderRadius: 8,
    color: '#0f0f0f',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    letterSpacing: '0.01em',
    transition: 'opacity .15s, transform .1s',
  },
  submitBtnLoading: {
    opacity: 0.7,
    cursor: 'not-allowed',
  },

  dividerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    margin: '2px 0',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    background: BORDER,
  },
  dividerText: {
    fontSize: 12,
    color: MUTED,
  },

  googleBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: '11px',
    background: '#111',
    border: `1px solid ${BORDER}`,
    borderRadius: 8,
    color: TEXT,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background .15s',
  },

  // CSS spinner via border trick
  spinner: {
    display: 'inline-block',
    width: 14, height: 14,
    border: '2px solid rgba(0,0,0,.2)',
    borderTopColor: '#0f0f0f',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
  },
  spinnerDark: {
    display: 'inline-block',
    width: 14, height: 14,
    border: '2px solid rgba(255,255,255,.15)',
    borderTopColor: TEXT,
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
  },

  switchText: {
    marginTop: 24,
    textAlign: 'center',
    fontSize: 13,
    color: MUTED,
  },
  switchLink: {
    color: PRIMARY,
    textDecoration: 'none',
    fontWeight: 600,
  },
};

// Inject spinner keyframes once
if (typeof document !== 'undefined' && !document.getElementById('rally-spin')) {
  const style = document.createElement('style');
  style.id = 'rally-spin';
  style.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
  document.head.appendChild(style);
}