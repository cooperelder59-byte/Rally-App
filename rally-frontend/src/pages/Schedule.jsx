import { useEffect, useState, useMemo, useRef } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { useTeam } from '../context/TeamContext';

// ─── Theme ───────────────────────────────────────────────────────────────────

const LIME = '#B3F500';
const BG = '#0D0D0D';
const SURFACE = '#1A1A1A';
const BORDER = '#2A2A2A';
const TEXT = '#FFFFFF';
const MUTED = '#6B6B6B';
const MUTED2 = '#3A3A3A';

const TYPE_COLORS = {
  practice:   '#4F46E5',
  game:       '#EF4444',
  meeting:    '#22C55E',
  tournament: '#F97316',
  training:   '#38BDF8',
  other:      '#6B7280',
};

const EVENT_TYPES = ['practice', 'game', 'meeting', 'tournament', 'training', 'other'];

function formatTime(t) {
  if (!t) return null;
  const [h, m] = t.split(':');
  const hr = parseInt(h, 10);
  return `${hr % 12 || 12}:${m} ${hr < 12 ? 'AM' : 'PM'}`;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function TypeDot({ type, size = 7 }) {
  return (
    <span style={{
      display: 'inline-block', width: size, height: size,
      borderRadius: '50%', backgroundColor: TYPE_COLORS[type] || TYPE_COLORS.other,
      flexShrink: 0,
    }} />
  );
}

function TypePill({ type }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
      backgroundColor: MUTED2, color: TYPE_COLORS[type] || MUTED,
      textTransform: 'uppercase', letterSpacing: '0.06em',
    }}>
      {type}
    </span>
  );
}

function EventCard({ event, currentUserId, onDelete }) {
  const start = formatTime(event.startTime);
  const end = formatTime(event.endTime);
  const timeStr = start ? (end ? `${start} – ${end}` : start) : null;

  return (
    <div style={{
      display: 'flex', gap: 14, padding: '14px 16px',
      borderRadius: 12, background: SURFACE,
      border: `1px solid ${BORDER}`, alignItems: 'flex-start',
    }}>
      <div style={{
        minWidth: 44, textAlign: 'center',
        background: MUTED2, borderRadius: 10,
        padding: '8px 6px', lineHeight: 1,
      }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: TEXT }}>
          {new Date(event.date).getDate()}
        </div>
        <div style={{ fontSize: 10, color: MUTED, textTransform: 'uppercase', marginTop: 2 }}>
          {new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 5 }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: TEXT }}>{event.title}</span>
          <TypePill type={event.type} />
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 12px', fontSize: 12, color: MUTED }}>
          {timeStr && <span>{timeStr}</span>}
          {event.location && <span>{event.location}</span>}
        </div>
        {event.description && (
          <p style={{ margin: '6px 0 0', fontSize: 13, color: '#999', lineHeight: 1.5 }}>
            {event.description}
          </p>
        )}
      </div>

      {event.createdBy === currentUserId && (
        <button
          onClick={() => onDelete(event.id)}
          title="Delete"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: MUTED, fontSize: 20, padding: 0, lineHeight: 1, flexShrink: 0,
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
          onMouseLeave={e => e.currentTarget.style.color = MUTED}
        >×</button>
      )}
    </div>
  );
}

function DayDrawer({ date, events, onClose, currentUserId, onDelete, onCreateForDay }) {
  const ref = useRef();

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    setTimeout(() => document.addEventListener('mousedown', onClick), 0);
    return () => document.removeEventListener('mousedown', onClick);
  }, [onClose]);

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, backdropFilter: 'blur(2px)' }} />
      <div ref={ref} style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 'min(380px, 100vw)',
        background: BG, zIndex: 51,
        display: 'flex', flexDirection: 'column',
        borderLeft: `1px solid ${BORDER}`,
        boxShadow: '-8px 0 40px rgba(0,0,0,0.5)',
      }}>
        <div style={{ padding: '20px 20px 16px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>
              {date.toLocaleDateString('en-US', { weekday: 'long' })}
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: TEXT }}>
              {date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: SURFACE, border: `1px solid ${BORDER}`, cursor: 'pointer',
            width: 32, height: 32, borderRadius: 8, fontSize: 18, color: MUTED,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>×</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {events.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: MUTED }}>
              
              <div style={{ fontWeight: 600, color: '#555' }}>Nothing scheduled</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>Add an event below</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {events.map(ev => (
                <EventCard key={ev.id} event={ev} currentUserId={currentUserId} onDelete={onDelete} />
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: 16, borderTop: `1px solid ${BORDER}` }}>
          <button
            onClick={() => onCreateForDay(date)}
            style={{
              width: '100%', padding: 13, borderRadius: 10,
              background: LIME, color: '#000', border: 'none',
              fontSize: 14, fontWeight: 800, cursor: 'pointer', letterSpacing: '0.02em',
            }}
          >
            + ADD EVENT
          </button>
        </div>
      </div>
    </>
  );
}

function CreateEventModal({ onClose, onSubmit, prefillDate }) {
  const [formData, setFormData] = useState({
    title: '',
    type: 'practice',
    date: prefillDate ? prefillDate.toISOString().split('T')[0] : '',
    startTime: '',
    endTime: '',
    location: '',
    description: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function set(key, val) { setFormData(p => ({ ...p, [key]: val })); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.title.trim()) { setError('Event title is required'); return; }
    if (!formData.date) { setError('Date is required'); return; }
    setError('');
    setSaving(true);
    await onSubmit(formData);
    setSaving(false);
  }

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 60, backdropFilter: 'blur(3px)' }} onClick={onClose} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 'min(460px, calc(100vw - 32px))',
        background: BG, borderRadius: 16, zIndex: 61,
        border: `1px solid ${BORDER}`,
        boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
        overflow: 'hidden',
      }} onClick={e => e.stopPropagation()}>

        <div style={{ padding: '18px 22px 14px', borderBottom: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: TEXT }}>NEW EVENT</h2>
          <button onClick={onClose} style={{ background: SURFACE, border: `1px solid ${BORDER}`, cursor: 'pointer', width: 30, height: 30, borderRadius: 8, fontSize: 17, color: MUTED, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 22 }}>
          {error && (
            <div style={{ background: '#2A0000', color: '#EF4444', border: '1px solid #3D0000', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Title *</label>
            <input autoFocus type="text" value={formData.title}
              onChange={e => set('title', e.target.value)}
              placeholder="e.g. Tuesday Practice"
              style={inp} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <label style={lbl}>Type</label>
              <select value={formData.type} onChange={e => set('type', e.target.value)} style={inp}>
                {EVENT_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
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
            <textarea value={formData.description} onChange={e => set('description', e.target.value)}
              placeholder="Any extra details…" rows={3} style={{ ...inp, resize: 'vertical' }} />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={onClose} style={{
              flex: 1, padding: 11, borderRadius: 10,
              background: SURFACE, color: MUTED, border: `1px solid ${BORDER}`,
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}>Cancel</button>
            <button type="submit" disabled={saving} style={{
              flex: 2, padding: 11, borderRadius: 10,
              background: LIME, color: '#000', border: 'none',
              fontSize: 14, fontWeight: 800, cursor: 'pointer', letterSpacing: '0.02em',
              opacity: saving ? 0.7 : 1,
            }}>
              {saving ? 'CREATING…' : 'CREATE EVENT'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

const lbl = {
  display: 'block', fontSize: 11, fontWeight: 700,
  color: MUTED, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em',
};
const inp = {
  width: '100%', padding: '10px 12px', borderRadius: 8,
  border: `1.5px solid ${BORDER}`, fontSize: 14, color: TEXT,
  background: SURFACE, boxSizing: 'border-box', outline: 'none',
  fontFamily: 'inherit',
};

// ─── Main ────────────────────────────────────────────────────────────────────

export default function Schedule() {
  const { currentTeam } = useTeam();
  const [activeTab, setActiveTab] = useState('calendar');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createPrefillDate, setCreatePrefillDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [toast, setToast] = useState('');
  const currentUser = auth.currentUser;

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3000); }

  useEffect(() => {
    if (!currentTeam?.id) { setEvents([]); setLoading(false); return; }
    setLoading(true);
    const q = query(
      collection(db, 'teams', currentTeam.id, 'events'),
      where('status', '!=', 'cancelled')
    );
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs
        .map(d => ({ id: d.id, ...d.data(), date: d.data().date?.toDate?.() || new Date(d.data().date) }))
        .sort((a, b) => a.date - b.date);
      setEvents(list);
      setLoading(false);
    });
    return () => unsub();
  }, [currentTeam?.id]);

  async function handleCreateEvent(formData) {
    if (!currentTeam?.id || !currentUser) return;
    try {
      const eventDate = new Date(formData.date);
      if (formData.startTime) {
        const [h, m] = formData.startTime.split(':');
        eventDate.setHours(parseInt(h, 10), parseInt(m, 10));
      }
      await addDoc(collection(db, 'teams', currentTeam.id, 'events'), {
        title: formData.title.trim(), type: formData.type, date: eventDate,
        startTime: formData.startTime, endTime: formData.endTime,
        location: formData.location.trim(), description: formData.description.trim(),
        createdBy: currentUser.uid, createdAt: serverTimestamp(),
        status: 'active', attendees: [currentUser.uid],
        rsvps: { [currentUser.uid]: 'going' },
      });
      setShowCreate(false);
      setCreatePrefillDate(null);
      showToast('✓ Event created');
    } catch (err) {
      showToast('✗ ' + err.message);
    }
  }

  async function handleDeleteEvent(eventId) {
    if (!window.confirm('Delete this event?')) return;
    try {
      await deleteDoc(doc(db, 'teams', currentTeam.id, 'events', eventId));
      showToast('✓ Event deleted');
    } catch (err) {
      showToast('✗ ' + err.message);
    }
  }

  function openCreateForDay(date) {
    setSelectedDay(null);
    setCreatePrefillDate(date);
    setShowCreate(true);
  }

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  function getEventsForDate(date) {
    return events.filter(ev => new Date(ev.date).toDateString() === date.toDateString());
  }

  const now = useMemo(() => new Date(), []);
  const upcomingEvents = useMemo(() => events.filter(e => new Date(e.date) >= now).slice(0, 20), [events, now]);
  const pastEvents = useMemo(() => events.filter(e => new Date(e.date) < now).reverse().slice(0, 10), [events, now]);
  const selectedDayEvents = selectedDay ? getEventsForDate(selectedDay) : [];

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: MUTED, fontSize: 15, background: BG }}>
      Loading schedule…
    </div>
  );

  if (!currentTeam) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: MUTED, fontSize: 15, background: BG }}>
      Select a team to view the schedule
    </div>
  );

  return (
    <div style={{ background: BG, minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif', color: TEXT }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 16px 80px' }}>

        {/* Toast */}
        {toast && (
          <div style={{
            position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
            background: LIME, color: '#000', padding: '10px 20px',
            borderRadius: 99, fontSize: 14, fontWeight: 800, zIndex: 100,
            boxShadow: `0 4px 20px ${LIME}44`,
          }}>
            {toast}
          </div>
        )}

        {/* Header */}
        <div style={{ padding: '28px 0 20px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: LIME, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
              {currentTeam.name}
            </div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: TEXT, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              SCHEDULE
            </h1>
          </div>
          <button
            onClick={() => { setCreatePrefillDate(null); setShowCreate(true); }}
            style={{
              background: LIME, color: '#000', border: 'none',
              padding: '10px 18px', borderRadius: 10, fontSize: 13,
              fontWeight: 800, cursor: 'pointer', letterSpacing: '0.04em',
            }}
          >
            + NEW EVENT
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 2, background: SURFACE, borderRadius: 10, padding: 4, marginBottom: 24, border: `1px solid ${BORDER}` }}>
          {[{ id: 'calendar', label: 'CALENDAR' }, { id: 'list', label: 'UPCOMING' }].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1, padding: '9px', border: 'none', cursor: 'pointer',
                borderRadius: 8, fontSize: 12, fontWeight: 800, letterSpacing: '0.06em',
                background: activeTab === tab.id ? LIME : 'transparent',
                color: activeTab === tab.id ? '#000' : MUTED,
                transition: 'all 0.15s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* CALENDAR TAB */}
        {activeTab === 'calendar' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                style={navBtn}
              >‹</button>
              <span style={{ fontWeight: 800, fontSize: 15, color: TEXT, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                style={navBtn}
              >›</button>
            </div>

            {/* Day headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 6 }}>
              {['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'].map(d => (
                <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: MUTED, padding: '4px 0', letterSpacing: '0.06em' }}>
                  {d}
                </div>
              ))}
            </div>

            {/* Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
              {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                const dayEvents = getEventsForDate(date);
                const isToday = new Date().toDateString() === date.toDateString();
                const isSelected = selectedDay?.toDateString() === date.toDateString();
                const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(isSelected ? null : date)}
                    style={{
                      border: isSelected ? `2px solid ${LIME}` : `2px solid transparent`,
                      borderRadius: 10, padding: '6px 4px',
                      background: isToday ? LIME : SURFACE,
                      cursor: 'pointer', textAlign: 'center',
                      minHeight: 52, display: 'flex', flexDirection: 'column', alignItems: 'center',
                      opacity: isPast && !isToday ? 0.45 : 1,
                      transition: 'all 0.1s',
                    }}
                    onMouseEnter={e => { if (!isToday) e.currentTarget.style.borderColor = LIME; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = 'transparent'; }}
                  >
                    <span style={{
                      fontSize: 13, fontWeight: 800,
                      color: isToday ? '#000' : TEXT,
                      width: 26, height: 26, display: 'flex',
                      alignItems: 'center', justifyContent: 'center', borderRadius: '50%',
                    }}>
                      {day}
                    </span>
                    <div style={{ display: 'flex', gap: 2, marginTop: 3, justifyContent: 'center', flexWrap: 'wrap' }}>
                      {dayEvents.slice(0, 3).map(ev => (
                        <TypeDot key={ev.id} type={ev.type} size={5} />
                      ))}
                      {dayEvents.length > 3 && (
                        <span style={{ fontSize: 8, color: LIME, fontWeight: 700 }}>+{dayEvents.length - 3}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px', marginTop: 18, padding: '12px 14px', background: SURFACE, borderRadius: 10, border: `1px solid ${BORDER}` }}>
              {EVENT_TYPES.map(t => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <TypeDot type={t} size={7} />
                  <span style={{ fontSize: 11, color: MUTED, textTransform: 'capitalize' }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LIST TAB */}
        {activeTab === 'list' && (
          <div>
            {upcomingEvents.length === 0 && pastEvents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '70px 0', color: MUTED }}>
                
                <div style={{ fontWeight: 800, fontSize: 16, color: '#555', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>No events yet</div>
                <div style={{ fontSize: 13 }}>Hit "New Event" to get started</div>
              </div>
            ) : (
              <>
                {upcomingEvents.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: LIME, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
                      Upcoming · {upcomingEvents.length}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {upcomingEvents.map(ev => (
                        <EventCard key={ev.id} event={ev} currentUserId={currentUser?.uid} onDelete={handleDeleteEvent} />
                      ))}
                    </div>
                  </div>
                )}
                {pastEvents.length > 0 && (
                  <div style={{ marginTop: 32 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
                      Past · {pastEvents.length}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, opacity: 0.45 }}>
                      {pastEvents.map(ev => (
                        <EventCard key={ev.id} event={ev} currentUserId={currentUser?.uid} onDelete={handleDeleteEvent} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {selectedDay && (
        <DayDrawer
          date={selectedDay}
          events={selectedDayEvents}
          onClose={() => setSelectedDay(null)}
          currentUserId={currentUser?.uid}
          onDelete={handleDeleteEvent}
          onCreateForDay={openCreateForDay}
        />
      )}

      {showCreate && (
        <CreateEventModal
          prefillDate={createPrefillDate}
          onClose={() => { setShowCreate(false); setCreatePrefillDate(null); }}
          onSubmit={handleCreateEvent}
        />
      )}
    </div>
  );
}

const navBtn = {
  background: SURFACE, border: `1px solid ${BORDER}`, cursor: 'pointer',
  width: 34, height: 34, borderRadius: 8, fontSize: 20,
  color: TEXT, display: 'flex', alignItems: 'center', justifyContent: 'center',
};