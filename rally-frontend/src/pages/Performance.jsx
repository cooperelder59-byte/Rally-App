import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { useTeam } from '../context/TeamContext';
import '../styles/performance.css';

export default function Performance() {
  const { currentTeam } = useTeam();
  const [teamStats, setTeamStats] = useState(null);
  const [playerStats, setPlayerStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentUser = auth.currentUser;

  // Load team performance data
  useEffect(() => {
    if (!currentTeam?.id || !currentUser) {
      setTeamStats(null);
      setPlayerStats([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Get team performance
    const teamDocRef = doc(db, 'performances', currentTeam.id);
    getDoc(teamDocRef).then((snap) => {
      if (snap.exists()) {
        setTeamStats(snap.data());
      }
    });

    // Get player stats
    const q = query(
      collection(db, 'performances'),
      where('teamId', '==', currentTeam.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const stats = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(s => s.playerName); // Only player stats, not team stats

      setPlayerStats(stats.sort((a, b) =>
        (b.stats?.goals || 0) - (a.stats?.goals || 0)
      ));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentTeam?.id, currentUser]);

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

      {/* PLAYER STATS TABLE */}
      <div className="players-section">
        <h2>Player Statistics</h2>

        {playerStats.length === 0 ? (
          <p className="empty-state">No player stats recorded yet</p>
        ) : (
          <div className="stats-table">
            <div className="table-header">
              <div className="col-player">Player</div>
              <div className="col-stat">Position</div>
              <div className="col-stat">Apps</div>
              <div className="col-stat">Goals</div>
              <div className="col-stat">Assists</div>
              <div className="col-stat">Rating</div>
            </div>

            {playerStats.map((player) => (
              <div key={player.id} className="table-row">
                <div className="col-player">
                  <div className="player-name">{player.playerName}</div>
                </div>
                <div className="col-stat">{player.stats?.position || '—'}</div>
                <div className="col-stat">{player.stats?.appearances || 0}</div>
                <div className="col-stat">
                  <span className="stat-highlight">{player.stats?.goals || 0}</span>
                </div>
                <div className="col-stat">{player.stats?.assists || 0}</div>
                <div className="col-stat">
                  <span className="rating">{player.stats?.rating || '—'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PLAYER DETAIL STATS */}
      {playerStats.length > 0 && (
        <div className="detail-stats">
          <h2>Advanced Stats</h2>
          <div className="stats-columns">
            {playerStats.slice(0, 3).map((player) => (
              <div key={player.id} className="stat-column-card">
                <h3>{player.playerName}</h3>
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
    </div>
  );
}