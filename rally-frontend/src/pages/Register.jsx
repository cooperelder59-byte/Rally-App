import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIMARY = '#c8ff3d';
const BG      = '#0f0f0f';
const SURFACE = '#161616';
const BORDER  = '#222';
const TEXT    = '#e8e8e8';
const MUTED   = '#666';

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

// ─── Password strength ────────────────────────────────────────────────────────

function getStrength(pw) {
  if (!pw) return null;
  if (pw.length < 6) return { level: 0, label: 'Too short', color: '#ff6b6b' };
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

// ─── Register ─────────────────────────────────────────────────────────────────

export default function Register() {
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg]   = useState('');
  const navigate = useNavigate();

  const strength = getStrength(password);

  const handleSubmit = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(user, { displayName: name });
      await setDoc(doc(db, 'users', user.uid), {
        name,
        email,
        teamIds: [],
        createdAt: serverTimestamp(),
      });
      navigate('/team-setup');
    } catch (error) {
      console.error('Register error:', error);
      if (error.code === 'auth/email-already-in-use') {
        setErrorMsg('That email is already registered.');
      } else if (error.code === 'auth/weak-password') {
        setErrorMsg('Password must be at least 6 characters.');
      } else {
        setErrorMsg('Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
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

        <div style={s.form}>
          {/* Name */}
          <div style={s.field}>
            <label style={s.label} htmlFor="name">Full name</label>
            <input
              id="name"
              type="text"
              placeholder="Jordan Smith"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={s.input}
              autoComplete="name"
            />
          </div>

          {/* Email */}
          <div style={s.field}>
            <label style={s.label} htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="you@team.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={s.input}
              autoComplete="email"
            />
          </div>

          {/* Password */}
          <div style={s.field}>
            <label style={s.label} htmlFor="password">Password</label>
            <div style={s.passwordWrap}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ ...s.input, paddingRight: 44 }}
                autoComplete="new-password"
              />
              <button
                type="button"
                style={s.eyeBtn}
                onClick={() => setShowPassword(p => !p)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>

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

          {/* Error */}
          {errorMsg && (
            <div style={s.error} role="alert">
              <span style={s.errorDot} />
              {errorMsg}
            </div>
          )}

          {/* Submit */}
          <button
            type="button"
            style={{ ...s.submitBtn, ...(isLoading ? s.submitBtnLoading : {}) }}
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading
              ? <><span style={s.spinner} /> Creating account…</>
              : 'Sign up'
            }
          </button>
        </div>

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
  passwordWrap: {
    position: 'relative',
  },
  eyeBtn: {
    position: 'absolute', right: 10, top: '50%',
    transform: 'translateY(-50%)',
    background: 'none', border: 'none',
    cursor: 'pointer',
    fontSize: 14,
    lineHeight: 1,
    padding: 4,
    color: MUTED,
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
  error: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '10px 14px',
    background: 'rgba(255,80,80,.08)',
    border: '1px solid rgba(255,80,80,.2)',
    borderRadius: 8,
    color: '#ff6b6b',
    fontSize: 13,
  },
  errorDot: {
    width: 6, height: 6,
    borderRadius: '50%',
    background: '#ff6b6b',
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
  spinner: {
    display: 'inline-block',
    width: 14, height: 14,
    border: '2px solid rgba(0,0,0,.2)',
    borderTopColor: '#0f0f0f',
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