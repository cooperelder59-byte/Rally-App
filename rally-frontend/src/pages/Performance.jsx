import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import {
  collection, query, where, onSnapshot, doc, getDoc, setDoc
} from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { useTeam } from '../context/TeamContext';
import '../styles/performance.css';

// ─── Theme (matches Roster's inline modal styling) ────────────────────────────
const PRIMARY  = '#c8ff3d';
const SURFACE  = '#161616';
const SURFACE2 = '#1e1e1e';
const BORDER   = '#222';
const TEXT     = '#e8e8e8';
const MUTED    = '#555';

// Deterministic doc id so editing always targets the same stats doc per player
function statsDocId(teamId, playerId) {
  return `${teamId}_player_${playerId}`;
}

const EMPTY_STATS = {
  position: '',
  appearances: 0,
  goals: 0,
  assists: 0,
  rating: '',
  passAccuracy: '',
  shotsPerMatch: '',
  tackles: 0,
  interceptions: 0,
  fouls: 0,
};

function initialsOf(name) {
  return (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ name, size = 32 }) {
  return (
    <div
      className="player-avatar"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initialsOf(name)}
    </div>
  );
}

// ─── Edit Stats Modal ──────────────────────────────────────────────────────────
function EditStatsModal({ player, onClose, onSave }) {
  const [form, setForm] = useState({ ...EMPTY_STATS, ...player.stats });
  const [saving, setSaving] = useState(false);

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    const cleaned = {
      position: form.position.trim(),
      appearances: Number(form.appearances) || 0,
      goals: Number(form.goals) || 0,
      assists: Number(form.assists) || 0,
      rating: String(form.rating).trim(),
      passAccuracy: String(form.passAccuracy).trim(),
      shotsPerMatch: String(form.shotsPerMatch).trim(),
      tackles: Number(form.tackles) || 0,
      interceptions: Number(form.interceptions) || 0,
      fouls: Number(form.fouls) || 0,
    };
    await onSave(cleaned);
    setSaving(false);
    onClose();
  };

  const lbl = { display: 'block', fontSize: 11, fontWeight: 700, color: MUTED, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' };
  const inp = { width: '100%', padding: '9px 11px', borderRadius: 8, border: `1px solid ${BORDER}`, fontSize: 13, color: TEXT, background: SURFACE2, boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' };
  const row2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, backdropFilter: 'blur(4px)' }} />
      <div
        style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          width: 'min(460px, calc(100vw - 32px))', maxHeight: '85vh', overflowY: 'auto',
          background: SURFACE, borderRadius: 14, zIndex: 101,
          border: `1px solid ${BORDER}`,
          boxShadow: '0 32px 80px rgba(0,0,0,0.8)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: SURFACE }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar name={player.name} size={28} />
            <h2 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: TEXT, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {player.name}
            </h2>
          </div>
          <button onClick={onClose} style={{ background: SURFACE2, border: `1px solid ${BORDER}`, cursor: 'pointer', width: 28, height: 28, borderRadius: 7, fontSize: 16, color: MUTED, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>

        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={lbl}>Position</label>
            <input value={form.position} onChange={e => update('position', e.target.value)} style={inp} placeholder="e.g. Midfielder" />
          </div>

          <div style={row2}>
            <div>
              <label style={lbl}>Appearances</label>
              <input type="number" min="0" value={form.appearances} onChange={e => update('appearances', e.target.value)} style={inp} />
            </div>
            <div>
              <label style={lbl}>Rating</label>
              <input value={form.rating} onChange={e => update('rating', e.target.value)} style={inp} placeholder="e.g. 7.8" />
            </div>
          </div>

          <div style={row2}>
            <div>
              <label style={lbl}>Goals</label>
              <input type="number" min="0" value={form.goals} onChange={e => update('goals', e.target.value)} style={inp} />
            </div>
            <div>
              <label style={lbl}>Assists</label>
              <input type="number" min="0" value={form.assists} onChange={e => update('assists', e.target.value)} style={inp} />
            </div>
          </div>

          <div style={row2}>
            <div>
              <label style={lbl}>Pass accuracy (%)</label>
              <input value={form.passAccuracy} onChange={e => update('passAccuracy', e.target.value)} style={inp} placeholder="e.g. 84" />
            </div>
            <div>
              <label style={lbl}>Shots / match</label>
              <input value={form.shotsPerMatch} onChange={e => update('shotsPerMatch', e.target.value)} style={inp} placeholder="e.g. 2.4" />
            </div>
          </div>

          <div style={row2}>
            <div>
              <label style={lbl}>Tackles</label>
              <input type="number" min="0" value={form.tackles} onChange={e => update('tackles', e.target.value)} style={inp} />
            </div>
            <div>
              <label style={lbl}>Interceptions</label>
              <input type="number" min="0" value={form.interceptions} onChange={e => update('interceptions', e.target.value)} style={inp} />
            </div>
          </div>

          <div>
            <label style={lbl}>Fouls</label>
            <input type="number" min="0" value={form.fouls} onChange={e => update('fouls', e.target.value)} style={inp} />
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button onClick={onClose} style={{ flex: 1, padding: 11, borderRadius: 9, background: SURFACE2, color: MUTED, border: `1px solid ${BORDER}`, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: 11, borderRadius: 9, background: PRIMARY, color: '#000', border: 'none', fontSize: 13, fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving…' : 'Save stats'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function Performance() {
  const { currentTeam } = useTeam();
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [teamStats, setTeamStats] = useState(null);
  const [roster, setRoster] = useState([]);       // every player on the team
  const [statsMap, setStatsMap] = useState({});   // playerId -> stats doc data
  const [loading, setLoading] = useState(true);
  const [editingPlayer, setEditingPlayer] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setCurrentUser(u));
    return () => unsub();
  }, []);

  // Load the full roster (same approach as Roster.jsx) — this is what makes
  // every player show up, even ones with no stats recorded yet.
  useEffect(() => {
    if (!currentTeam?.memberIds?.length) {
      setRoster([]);
      return;
    }
    Promise.all(
      currentTeam.memberIds.map(uid => getDoc(doc(db, 'users', uid)))
    ).then(docs => {
      const members = docs.map((d, i) => ({
        uid: currentTeam.memberIds[i],
        name: d.exists() ? (d.data().name || d.data().displayName || 'Unnamed') : 'Unnamed',
        role: d.exists() ? (d.data().role || 'Player') : 'Player',
      }));
      // Only players get stat rows — coaches/managers aren't tracked here
      setRoster(members.filter(m => !m.role || m.role === 'Player'));
    });
  }, [currentTeam?.memberIds]);

  // Load team-level stats + existing per-player stats docs
  useEffect(() => {
    if (!currentTeam?.id || !currentUser) {
      setTeamStats(null);
      setStatsMap({});
      setLoading(false);
      return;
    }

    setLoading(true);

    const teamDocRef = doc(db, 'performances', currentTeam.id);
    getDoc(teamDocRef).then((snap) => {
      if (snap.exists()) setTeamStats(snap.data());
    });

    const q = query(
      collection(db, 'performances'),
      where('teamId', '==', currentTeam.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const map = {};
      snapshot.docs.forEach(d => {
        const data = d.data();
        if (data.playerId) map[data.playerId] = data;
      });
      setStatsMap(map);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentTeam?.id, currentUser]);

  // Coaches and the team owner (admin) can edit player stats
  const myRole = roster.find(m => m.uid === currentUser?.uid)?.role;
  const canEditStats =
    myRole === 'Coach' ||
    currentTeam?.ownerId === currentUser?.uid;

  const players = roster
    .map(m => {
      const statsDoc = statsMap[m.uid];
      return {
        uid: m.uid,
        name: m.name,
        stats: statsDoc?.stats || {},
      };
    })
    .sort((a, b) => (b.stats?.goals || 0) - (a.stats?.goals || 0));

  const handleSaveStats = useCallback(async (player, stats) => {
    if (!currentTeam?.id) return;
    const id = statsDocId(currentTeam.id, player.uid);
    await setDoc(doc(db, 'performances', id), {
      teamId: currentTeam.id,
      playerId: player.uid,
      playerName: player.name,
      stats,
    }, { merge: true });
  }, [currentTeam?.id]);

  const gridCols = canEditStats
    ? '2.2fr 1fr 0.8fr 0.8fr 0.8fr 0.9fr 0.7fr'
    : '2.2fr 1fr 0.8fr 0.8fr 0.8fr 0.9fr';

  if (loading) {
    return <div className="performance-page"><p>Loading performance data...</p></div>;
  }

  if (!currentTeam) {
    return <div className="performance-page"><p>Select a team to view performance</p></div>;
  }

  return (
    <div className="performance-page">
      {/* HEADER */}
      <div className="perf-header">
        <h1>Performance</h1>
        <p>{currentTeam.name} Season 2025-2026</p>
      </div>

      {/* TEAM STATS OVERVIEW */}
      {teamStats && (
        <div className="stats-grid">
          <div className="stat-card">
            <p className="stat-label">Win Rate</p>
            <p className="stat-value">{teamStats.stats?.winRate || '0'}%</p>
            <p className="stat-change">vs last season</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Matches Played</p>
            <p className="stat-value">{teamStats.stats?.matchesPlayed || 0}</p>
            <p className="stat-change">{teamStats.stats?.wins || 0}W {teamStats.stats?.draws || 0}D {teamStats.stats?.losses || 0}L</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Avg Goals/Match</p>
            <p className="stat-value">{teamStats.stats?.avgGoalsFor || '0'}</p>
            <p className="stat-change">Goals for</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Avg Goals Against</p>
            <p className="stat-value">{teamStats.stats?.avgGoalsAgainst || '0'}</p>
            <p className="stat-change">Goals against</p>
          </div>
        </div>
      )}

      {/* PLAYER STATS TABLE — every player on the roster, stats or not */}
      <div className="players-section">
        <div className="players-section-header">
          <h2>Player Statistics</h2>
          <span className="players-count">{players.length} player{players.length !== 1 ? 's' : ''}</span>
        </div>

        {players.length === 0 ? (
          <p className="empty-state">No players on this roster yet</p>
        ) : (
          <div className="stats-table">
            <div className="table-header" style={{ gridTemplateColumns: gridCols }}>
              <div className="col-player">Player</div>
              <div className="col-stat">Position</div>
              <div className="col-stat">Apps</div>
              <div className="col-stat">Goals</div>
              <div className="col-stat">Assists</div>
              <div className="col-stat">Rating</div>
              {canEditStats && <div className="col-stat">&nbsp;</div>}
            </div>

            {players.map((player) => (
              <div key={player.uid} className="table-row" style={{ gridTemplateColumns: gridCols }}>
                <div className="col-player">
                  <Avatar name={player.name} />
                  <div className="player-name">{player.name}</div>
                </div>
                <div className="col-stat">{player.stats?.position || <span className="dim">—</span>}</div>
                <div className="col-stat">{player.stats?.appearances || 0}</div>
                <div className="col-stat">
                  <span className="stat-highlight">{player.stats?.goals || 0}</span>
                </div>
                <div className="col-stat">{player.stats?.assists || 0}</div>
                <div className="col-stat">
                  <span className="rating">{player.stats?.rating || '—'}</span>
                </div>
                {canEditStats && (
                  <div className="col-stat">
                    <button className="edit-stats-btn" onClick={() => setEditingPlayer(player)}>
                      Edit
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PLAYER DETAIL STATS */}
      {players.length > 0 && (
        <div className="detail-stats">
          <h2>Advanced Stats</h2>
          <div className="stats-columns">
            {players.slice(0, 3).map((player) => (
              <div key={player.uid} className="stat-column-card">
                <div className="stat-column-header">
                  <div className="stat-column-player">
                    <Avatar name={player.name} size={30} />
                    <h3>{player.name}</h3>
                  </div>
                  {canEditStats && (
                    <button className="edit-stats-btn" onClick={() => setEditingPlayer(player)}>
                      Edit
                    </button>
                  )}
                </div>
                <ul className="stat-list">
                  <li>
                    <span>Pass Accuracy</span>
                    <strong>{player.stats?.passAccuracy || '—'}%</strong>
                  </li>
                  <li>
                    <span>Shots/Match</span>
                    <strong>{player.stats?.shotsPerMatch || '—'}</strong>
                  </li>
                  <li>
                    <span>Tackles</span>
                    <strong>{player.stats?.tackles || 0}</strong>
                  </li>
                  <li>
                    <span>Interceptions</span>
                    <strong>{player.stats?.interceptions || 0}</strong>
                  </li>
                  <li>
                    <span>Fouls</span>
                    <strong>{player.stats?.fouls || 0}</strong>
                  </li>
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {editingPlayer && (
        <EditStatsModal
          player={editingPlayer}
          onClose={() => setEditingPlayer(null)}
          onSave={(stats) => handleSaveStats(editingPlayer, stats)}
        />
      )}
    </div>
  );
}