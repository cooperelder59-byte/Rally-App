import { useState, useId } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIMARY = '#c8ff3d';
const BG      = '#0f0f0f';
const SURFACE = '#161616';
const BORDER  = '#222';
const TEXT    = '#e8e8e8';
const MUTED   = '#666';
const DANGER  = '#ff6b6b';

// ─── Logo ─────────────────────────────────────────────────────────────────────

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
  // Two distinct icons — the emoji version looked the same in both states.
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

// ─── Password strength ────────────────────────────────────────────────────────

function getStrength(pw) {
  if (!pw) return null;
  if (pw.length < 6) return { level: 0, label: 'Too short', color: DANGER };
  let score = 0;
  if (pw.length >= 8)          score++;
  if (/[A-Z]/.test(pw))        score++;
  if (/[0-9]/.test(pw))        score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { level: 1, label: 'Weak',   color: '#ff9f43' };
  if (score === 2) return { level: 2, label: 'Fair',   color: '#ffd32a' };
  if (score === 3) return { level: 3, label: 'Good',   color: '#a3cb38' };
  return             { level: 4, label: 'Strong', color: PRIMARY };
}

// ─── Validation helpers ────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate({ name, email, password, confirmPassword, agreedToTerms }) {
  const errors = {};
  if (!name.trim()) errors.name = 'Full name is required.';

  if (!email.trim()) errors.email = 'Email is required.';
  else if (!EMAIL_RE.test(email.trim())) errors.email = 'Enter a valid email address.';

  if (!password) errors.password = 'Password is required.';
  else if (password.length < 6) errors.password = 'Password must be at least 6 characters.';

  if (!confirmPassword) errors.confirmPassword = 'Please confirm your password.';
  else if (confirmPassword !== password) errors.confirmPassword = 'Passwords do not match.';

  if (!agreedToTerms) errors.agreedToTerms = 'You must agree to the terms to continue.';

  return errors;
}

function friendlyAuthError(error) {
  switch (error?.code) {
    case 'auth/email-already-in-use':
      return 'That email is already registered.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/invalid-email':
      return 'That email address looks invalid.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    case 'auth/popup-closed-by-user':
      return null; // user cancelled — no need to show an error
    default:
      return 'Something went wrong. Please try again.';
  }
}

// ─── Register ─────────────────────────────────────────────────────────────────

export default function Register() {
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({});
  const [errorMsg, setErrorMsg]   = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const navigate = useNavigate();

  const nameErrId = useId();
  const emailErrId = useId();
  const passwordErrId = useId();
  const confirmErrId = useId();
  const termsErrId = useId();

  const strength = getStrength(password);
  const busy = isLoading || isGoogleLoading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;

    const errors = validate({ name, email, password, confirmPassword, agreedToTerms });
    setFieldErrors(errors);
    setErrorMsg('');
    if (Object.keys(errors).length > 0) return;

    setIsLoading(true);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(user, { displayName: name.trim() });
      await setDoc(doc(db, 'users', user.uid), {
        name: name.trim(),
        email: email.trim(),
        teamIds: [],
        createdAt: serverTimestamp(),
      });
      navigate('/team-setup');
    } catch (error) {
      console.error('Register error:', error);
      setErrorMsg(friendlyAuthError(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (busy) return;
    setIsGoogleLoading(true);
    setErrorMsg('');
    try {
      const { user } = await signInWithPopup(auth, new GoogleAuthProvider());
      const userRef = doc(db, 'users', user.uid);
      const existing = await getDoc(userRef);

      if (!existing.exists()) {
        // First time we've seen this account — create their Firestore profile,
        // same shape as the email/password signup path above.
        await setDoc(userRef, {
          name: user.displayName || '',
          email: user.email || '',
          teamIds: [],
          createdAt: serverTimestamp(),
        });
        navigate('/team-setup');
      } else {
        // Someone who already has an account used "sign up" to log in instead —
        // send them straight to their dashboard rather than re-onboarding them.
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Google sign-up error:', error);
      const msg = friendlyAuthError(error);
      if (msg) setErrorMsg(msg);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.grid} aria-hidden="true" />

      <div style={s.card}>
        {/* Logo */}
        <div style={s.logoRow}>
          <RallyLogo />
          <span style={s.logoText}>RALLY</span>
        </div>

        <h1 style={s.heading}>Create your account</h1>
        <p style={s.sub}>Bring your team together.</p>

        <form style={s.form} onSubmit={handleSubmit} noValidate>
          {/* Name */}
          <div style={s.field}>
            <label style={s.label} htmlFor="name">Full name</label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="Jordan Smith"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ ...s.input, ...(fieldErrors.name ? s.inputInvalid : {}) }}
              autoComplete="name"
              disabled={busy}
              aria-invalid={Boolean(fieldErrors.name)}
              aria-describedby={fieldErrors.name ? nameErrId : undefined}
            />
            {fieldErrors.name && <span id={nameErrId} style={s.fieldError}>{fieldErrors.name}</span>}
          </div>

          {/* Email */}
          <div style={s.field}>
            <label style={s.label} htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@team.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ ...s.input, ...(fieldErrors.email ? s.inputInvalid : {}) }}
              autoComplete="email"
              disabled={busy}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? emailErrId : undefined}
            />
            {fieldErrors.email && <span id={emailErrId} style={s.fieldError}>{fieldErrors.email}</span>}
          </div>

          {/* Password */}
          <div style={s.field}>
            <label style={s.label} htmlFor="password">Password</label>
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
                autoComplete="new-password"
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
            {fieldErrors.password && <span id={passwordErrId} style={s.fieldError}>{fieldErrors.password}</span>}

            {/* Strength bar */}
            {password && strength && (
              <div style={s.strengthRow}>
                <div style={s.strengthTrack}>
                  {[1,2,3,4].map(n => (
                    <div
                      key={n}
                      style={{
                        ...s.strengthSeg,
                        background: n <= strength.level ? strength.color : BORDER,
                      }}
                    />
                  ))}
                </div>
                <span style={{ ...s.strengthLabel, color: strength.color }}>
                  {strength.label}
                </span>
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div style={s.field}>
            <label style={s.label} htmlFor="confirmPassword">Confirm password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{ ...s.input, ...(fieldErrors.confirmPassword ? s.inputInvalid : {}) }}
              autoComplete="new-password"
              disabled={busy}
              aria-invalid={Boolean(fieldErrors.confirmPassword)}
              aria-describedby={fieldErrors.confirmPassword ? confirmErrId : undefined}
            />
            {fieldErrors.confirmPassword && (
              <span id={confirmErrId} style={s.fieldError}>{fieldErrors.confirmPassword}</span>
            )}
          </div>

          {/* Terms */}
          <div style={s.field}>
            <label style={s.termsRow}>
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                disabled={busy}
                style={s.checkbox}
                aria-invalid={Boolean(fieldErrors.agreedToTerms)}
                aria-describedby={fieldErrors.agreedToTerms ? termsErrId : undefined}
              />
              <span>
                I agree to the <Link to="/terms" style={s.inlineLink}>Terms of Service</Link> and{' '}
                <Link to="/privacy" style={s.inlineLink}>Privacy Policy</Link>
              </span>
            </label>
            {fieldErrors.agreedToTerms && (
              <span id={termsErrId} style={s.fieldError}>{fieldErrors.agreedToTerms}</span>
            )}
          </div>

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
              ? <><span style={s.spinner} /> Creating account…</>
              : 'Sign up'
            }
          </button>

          {/* Divider */}
          <div style={s.dividerRow}>
            <span style={s.dividerLine} />
            <span style={s.dividerText}>or</span>
            <span style={s.dividerLine} />
          </div>

          {/* Google sign-up */}
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
          Already have an account?{' '}
          <Link to="/login" style={s.switchLink}>Log in</Link>
        </p>
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

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
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: MUTED,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
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
  strengthRow: {
    display: 'flex', alignItems: 'center', gap: 8,
    marginTop: 6,
  },
  strengthTrack: {
    flex: 1,
    display: 'flex', gap: 4,
  },
  strengthSeg: {
    flex: 1, height: 3,
    borderRadius: 2,
    transition: 'background .2s',
  },
  strengthLabel: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.04em',
    minWidth: 44,
    textAlign: 'right',
  },
  termsRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    fontSize: 13,
    color: MUTED,
    cursor: 'pointer',
    lineHeight: 1.4,
  },
  checkbox: {
    width: 14,
    height: 14,
    marginTop: 2,
    accentColor: PRIMARY,
    cursor: 'pointer',
    flexShrink: 0,
  },
  inlineLink: {
    color: PRIMARY,
    textDecoration: 'none',
    fontWeight: 600,
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
    transition: 'opacity .15s',
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

if (typeof document !== 'undefined' && !document.getElementById('rally-spin')) {
  const style = document.createElement('style');
  style.id = 'rally-spin';
  style.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
  document.head.appendChild(style);
}