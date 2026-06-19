import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

const TeamContext = createContext();

export function useTeam() {
  return useContext(TeamContext);
}

export function TeamProvider({ children }) {
  const [user, setUser] = useState(null);
  const [teams, setTeams] = useState([]);
  const [currentTeamId, setCurrentTeamId] = useState(localStorage.getItem('rally_current_team') || null);
  const [loading, setLoading] = useState(true);

  // Track auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setTeams([]);
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  // Listen to the user's team list, then fetch each team doc
  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    const unsub = onSnapshot(userRef, async (userSnap) => {
      const teamIds = userSnap.data()?.teamIds || [];

      const teamDocs = await Promise.all(
        teamIds.map(async (id) => {
          const snap = await getDoc(doc(db, 'teams', id));
          return snap.exists() ? { id: snap.id, ...snap.data() } : null;
        })
      );

      const validTeams = teamDocs.filter(Boolean);
      setTeams(validTeams);

      // If no current team selected, or current team no longer valid, pick the first one
      if (validTeams.length > 0) {
        const stillValid = validTeams.some(t => t.id === currentTeamId);
        if (!stillValid) {
          setCurrentTeamId(validTeams[0].id);
          localStorage.setItem('rally_current_team', validTeams[0].id);
        }
      } else {
        setCurrentTeamId(null);
        localStorage.removeItem('rally_current_team');
      }

      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  const switchTeam = (teamId) => {
    setCurrentTeamId(teamId);
    localStorage.setItem('rally_current_team', teamId);
  };

  const currentTeam = teams.find(t => t.id === currentTeamId) || null;

  return (
    <TeamContext.Provider value={{ teams, currentTeam, currentTeamId, switchTeam, loading }}>
      {children}
    </TeamContext.Provider>
  );
}