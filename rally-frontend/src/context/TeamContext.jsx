import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

const TeamContext = createContext();

export function useTeam() {
  return useContext(TeamContext);
}

function readStoredTeamId() {
  try {
    return localStorage.getItem('rally_current_team');
  } catch {
    return null; // localStorage unavailable (private browsing, etc.)
  }
}

function storeTeamId(teamId) {
  try {
    if (teamId) localStorage.setItem('rally_current_team', teamId);
    else localStorage.removeItem('rally_current_team');
  } catch {
    // ignore — nothing we can do if storage is blocked
  }
}

export function TeamProvider({ children }) {
  const [user, setUser] = useState(null);
  const [teams, setTeams] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [currentTeamId, setCurrentTeamId] = useState(readStoredTeamId);
  const [loading, setLoading] = useState(true);

  // Mirrors currentTeamId so the snapshot handler below always reads the
  // latest value without needing the effect to re-run on every change
  // (which would tear down and rebuild the Firestore listener needlessly).
  const currentTeamIdRef = useRef(currentTeamId);
  useEffect(() => {
    currentTeamIdRef.current = currentTeamId;
  }, [currentTeamId]);

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

    let cancelled = false;
    let requestId = 0;

    const userRef = doc(db, 'users', user.uid);
    const unsub = onSnapshot(
      userRef,
      async (userSnap) => {
        const thisRequest = ++requestId;
        const data = userSnap.data() || {};
        const teamIds = data.teamIds || [];
        const orgIds = data.orgIds || [];

        let teamDocs, orgDocs;
        try {
          [teamDocs, orgDocs] = await Promise.all([
            Promise.all(
              teamIds.map(async (id) => {
                const snap = await getDoc(doc(db, 'teams', id));
                return snap.exists() ? { id: snap.id, ...snap.data() } : null;
              })
            ),
            Promise.all(
              orgIds.map(async (id) => {
                const snap = await getDoc(doc(db, 'orgs', id));
                return snap.exists() ? { id: snap.id, ...snap.data() } : null;
              })
            ),
          ]);
        } catch (err) {
          console.error('Failed to load teams/orgs:', err);
          if (!cancelled) setLoading(false);
          return;
        }

        // Bail if a newer snapshot already started resolving, or the
        // effect has been torn down (e.g. the user signed out) while we
        // were awaiting Firestore.
        if (cancelled || thisRequest !== requestId) return;

        const validTeams = teamDocs.filter(Boolean);
        const validOrgs = orgDocs.filter(Boolean);
        setTeams(validTeams);
        setOrgs(validOrgs);

        if (validTeams.length > 0) {
          const stillValid = validTeams.some(
            (t) => t.id === currentTeamIdRef.current
          );
          if (!stillValid) {
            setCurrentTeamId(validTeams[0].id);
            storeTeamId(validTeams[0].id);
          }
        } else {
          setCurrentTeamId(null);
          storeTeamId(null);
        }

        setLoading(false);
      },
      (err) => {
        console.error('Team snapshot error:', err);
        if (!cancelled) setLoading(false);
      }
    );

    return () => {
      cancelled = true;
      unsub();
    };
  }, [user]);

  const switchTeam = (teamId) => {
    setCurrentTeamId(teamId);
    storeTeamId(teamId);
  };

  const currentTeam = teams.find((t) => t.id === currentTeamId) || null;

  // Group teams by org for display
  const teamsByOrg = orgs.map((org) => ({
    org,
    teams: teams.filter((t) => t.orgId === org.id),
  }));
  const standaloneTeams = teams.filter((t) => !t.orgId);

  return (
    <TeamContext.Provider
      value={{
        teams,
        orgs,
        currentTeam,
        currentTeamId,
        switchTeam,
        loading,
        teamsByOrg,
        standaloneTeams,
      }}
    >
      {children}
    </TeamContext.Provider>
  );
}