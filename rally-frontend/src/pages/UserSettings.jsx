import { useState, useEffect } from 'react';
import { onAuthStateChanged, updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import '../styles/user-settings.css';

export default function UserSettings() {
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [loading, setLoading] = useState(true);

  // Profile fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Notification prefs
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyPush, setNotifyPush] = useState(true);

  // Password change fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI state
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null);   // { type: 'success' | 'error', text }
  const [passwordMsg, setPasswordMsg] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setCurrentUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!currentUser) { setLoading(false); return; }

    (async () => {
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, 'users', currentUser.uid));
        const data = snap.exists() ? snap.data() : {};

        setName(data.name || currentUser.displayName || '');
        setPhone(data.phone || '');
        setEmail(currentUser.email || data.email || '');
        setNotifyEmail(data.notifications?.email ?? true);
        setNotifyPush(data.notifications?.push ?? true);
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [currentUser]);

  const initials = (name || email || '?')
    .trim()
    .split(/\s+/)
    .map(p => p[0]?.toUpperCase())
    .slice(0, 2)
    .join('');

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    setProfileMsg(null);

    if (!name.trim()) {
      setProfileMsg({ type: 'error', text: 'Name cannot be empty.' });
      return;
    }

    setSavingProfile(true);
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        name: name.trim(),
        phone: phone.trim(),
      });
      await updateProfile(currentUser, { displayName: name.trim() });
      setProfileMsg({ type: 'success', text: 'Profile updated.' });
    } catch (err) {
      console.error('Failed to save profile:', err);
      setProfileMsg({ type: 'error', text: 'Something went wrong. Try again.' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleToggleNotification = async (key, value) => {
    if (key === 'email') setNotifyEmail(value);
    if (key === 'push') setNotifyPush(value);

    if (!currentUser) return;
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        [`notifications.${key}`]: value,
      });
    } catch (err) {
      console.error('Failed to update notification preference:', err);
      // Revert on failure
      if (key === 'email') setNotifyEmail(!value);
      if (key === 'push') setNotifyPush(!value);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    setPasswordMsg(null);

    if (newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 8 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setSavingPassword(true);
    try {
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, newPassword);

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMsg({ type: 'success', text: 'Password updated.' });
    } catch (err) {
      console.error('Failed to update password:', err);
      const text =
        err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential'
          ? 'Current password is incorrect.'
          : 'Something went wrong. Try again.';
      setPasswordMsg({ type: 'error', text });
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return <div className="settings-page settings-loading">Loading settings…</div>;
  }

  return (
    <div className="settings-page">
      <h1 className="settings-title">Settings</h1>
      <p className="settings-subtitle">Manage your profile, security, and notifications.</p>

      {/* ── Profile ─────────────────────────────────────────────── */}
      <section className="settings-card">
        <div className="settings-card-header">
          <div className="settings-avatar">{initials}</div>
          <div>
            <h2 className="settings-card-title">Profile</h2>
            <p className="settings-card-desc">This is how teammates will see you.</p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="settings-form">
          <label className="settings-field">
            <span className="settings-label">Full name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="settings-input"
              placeholder="Jane Smith"
            />
          </label>

          <label className="settings-field">
            <span className="settings-label">Email</span>
            <input
              type="email"
              value={email}
              disabled
              className="settings-input settings-input-disabled"
            />
            <span className="settings-hint">Contact support to change your email.</span>
          </label>

          <label className="settings-field">
            <span className="settings-label">Phone (optional)</span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="settings-input"
              placeholder="+1 555 123 4567"
            />
          </label>

          {profileMsg && (
            <p className={`settings-msg settings-msg-${profileMsg.type}`}>{profileMsg.text}</p>
          )}

          <div className="settings-actions">
            <button type="submit" className="settings-btn settings-btn-primary" disabled={savingProfile}>
              {savingProfile ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </section>

      {/* ── Notifications ───────────────────────────────────────── */}
      <section className="settings-card">
        <div className="settings-card-header">
          <div>
            <h2 className="settings-card-title">Notifications</h2>
            <p className="settings-card-desc">Choose how you want to be notified.</p>
          </div>
        </div>

        <div className="settings-toggle-row">
          <div>
            <div className="settings-toggle-label">Email notifications</div>
            <div className="settings-toggle-desc">Messages, schedule changes, and announcements.</div>
          </div>
          <label className="settings-switch">
            <input
              type="checkbox"
              checked={notifyEmail}
              onChange={(e) => handleToggleNotification('email', e.target.checked)}
            />
            <span className="settings-switch-track" />
          </label>
        </div>

        <div className="settings-toggle-row">
          <div>
            <div className="settings-toggle-label">Push notifications</div>
            <div className="settings-toggle-desc">Real-time alerts on your device.</div>
          </div>
          <label className="settings-switch">
            <input
              type="checkbox"
              checked={notifyPush}
              onChange={(e) => handleToggleNotification('push', e.target.checked)}
            />
            <span className="settings-switch-track" />
          </label>
        </div>
      </section>

      {/* ── Security ─────────────────────────────────────────────── */}
      <section className="settings-card">
        <div className="settings-card-header">
          <div>
            <h2 className="settings-card-title">Security</h2>
            <p className="settings-card-desc">Update your password.</p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="settings-form">
          <label className="settings-field">
            <span className="settings-label">Current password</span>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="settings-input"
              autoComplete="current-password"
            />
          </label>

          <label className="settings-field">
            <span className="settings-label">New password</span>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="settings-input"
              autoComplete="new-password"
            />
          </label>

          <label className="settings-field">
            <span className="settings-label">Confirm new password</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="settings-input"
              autoComplete="new-password"
            />
          </label>

          {passwordMsg && (
            <p className={`settings-msg settings-msg-${passwordMsg.type}`}>{passwordMsg.text}</p>
          )}

          <div className="settings-actions">
            <button type="submit" className="settings-btn settings-btn-primary" disabled={savingPassword}>
              {savingPassword ? 'Updating…' : 'Update password'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}