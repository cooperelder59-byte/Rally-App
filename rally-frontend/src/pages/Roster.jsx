import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc, onSnapshot, collection } from 'firebase/firestore';
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

const ROLES = ['Player', 'Coach', 'Manager'];
const ROLE_COLOR = { Coach: '#fb923c', Manager: '#a78bfa', Player: MUTED };

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ name, size = 40 }) {
  const initials = (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
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

// ─── Edit Profile Modal ───────────────────────────────────────────────────────
function EditProfileModal({ member, isCoach, onClose, onSave }) {
  const [name, setName]         = useState(member.name || '');
  const [position, setPosition] = useState(member.position || '');
  const [bio, setBio]           = useState(member.bio || '');
  const [role, setRole]         = useState(member.role || 'Player');
  const [saving, setSaving]     = useState(false);

  async function handleSave() {
    setSaving(true);
    await onSave({ name, position, bio, role });
    setSaving(false);
    onClose();
  }

  const lbl = { display: 'block', fontSize: 11, fontWeight: 700, color: MUTED, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' };
  const inp = { width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${BORDER}`, fontSize: 14, color: TEXT, background: SURFACE2, boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, backdropFilter: 'blur(4px)' }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 'min(440px, calc(100vw - 32px))',
        background: SURFACE, borderRadius: 14, zIndex: 101,
        border: `1px solid ${BORDER}`,
        boxShadow: '0 32px 80px rgba(0,0,0,0.8)',
        overflow: 'hidden',
      }} onClick={e => e.stopPropagation()}>

        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 3, height: 18, borderRadius: 2, background: PRIMARY }} />
            <h2 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: TEXT, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Edit Profile</h2>
          </div>
          <button onClick={onClose} style={{ background: SURFACE2, border: `1px solid ${BORDER}`, cursor: 'pointer', width: 28, height: 28, borderRadius: 7, fontSize: 16, color: MUTED, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>

        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
            <Avatar name={name} size={64} />
          </div>

          <div>
            <label style={lbl}>Display name</label>
            <input value={name} onChange={e => setName(e.target.value)} style={inp} placeholder="Your name" />
          </div>

          <div>
            <label style={lbl}>Position / role on team</label>
            <input value={position} onChange={e => setPosition(e.target.value)} style={inp} placeholder="e.g. Midfielder, Point Guard, Setter…" />
          </div>

          <div>
            <label style={lbl}>Bio</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} rows={2} style={{ ...inp, resize: 'vertical' }} placeholder="A short intro…" />
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
                    style={{
                      flex: 1, padding: '8px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                      cursor: 'pointer', border: `1px solid ${role === r ? ROLE_COLOR[r] : BORDER}`,
                      background: role === r ? ROLE_COLOR[r] + '22' : 'transparent',
                      color: role === r ? ROLE_COLOR[r] : MUTED,
                      transition: 'all .15s',
                    }}
                  >{r}</button>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button onClick={onClose} style={{ flex: 1, padding: 11, borderRadius: 9, background: SURFACE2, color: MUTED, border: `1px solid ${BORDER}`, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
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
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{
        background: SURFACE, border: `1px solid ${hovered ? '#2e2e2e' : BORDER}`,
        borderRadius: 10, padding: '14px 16px',
        display: 'flex', alignItems: 'center', gap: 14,
        transition: 'border-color .15s',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
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
          style={{
            background: 'none', border: `1px solid ${BORDER}`,
            borderRadius: 7, padding: '5px 12px',
            fontSize: 11, fontWeight: 700, color: MUTED,
            cursor: 'pointer', flexShrink: 0,
            transition: 'all .15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = PRIMARY; e.currentTarget.style.color = PRIMARY; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = MUTED; }}
        >
          Edit
        </button>
      )}
    </div>
  );
}

// ─── Main Roster ──────────────────────────────────────────────────────────────
export default function Roster() {
  const { currentTeam } = useTeam();
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [members, setMembers]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [editingMember, setEditingMember] = useState(null);
  const [search, setSearch]           = useState('');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setCurrentUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!currentTeam?.memberIds?.length) { setMembers([]); setLoading(false); return; }
    setLoading(true);
    Promise.all(
      currentTeam.memberIds.map(uid => getDoc(doc(db, 'users', uid)))
    ).then(docs => {
      setMembers(docs.map((d, i) => ({
        uid: currentTeam.memberIds[i],
        name:     d.exists() ? (d.data().name || d.data().displayName || '') : '',
        email:    d.exists() ? d.data().email : '',
        role:     d.exists() ? (d.data().role || 'Player') : 'Player',
        position: d.exists() ? (d.data().position || '') : '',
        bio:      d.exists() ? (d.data().bio || '') : '',
      })));
      setLoading(false);
    });
  }, [currentTeam]);

  const myRole = members.find(m => m.uid === currentUser?.uid)?.role;
  const isCoach = myRole === 'Coach' || currentTeam?.ownerId === currentUser?.uid;

  async function handleSave(updates) {
    if (!editingMember) return;
    await updateDoc(doc(db, 'users', editingMember.uid), updates);
    setMembers(prev => prev.map(m => m.uid === editingMember.uid ? { ...m, ...updates } : m));
  }

  const grouped = {
    Coach:   members.filter(m => m.role === 'Coach' || (m.uid === currentTeam?.ownerId && m.role !== 'Manager')),
    Manager: members.filter(m => m.role === 'Manager'),
    Player:  members.filter(m => !m.role || m.role === 'Player'),
  };

  const filtered = (list) => search
    ? list.filter(m => (m.name + m.position + m.email).toLowerCase().includes(search.toLowerCase()))
    : list;

  if (!currentTeam) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: MUTED, fontSize: 13 }}>
      Select a team to view the roster
    </div>
  );

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", color: TEXT, minHeight: '100vh' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 0 80px' }}>

        {/* Header */}
        <div style={{ padding: '24px 0 20px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
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

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 24 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: MUTED, fontSize: 14, pointerEvents: 'none' }}>⌕</span>
          <input
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

        {loading && <div style={{ textAlign: 'center', padding: '60px 0', color: MUTED, fontSize: 13 }}>Loading…</div>}

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