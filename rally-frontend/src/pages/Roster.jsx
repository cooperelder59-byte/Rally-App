import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { useTeam } from '../context/TeamContext';

// ─── Theme ────────────────────────────────────────────────────────────────────
const PRIMARY  = '#c8ff3d';
const BG       = '#0f0f0f';
const SURFACE  = '#161616';
const SURFACE2 = '#1e1e1e';
const BORDER   = '#222';
const TEXT     = '#e8e8e8';
const MUTED    = '#555';
const DANGER   = '#f87171';

const ROLES = ['Player', 'Coach', 'Manager'];
const ROLE_COLOR = { Coach: '#fb923c', Manager: '#a78bfa', Player: MUTED };

// ─── Shared styles (hover/focus/animation need real CSS, not inline) ─────────
function RosterStyles() {
  return (
    <style>{`
      @keyframes cvr-fadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes cvr-popIn { from { opacity: 0; transform: translate(-50%,-50%) scale(0.96); } to { opacity: 1; transform: translate(-50%,-50%) scale(1); } }
      @keyframes cvr-shimmer { 0% { background-position: -200px 0; } 100% { background-position: 200px 0; } }

      .cvr-backdrop { animation: cvr-fadeIn .15s ease-out; }

      /* FIX: without "forwards", the animation's final transform
         (translate(-50%,-50%) scale(1)) is discarded the instant the
         .18s animation ends, and the modal falls back to having NO
         transform at all — leaving its top-left corner (not its
         center) pinned at top:50%/left:50%, which shoves it down and
         off the bottom of the screen. "forwards" keeps that last
         keyframe state applied permanently. */
      .cvr-modal { animation: cvr-popIn .18s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }

      .cvr-input { transition: border-color .15s, background .15s; }
      .cvr-input:focus { border-color: ${PRIMARY} !important; background: ${SURFACE} !important; }

      .cvr-card { transition: border-color .15s, transform .15s; }
      .cvr-card:hover { border-color: #2e2e2e; }

      .cvr-edit-btn { transition: border-color .15s, color .15s; }
      .cvr-edit-btn:hover { border-color: ${PRIMARY}; color: ${PRIMARY}; }

      .cvr-close-btn:hover { border-color: ${MUTED}; }

      .cvr-skeleton {
        background: linear-gradient(90deg, ${SURFACE} 0px, ${SURFACE2} 40px, ${SURFACE} 80px);
        background-size: 200px 100%;
        animation: cvr-shimmer 1.4s ease-in-out infinite;
      }

      @media (max-width: 480px) {
        .cvr-header { flex-direction: column; align-items: flex-start !important; gap: 8px; }
      }
    `}</style>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ name, size = 40 }) {
  const initials = (name || '?').split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: PRIMARY, color: '#000',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 800, fontSize: size * 0.36, flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

// ─── Role Badge ───────────────────────────────────────────────────────────────
function RoleBadge({ role }) {
  const color = ROLE_COLOR[role] || MUTED;
  return (
    <span style={{
      fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
      letterSpacing: '0.07em', color,
      background: color + '18', padding: '3px 8px', borderRadius: 4,
    }}>
      {role || 'Player'}
    </span>
  );
}

// ─── Skeleton row (loading state) ────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{
      background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10,
      padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14,
    }}>
      <div className="cvr-skeleton" style={{ width: 42, height: 42, borderRadius: '50%', flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div className="cvr-skeleton" style={{ width: '40%', height: 12, borderRadius: 4 }} />
        <div className="cvr-skeleton" style={{ width: '25%', height: 10, borderRadius: 4 }} />
      </div>
    </div>
  );
}

// ─── Edit Profile Modal ───────────────────────────────────────────────────────
function EditProfileModal({ member, isCoach, onClose, onSave }) {
  const [name, setName]         = useState(member.name || '');
  const [position, setPosition] = useState(member.position || '');
  const [bio, setBio]           = useState(member.bio || '');
  const [role, setRole]         = useState(member.role || 'Player');
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState(null);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape' && !saving) onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [saving, onClose]);

  async function handleSave() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Display name is required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({ name: trimmedName, position: position.trim(), bio: bio.trim(), role });
      onClose();
    } catch (e) {
      console.error('Failed to save profile changes:', e);
      setError('Could not save changes — please try again.');
      setSaving(false);
    }
  }

  const lbl = { display: 'block', fontSize: 11, fontWeight: 700, color: MUTED, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' };
  const inp = { width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${BORDER}`, fontSize: 14, color: TEXT, background: SURFACE2, boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' };

  return (
    <>
      <div
        className="cvr-backdrop"
        onClick={saving ? undefined : onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, backdropFilter: 'blur(4px)' }}
      />
      <div
        className="cvr-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Edit profile"
        style={{
          position: 'fixed', top: '50%', left: '50%',
          width: 'min(440px, calc(100vw - 32px))',
          background: SURFACE, borderRadius: 14, zIndex: 101,
          border: `1px solid ${BORDER}`,
          boxShadow: '0 32px 80px rgba(0,0,0,0.8)',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 3, height: 18, borderRadius: 2, background: PRIMARY }} />
            <h2 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: TEXT, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Edit Profile</h2>
          </div>
          <button
            onClick={saving ? undefined : onClose}
            disabled={saving}
            className="cvr-close-btn"
            style={{ background: SURFACE2, border: `1px solid ${BORDER}`, cursor: saving ? 'not-allowed' : 'pointer', width: 28, height: 28, borderRadius: 7, fontSize: 16, color: MUTED, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >×</button>
        </div>

        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
            <Avatar name={name} size={64} />
          </div>

          <div>
            <label style={lbl}>Display name</label>
            <input className="cvr-input" value={name} onChange={e => setName(e.target.value)} style={inp} placeholder="Your name" disabled={saving} maxLength={60} />
          </div>

          <div>
            <label style={lbl}>Position / role on team</label>
            <input className="cvr-input" value={position} onChange={e => setPosition(e.target.value)} style={inp} placeholder="e.g. Midfielder, Point Guard, Setter…" disabled={saving} maxLength={60} />
          </div>

          <div>
            <label style={lbl}>Bio</label>
            <textarea className="cvr-input" value={bio} onChange={e => setBio(e.target.value)} rows={2} style={{ ...inp, resize: 'vertical' }} placeholder="A short intro…" disabled={saving} maxLength={280} />
          </div>

          {isCoach && (
            <div>
              <label style={lbl}>Team role</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {ROLES.map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    disabled={saving}
                    style={{
                      flex: 1, padding: '8px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                      cursor: saving ? 'not-allowed' : 'pointer', border: `1px solid ${role === r ? ROLE_COLOR[r] : BORDER}`,
                      background: role === r ? ROLE_COLOR[r] + '22' : 'transparent',
                      color: role === r ? ROLE_COLOR[r] : MUTED,
                      transition: 'all .15s',
                    }}
                  >{r}</button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div style={{ fontSize: 12, color: DANGER, background: DANGER + '18', border: `1px solid ${DANGER}44`, borderRadius: 8, padding: '8px 10px' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button onClick={saving ? undefined : onClose} disabled={saving} style={{ flex: 1, padding: 11, borderRadius: 9, background: SURFACE2, color: MUTED, border: `1px solid ${BORDER}`, fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>Cancel</button>
            <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: 11, borderRadius: 9, background: PRIMARY, color: '#000', border: 'none', fontSize: 13, fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Member Card ──────────────────────────────────────────────────────────────
function MemberCard({ member, canEdit, isCoach, onEdit }) {
  return (
    <div
      className="cvr-card"
      style={{
        background: SURFACE, border: `1px solid ${BORDER}`,
        borderRadius: 10, padding: '14px 16px',
        display: 'flex', alignItems: 'center', gap: 14,
      }}
    >
      <Avatar name={member.name} size={42} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: TEXT, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {member.name || 'Unnamed'}
          </span>
          <RoleBadge role={member.role} />
        </div>

        {member.position && (
          <div style={{ fontSize: 12, color: PRIMARY, fontWeight: 600, marginBottom: 2 }}>
            {member.position}
          </div>
        )}

        {member.bio && (
          <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {member.bio}
          </div>
        )}

        <div style={{ fontSize: 11, color: MUTED, marginTop: member.bio ? 4 : 2 }}>
          {member.email}
        </div>
      </div>

      {canEdit && (
        <button
          onClick={() => onEdit(member)}
          className="cvr-edit-btn"
          style={{
            background: 'none', border: `1px solid ${BORDER}`,
            borderRadius: 7, padding: '5px 12px',
            fontSize: 11, fontWeight: 700, color: MUTED,
            cursor: 'pointer', flexShrink: 0,
          }}
        >
          Edit
        </button>
      )}
    </div>
  );
}

// ─── Grouping helper (mutually exclusive — no double-counting the owner) ────
function roleOf(member, ownerId) {
  if (member.role === 'Coach' || member.role === 'Manager') return member.role;
  if (member.uid === ownerId) return 'Coach';
  return 'Player';
}

// ─── Main Roster ──────────────────────────────────────────────────────────────
export default function Roster() {
  const { currentTeam } = useTeam();
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [members, setMembers]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [loadError, setLoadError]     = useState(null);
  const [editingMember, setEditingMember] = useState(null);
  const [search, setSearch]           = useState('');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setCurrentUser(u));
    return () => unsub();
  }, []);

  // Live-subscribes to each member's user doc, so edits (by anyone, from any
  // device) show up immediately without a manual refresh. Individual doc
  // failures are tolerated — one broken doc no longer blanks the whole roster.
  const memberIdsKey = (currentTeam?.memberIds || []).join(',');
  useEffect(() => {
    if (!currentTeam?.memberIds?.length) {
      setMembers([]);
      setLoading(false);
      setLoadError(null);
      return;
    }

    const uids = Array.from(new Set(currentTeam.memberIds));
    const dataByUid = new Map();
    const settled = new Set();
    let cancelled = false;

    setLoading(true);
    setLoadError(null);

    function publish() {
      if (cancelled) return;
      setMembers(uids.map(u => dataByUid.get(u)).filter(Boolean));
      if (settled.size >= uids.length) setLoading(false);
    }

    const unsubs = uids.map(uid =>
      onSnapshot(
        doc(db, 'users', uid),
        snap => {
          if (cancelled) return;
          if (snap.exists()) {
            const d = snap.data();
            dataByUid.set(uid, {
              uid,
              name: d.name || d.displayName || '',
              email: d.email || '',
              role: d.role || 'Player',
              position: d.position || '',
              bio: d.bio || '',
            });
          } else {
            dataByUid.delete(uid);
          }
          settled.add(uid);
          publish();
        },
        err => {
          if (cancelled) return;
          console.error(`Roster: failed to subscribe to user ${uid}:`, err);
          settled.add(uid);
          setLoadError('Some team members could not be loaded.');
          publish();
        }
      )
    );

    return () => {
      cancelled = true;
      unsubs.forEach(u => u());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTeam?.id, memberIdsKey]);

  const currentMember = members.find(m => m.uid === currentUser?.uid);
  const isCoach = currentTeam?.ownerId === currentUser?.uid || currentMember?.role === 'Coach';

  async function handleSave(updates) {
    if (!editingMember) return;
    // No manual local-state merge needed — the onSnapshot listener above
    // will pick up this write and update `members` on its own.
    await updateDoc(doc(db, 'users', editingMember.uid), updates);
  }

  const grouped = { Coach: [], Manager: [], Player: [] };
  members.forEach(m => grouped[roleOf(m, currentTeam?.ownerId)].push(m));

  const searchLower = search.trim().toLowerCase();
  const filtered = (list) => searchLower
    ? list.filter(m => [m.name, m.position, m.email].some(f => (f || '').toLowerCase().includes(searchLower)))
    : list;

  const totalVisible = Object.values(grouped).reduce((sum, list) => sum + filtered(list).length, 0);

  if (!currentTeam) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: MUTED, fontSize: 13 }}>
      Select a team to view the roster
    </div>
  );

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", color: TEXT, minHeight: '100vh' }}>
      <RosterStyles />
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 0 80px' }}>

        {/* Header */}
        <div className="cvr-header" style={{ padding: '24px 0 20px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: PRIMARY, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
              {currentTeam.name}
            </div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: TEXT, letterSpacing: '-0.02em' }}>
              Roster
            </h1>
          </div>
          <div style={{ fontSize: 13, color: MUTED, fontWeight: 600 }}>
            {members.length} member{members.length !== 1 ? 's' : ''}
          </div>
        </div>

        {loadError && (
          <div style={{ fontSize: 12, color: DANGER, background: DANGER + '18', border: `1px solid ${DANGER}44`, borderRadius: 8, padding: '8px 10px', marginBottom: 16 }}>
            {loadError}
          </div>
        )}

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 24 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: MUTED, fontSize: 14, pointerEvents: 'none' }}>⌕</span>
          <input
            className="cvr-input"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or position…"
            style={{
              width: '100%', padding: '10px 12px 10px 34px',
              borderRadius: 9, border: `1px solid ${BORDER}`,
              background: SURFACE, color: TEXT, fontSize: 14,
              outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
            }}
          />
        </div>

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[0, 1, 2].map(i => <SkeletonCard key={i} />)}
          </div>
        )}

        {!loading && members.length > 0 && totalVisible === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: MUTED, fontSize: 13 }}>
            No members match “{search}”
          </div>
        )}

        {!loading && members.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: MUTED, fontSize: 13 }}>
            No members on this team yet
          </div>
        )}

        {!loading && Object.entries(grouped).map(([group, list]) => {
          const visible = filtered(list);
          if (!visible.length) return null;
          return (
            <div key={group} style={{ marginBottom: 28 }}>
              <div style={{
                fontSize: 11, fontWeight: 800, textTransform: 'uppercase',
                letterSpacing: '0.1em', color: ROLE_COLOR[group] || MUTED,
                marginBottom: 10, paddingBottom: 8, borderBottom: `1px solid ${BORDER}`,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                {group}s <span style={{ color: MUTED, fontWeight: 600 }}>· {visible.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {visible.map(m => (
                  <MemberCard
                    key={m.uid}
                    member={m}
                    canEdit={isCoach || m.uid === currentUser?.uid}
                    isCoach={isCoach}
                    onEdit={setEditingMember}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {editingMember && (
        <EditProfileModal
          member={editingMember}
          isCoach={isCoach && editingMember.uid !== currentUser?.uid}
          onClose={() => setEditingMember(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}