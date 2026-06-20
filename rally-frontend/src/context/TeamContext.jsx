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
  const [orgs, setOrgs] = useState([]);
  const [currentTeamId, setCurrentTeamId] = useState(localStorage.getItem('rally_current_team') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setTeams([]);
        setOrgs([]);
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    const unsub = onSnapshot(userRef, async (userSnap) => {
      const data = userSnap.data() || {};
      const teamIds = data.teamIds || [];
      const orgIds = data.orgIds || [];

      const [teamDocs, orgDocs] = await Promise.all([
        Promise.all(teamIds.map(async (id) => {
          const snap = await getDoc(doc(db, 'teams', id));
          return snap.exists() ? { id: snap.id, ...snap.data() } : null;
        })),
        Promise.all(orgIds.map(async (id) => {
          const snap = await getDoc(doc(db, 'orgs', id));
          return snap.exists() ? { id: snap.id, ...snap.data() } : null;
        }))
      ]);

      const validTeams = teamDocs.filter(Boolean);
      const validOrgs = orgDocs.filter(Boolean);
      setTeams(validTeams);
      setOrgs(validOrgs);

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

  // Group teams by org for display
  const teamsByOrg = orgs.map(org => ({
    org,
    teams: teams.filter(t => t.orgId === org.id)
  }));
  const standaloneTeams = teams.filter(t => !t.orgId);

  return (
    <TeamContext.Provider value={{
      teams, orgs, currentTeam, currentTeamId, switchTeam, loading,
      teamsByOrg, standaloneTeams
    }}>
      {children}
    </TeamContext.Provider>
  );
}