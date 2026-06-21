import { useEffect, useState, useMemo, useRef } from 'react';
import {
  addDoc, collection, deleteDoc, doc,
  onSnapshot, query, serverTimestamp,
  updateDoc, getDoc, where,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { useTeam } from '../context/TeamContext';

// ─── Theme ────────────────────────────────────────────────────────────────────
const LIME   = '#B3F500';
const BG     = '#0D0D0D';
const SURFACE  = '#1A1A1A';
const SURFACE2 = '#222222';
const BORDER   = '#2A2A2A';
const TEXT     = '#FFFFFF';
const MUTED    = '#6B6B6B';

const TYPE_META = {
  practice:   { color: '#B3F500', label: 'Practice'   },
  game:       { color: '#B3F500', label: 'Game'       },
  meeting:    { color: '#B3F500', label: 'Meeting'    },
  tournament: { color: '#B3F500', label: 'Tournament' },
  training:   { color: '#B3F500', label: 'Training'   },
  other:      { color: '#B3F500', label: 'Other'      },
};
const EVENT_TYPES = Object.keys(TYPE_META);

function typeColor(t) { return (TYPE_META[t] || TYPE_META.other).color; }
function typeLabel(t) { return (TYPE_META[t] || TYPE_META.other).label; }

function fmt12(t) {
  if (!t) return null;
  const [h, m] = t.split(':');
  const hr = parseInt(h, 10);
  return `${hr % 12 || 12}:${m} ${hr < 12 ? 'AM' : 'PM'}`;
}

function dayName(date) {
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

// ─── Shared input styles ──────────────────────────────────────────────────────
const lbl = {
  display: 'block', fontSize: 11, fontWeight: 700,
  color: MUTED, marginBottom: 6,
  textTransform: 'uppercase', letterSpacing: '0.07em',
};
const inp = {
  width: '100%', padding: '10px 12px', borderRadius: 8,
  border: `1.5px solid ${BORDER}`, fontSize: 14, color: TEXT,
  background: SURFACE2, boxSizing: 'border-box', outline: 'none',
  fontFamily: 'inherit',
};

// ─── Resize image to base64 ───────────────────────────────────────────────────
function resizeToBase64(file, maxDim = 1200, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width > height) { height = Math.round((height / width) * maxDim); width = maxDim; }
        else { width = Math.round((width / height) * maxDim); height = maxDim; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = reject;
    img.src = url;
  });
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ name, size = 30 }) {
  const initials = (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: LIME, color: '#000',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 800, fontSize: size * 0.36, flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

// ─── RSVP Buttons ─────────────────────────────────────────────────────────────
function RsvpButtons({ eventId, teamId, currentUser, rsvps = {} }) {
  const myRsvp = rsvps[currentUser?.uid];

  async function setRsvp(status) {
    if (!currentUser || !teamId) return;
    await updateDoc(doc(db, 'teams', teamId, 'events', eventId), {
      [`rsvps.${currentUser.uid}`]: status,
      [`rsvpNames.${currentUser.uid}`]: currentUser.displayName || currentUser.email,
    });
  }

  return (
    <div style={{ display: 'flex', gap: 6 }}>
      <button
        onClick={(e) => { e.stopPropagation(); setRsvp('going'); }}
        style={{
          padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 800,
          border: 'none', cursor: 'pointer', transition: 'all 0.15s',
          background: myRsvp === 'going' ? '#22C55E' : SURFACE2,
          color: myRsvp === 'going' ? '#fff' : MUTED,
        }}
      >
        ✓ Going
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); setRsvp('not_going'); }}
        style={{
          padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 800,
          border: 'none', cursor: 'pointer', transition: 'all 0.15s',
          background: myRsvp === 'not_going' ? '#EF4444' : SURFACE2,
          color: myRsvp === 'not_going' ? '#fff' : MUTED,
        }}
      >
        ✕ Not going
      </button>
    </div>
  );
}

// ─── Attendance Panel ─────────────────────────────────────────────────────────
function AttendancePanel({ event, teamId, currentTeam, onClose }) {
  const [members, setMembers] = useState([]);

  useEffect(() => {
    if (!currentTeam?.memberIds) return;
    Promise.all(
      currentTeam.memberIds.map(uid => getDoc(doc(db, 'users', uid)))
    ).then(docs => {
      setMembers(docs.map((d, i) => ({
        uid: currentTeam.memberIds[i],
        name: d.exists() ? (d.data().name || d.data().displayName || d.data().email) : 'Unknown',
      })));
    });
  }, [currentTeam]);

  const rsvps = event.rsvps || {};
  const going     = members.filter(m => rsvps[m.uid] === 'going');
  const notGoing  = members.filter(m => rsvps[m.uid] === 'not_going');
  const pending   = members.filter(m => !rsvps[m.uid]);

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 60, backdropFilter: 'blur(2px)' }} />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 'min(360px, 100vw)',
        background: BG, zIndex: 61,
        display: 'flex', flexDirection: 'column',
        borderLeft: `1px solid ${BORDER}`,
        boxShadow: '-8px 0 40px rgba(0,0,0,0.5)',
      }}>
        <div style={{ padding: '20px 20px 16px', borderBottom: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 11, color: typeColor(event.type), fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
              {typeLabel(event.type)}
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: TEXT }}>{event.title}</div>
            <div style={{ fontSize: 12, color: MUTED, marginTop: 3 }}>
              {new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              {event.startTime && ` · ${fmt12(event.startTime)}`}
            </div>
          </div>
          <button onClick={onClose} style={{ background: SURFACE, border: `1px solid ${BORDER}`, cursor: 'pointer', width: 30, height: 30, borderRadius: 8, fontSize: 18, color: MUTED, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>×</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {[
            { label: 'Going', list: going, color: '#22C55E', icon: '✓' },
            { label: 'Not going', list: notGoing, color: '#EF4444', icon: '✕' },
            { label: 'No response', list: pending, color: MUTED, icon: '?' },
          ].map(({ label, list, color, icon }) => (
            list.length > 0 && (
              <div key={label} style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
                  {icon} {label} · {list.length}
                </div>
                {list.map(m => (
                  <div key={m.uid} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${BORDER}` }}>
                    <Avatar name={m.name} size={32} />
                    <span style={{ fontSize: 14, color: TEXT, fontWeight: 500 }}>{m.name}</span>
                  </div>
                ))}
              </div>
            )
          ))}
        </div>
      </div>
    </>
  );
}

// ─── Event Photos ─────────────────────────────────────────────────────────────
function EventPhotos({ eventId, teamId }) {
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const fileRef = useRef();
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!teamId || !eventId) return;
    const unsub = onSnapshot(
      collection(db, 'teams', teamId, 'events', eventId, 'photos'),
      snap => setPhotos(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    return () => unsub();
  }, [teamId, eventId]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setUploading(true);
    try {
      const base64 = await resizeToBase64(file);
      await addDoc(collection(db, 'teams', teamId, 'events', eventId, 'photos'), {
        url: base64,
        uploaderName: currentUser?.displayName || currentUser?.email || 'Someone',
        createdAt: serverTimestamp(),
      });
    } catch (err) { console.error(err); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ''; }
  };

  return (
    <div style={{ marginTop: 16 }}>
      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.93)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <img src={lightbox} alt="Photo" style={{ maxWidth: '90vw', maxHeight: '88vh', objectFit: 'contain', borderRadius: 8 }} />
        </div>
      )}

      {photos.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 6, marginBottom: 10 }}>
          {photos.map(p => (
            <div key={p.id} onClick={() => setLightbox(p.url)} style={{ paddingBottom: '100%', position: 'relative', borderRadius: 8, overflow: 'hidden', cursor: 'pointer', background: SURFACE2 }}>
              <img src={p.url} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ))}
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUpload} />
      <button
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        style={{
          background: 'none', border: `1px dashed ${BORDER}`,
          borderRadius: 8, padding: '7px 14px',
          fontSize: 12, color: MUTED, cursor: uploading ? 'default' : 'pointer',
          fontWeight: 600, transition: 'all 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = LIME; e.currentTarget.style.color = LIME; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = MUTED; }}
      >
        {uploading ? 'Uploading…' : '📷 Add photo'}
      </button>
    </div>
  );
}

// ─── Event Row ────────────────────────────────────────────────────────────────
function EventRow({ event, teamId, currentTeam, currentUser, onDelete, onAttendance }) {
  const [expanded, setExpanded] = useState(false);
  const date = new Date(event.date);
  const color = typeColor(event.type);
  const isOwner = event.createdBy === currentUser?.uid || currentTeam?.ownerId === currentUser?.uid;

  return (
    <div style={{
      display: 'flex', gap: 0,
      borderRadius: 12, overflow: 'hidden',
      background: SURFACE, border: `1px solid ${BORDER}`,
      marginBottom: 8, cursor: 'pointer',
      transition: 'border-color 0.15s',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = '#3A3A3A'}
      onMouseLeave={e => e.currentTarget.style.borderColor = BORDER}
    >
      {/* Colored left bar */}
      <div style={{ width: 4, background: color, flexShrink: 0 }} />

      {/* Date block */}
      <div
        onClick={() => setExpanded(p => !p)}
        style={{
          minWidth: 56, padding: '16px 10px',
          textAlign: 'center', borderRight: `1px solid ${BORDER}`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: TEXT, lineHeight: 1 }}>{date.getDate()}</div>
        <div style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>
          {date.toLocaleDateString('en-US', { month: 'short' })}
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, padding: '14px 16px', minWidth: 0 }} onClick={() => setExpanded(p => !p)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{ fontSize: 10, fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {typeLabel(event.type)}
          </span>
        </div>
        <div style={{ fontSize: 16, fontWeight: 800, color: TEXT, marginBottom: 4 }}>{event.title}</div>
        <div style={{ fontSize: 12, color: MUTED, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <span>{dayName(date)}{event.startTime ? `, ${fmt12(event.startTime)}` : ''}{event.endTime ? ` – ${fmt12(event.endTime)}` : ''}</span>
          {event.location && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>📍 {event.location}</span>}
        </div>
      </div>

      {/* Right actions */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between', padding: '12px 14px', gap: 8, flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={(e) => { e.stopPropagation(); onAttendance(event); }}
            title="See attendance"
            style={{ background: SURFACE2, border: `1px solid ${BORDER}`, borderRadius: 7, padding: '4px 10px', fontSize: 11, fontWeight: 700, color: MUTED, cursor: 'pointer' }}
          >
            👥 {Object.values(event.rsvps || {}).filter(v => v === 'going').length} going
          </button>
          {isOwner && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(event.id); }}
              style={{ background: 'none', border: 'none', color: MUTED, fontSize: 18, cursor: 'pointer', lineHeight: 1, padding: '2px 4px' }}
              onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
              onMouseLeave={e => e.currentTarget.style.color = MUTED}
            >×</button>
          )}
        </div>
        <RsvpButtons eventId={event.id} teamId={teamId} currentUser={currentUser} rsvps={event.rsvps} />
      </div>
    </div>
  );
}

// Add expanded section below if clicked
function EventRowWithExpand({ event, teamId, currentTeam, currentUser, onDelete, onAttendance }) {
  const [expanded, setExpanded] = useState(false);
  const date = new Date(event.date);
  const color = typeColor(event.type);
  const isOwner = event.createdBy === currentUser?.uid || currentTeam?.ownerId === currentUser?.uid;

  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{
        display: 'flex', gap: 0,
        borderRadius: expanded ? '12px 12px 0 0' : 12, overflow: 'hidden',
        background: SURFACE, border: `1px solid ${BORDER}`,
        borderBottom: expanded ? 'none' : `1px solid ${BORDER}`,
        transition: 'border-color 0.15s', cursor: 'pointer',
      }}>
        <div style={{ width: 4, background: color, flexShrink: 0 }} />

        <div
          onClick={() => setExpanded(p => !p)}
          style={{ minWidth: 56, padding: '16px 10px', textAlign: 'center', borderRight: `1px solid ${BORDER}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
        >
          <div style={{ fontSize: 22, fontWeight: 900, color: TEXT, lineHeight: 1 }}>{date.getDate()}</div>
          <div style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>
            {date.toLocaleDateString('en-US', { month: 'short' })}
          </div>
        </div>

        <div style={{ flex: 1, padding: '14px 16px', minWidth: 0 }} onClick={() => setExpanded(p => !p)}>
          <div style={{ fontSize: 10, fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>
            {typeLabel(event.type)}
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: TEXT, marginBottom: 4 }}>{event.title}</div>
          <div style={{ fontSize: 12, color: MUTED, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <span>{dayName(date)}{event.startTime ? `, ${fmt12(event.startTime)}` : ''}{event.endTime ? ` – ${fmt12(event.endTime)}` : ''}</span>
            {event.location && <span>📍 {event.location}</span>}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between', padding: '12px 14px', gap: 8, flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button
              onClick={(e) => { e.stopPropagation(); onAttendance(event); }}
              style={{ background: SURFACE2, border: `1px solid ${BORDER}`, borderRadius: 7, padding: '4px 10px', fontSize: 11, fontWeight: 700, color: MUTED, cursor: 'pointer' }}
            >
              👥 {Object.values(event.rsvps || {}).filter(v => v === 'going').length} going
            </button>
            {isOwner && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(event.id); }}
                style={{ background: 'none', border: 'none', color: MUTED, fontSize: 18, cursor: 'pointer', padding: '2px 4px', lineHeight: 1 }}
                onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
                onMouseLeave={e => e.currentTarget.style.color = MUTED}
              >×</button>
            )}
          </div>
          <RsvpButtons eventId={event.id} teamId={teamId} currentUser={currentUser} rsvps={event.rsvps} />
        </div>
      </div>

      {expanded && (
        <div style={{
          background: SURFACE, border: `1px solid ${BORDER}`, borderTop: `1px solid ${BORDER}`,
          borderRadius: '0 0 12px 12px', padding: '14px 20px 16px 74px',
        }}>
          {event.description && (
            <p style={{ margin: '0 0 12px', fontSize: 13, color: '#999', lineHeight: 1.6 }}>{event.description}</p>
          )}
          <EventPhotos eventId={event.id} teamId={teamId} />
        </div>
      )}
    </div>
  );
}

// ─── Create Event Modal ───────────────────────────────────────────────────────
function CreateEventModal({ onClose, onSubmit, prefillDate }) {
  const [formData, setFormData] = useState({
    title: '', type: 'practice',
    date: prefillDate ? prefillDate.toISOString().split('T')[0] : '',
    startTime: '', endTime: '', location: '', description: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function set(key, val) { setFormData(p => ({ ...p, [key]: val })); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.title.trim()) { setError('Title is required'); return; }
    if (!formData.date) { setError('Date is required'); return; }
    setError(''); setSaving(true);
    await onSubmit(formData);
    setSaving(false);
  }

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 100, backdropFilter: 'blur(3px)' }} onClick={onClose} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 'min(480px, calc(100vw - 32px))',
        background: BG, borderRadius: 16, zIndex: 101,
        border: `1px solid ${BORDER}`,
        boxShadow: '0 24px 60px rgba(0,0,0,0.7)',
        overflow: 'hidden',
      }} onClick={e => e.stopPropagation()}>

        <div style={{ padding: '18px 22px 14px', borderBottom: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: TEXT, textTransform: 'uppercase', letterSpacing: '0.06em' }}>New Event</h2>
          <button onClick={onClose} style={{ background: SURFACE, border: `1px solid ${BORDER}`, cursor: 'pointer', width: 30, height: 30, borderRadius: 8, fontSize: 17, color: MUTED, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 22 }}>
          {error && <div style={{ background: '#2A0000', color: '#EF4444', border: '1px solid #3D0000', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{error}</div>}

          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Title *</label>
            <input autoFocus type="text" value={formData.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Tuesday Practice" style={inp} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <label style={lbl}>Type</label>
              <select value={formData.type} onChange={e => set('type', e.target.value)} style={inp}>
                {EVENT_TYPES.map(t => <option key={t} value={t}>{typeLabel(t)}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Date *</label>
              <input type="date" value={formData.date} onChange={e => set('date', e.target.value)} style={inp} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <label style={lbl}>Start time</label>
              <input type="time" value={formData.startTime} onChange={e => set('startTime', e.target.value)} style={inp} />
            </div>
            <div>
              <label style={lbl}>End time</label>
              <input type="time" value={formData.endTime} onChange={e => set('endTime', e.target.value)} style={inp} />
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Location</label>
            <input type="text" value={formData.location} onChange={e => set('location', e.target.value)} placeholder="e.g. Field 3, Central Park" style={inp} />
          </div>

          <div style={{ marginBottom: 22 }}>
            <label style={lbl}>Notes</label>
            <textarea value={formData.description} onChange={e => set('description', e.target.value)} placeholder="Any extra details…" rows={3} style={{ ...inp, resize: 'vertical' }} />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: 11, borderRadius: 10, background: SURFACE2, color: MUTED, border: `1px solid ${BORDER}`, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={saving} style={{ flex: 2, padding: 11, borderRadius: 10, background: LIME, color: '#000', border: 'none', fontSize: 14, fontWeight: 900, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Creating…' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

// ─── Main Schedule ────────────────────────────────────────────────────────────
export default function Schedule() {
  const { currentTeam } = useTeam();
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [attendanceEvent, setAttendanceEvent] = useState(null);
  const [filter, setFilter] = useState('upcoming'); // upcoming | past | all
  const [toast, setToast] = useState('');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setCurrentUser(u));
    return () => unsub();
  }, []);

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3000); }

  useEffect(() => {
    if (!currentTeam?.id) { setEvents([]); setLoading(false); return; }
    setLoading(true);
    const q = collection(db, 'teams', currentTeam.id, 'events');
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs
        .map(d => ({ id: d.id, ...d.data(), date: d.data().date?.toDate?.() || new Date(d.data().date) }))
        .filter(e => e.status !== 'cancelled')
        .sort((a, b) => a.date - b.date);
      setEvents(list);
      setLoading(false);
    });
    return () => unsub();
  }, [currentTeam?.id]);

  async function handleCreateEvent(formData) {
    if (!currentTeam?.id || !currentUser) return;
    const eventDate = new Date(formData.date + 'T12:00:00');
    await addDoc(collection(db, 'teams', currentTeam.id, 'events'), {
      title: formData.title.trim(), type: formData.type, date: eventDate,
      startTime: formData.startTime, endTime: formData.endTime,
      location: formData.location.trim(), description: formData.description.trim(),
      createdBy: currentUser.uid, createdAt: serverTimestamp(),
      status: 'active', rsvps: { [currentUser.uid]: 'going' },
      rsvpNames: { [currentUser.uid]: currentUser.displayName || currentUser.email },
    });
    setShowCreate(false);
    showToast('✓ Event created');
  }

  async function handleDeleteEvent(eventId) {
    if (!window.confirm('Delete this event?')) return;
    await deleteDoc(doc(db, 'teams', currentTeam.id, 'events', eventId));
    showToast('✓ Event deleted');
  }

  const now = new Date();
  const filteredEvents = useMemo(() => {
    if (filter === 'upcoming') return events.filter(e => new Date(e.date) >= new Date(now.setHours(0,0,0,0)));
    if (filter === 'past')     return events.filter(e => new Date(e.date) < new Date()).reverse();
    return events;
  }, [events, filter]);

  // Group by month
  const grouped = useMemo(() => {
    const groups = {};
    filteredEvents.forEach(ev => {
      const key = new Date(ev.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      if (!groups[key]) groups[key] = [];
      groups[key].push(ev);
    });
    return Object.entries(groups);
  }, [filteredEvents]);

  if (!currentTeam) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: MUTED, fontSize: 15, background: BG }}>
      Select a team to view the schedule
    </div>
  );

  return (
    <div style={{ background: BG, minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif', color: TEXT }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 20px 80px' }}>

        {/* Toast */}
        {toast && (
          <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: LIME, color: '#000', padding: '10px 22px', borderRadius: 99, fontSize: 14, fontWeight: 800, zIndex: 200, boxShadow: `0 4px 20px ${LIME}44` }}>
            {toast}
          </div>
        )}

        {/* Header */}
        <div style={{ padding: '28px 0 20px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: LIME, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
              {currentTeam.name}
            </div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: TEXT, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Schedule
            </h1>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            style={{ background: LIME, color: '#000', border: 'none', padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 900, cursor: 'pointer', letterSpacing: '0.04em' }}
          >
            + New Event
          </button>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: `1px solid ${BORDER}`, paddingBottom: 0 }}>
          {[['upcoming', 'Upcoming'], ['past', 'Past'], ['all', 'All']].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setFilter(id)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '10px 16px', fontSize: 12, fontWeight: 800, letterSpacing: '0.06em',
                color: filter === id ? LIME : MUTED,
                borderBottom: filter === id ? `2px solid ${LIME}` : '2px solid transparent',
                marginBottom: -1, transition: 'all 0.15s',
              }}
            >
              {label.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Event list */}
        {loading && <div style={{ textAlign: 'center', padding: '60px 0', color: MUTED }}>Loading…</div>}

        {!loading && grouped.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: MUTED }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📅</div>
            <div style={{ fontWeight: 800, fontSize: 16, color: '#444', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>No events</div>
            <div style={{ fontSize: 13 }}>Hit "New Event" to get started</div>
          </div>
        )}

        {grouped.map(([month, evs]) => (
          <div key={month} style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: LIME, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, paddingBottom: 8, borderBottom: `1px solid ${BORDER}` }}>
              {month} · {evs.length}
            </div>
            {evs.map(ev => (
              <EventRowWithExpand
                key={ev.id}
                event={ev}
                teamId={currentTeam.id}
                currentTeam={currentTeam}
                currentUser={currentUser}
                onDelete={handleDeleteEvent}
                onAttendance={setAttendanceEvent}
              />
            ))}
          </div>
        ))}
      </div>

      {attendanceEvent && (
        <AttendancePanel
          event={attendanceEvent}
          teamId={currentTeam.id}
          currentTeam={currentTeam}
          onClose={() => setAttendanceEvent(null)}
        />
      )}

      {showCreate && (
        <CreateEventModal
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreateEvent}
        />
      )}
    </div>
  );
}
