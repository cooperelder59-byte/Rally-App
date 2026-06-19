import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  collection, addDoc, doc, setDoc, arrayUnion,
  query, where, getDocs, serverTimestamp
} from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { useTeam } from '../context/TeamContext';
import '../styles/teamsetup.css';

function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `RALLY-${code}`;
}

export default function TeamSetup() {
  const [mode, setMode] = useState('create');
  const [teamName, setTeamName] = useState('');
  const [sport, setSport] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();
  const { switchTeam } = useTeam();

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const user = auth.currentUser;
      const code = generateInviteCode();

      const teamRef = await addDoc(collection(db, 'teams'), {
        name: teamName,
        sport,
        ownerId: user.uid,
        inviteCode: code,
        memberIds: [user.uid],
        createdAt: serverTimestamp()
      });

      await setDoc(doc(db, 'users', user.uid), {
        teamIds: arrayUnion(teamRef.id)
      }, { merge: true });

      // Auto-create the team's announcement channel
      await addDoc(collection(db, 'conversations'), {
        teamId: teamRef.id,
        type: 'announcement',
        name: 'Team Announcements',
        participants: [],
        lastMessage: '',
        lastMessageAt: serverTimestamp()
      });

      switchTeam(teamRef.id);
      navigate('/dashboard');
    } catch (error) {
      console.error('Create team error:', error);
      setErrorMsg('Something went wrong creating the team.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const user = auth.currentUser;
      const code = inviteCode.trim().toUpperCase();

      const q = query(collection(db, 'teams'), where('inviteCode', '==', code));
      const snap = await getDocs(q);

      if (snap.empty) {
        setErrorMsg('No team found with that invite code.');
        setIsLoading(false);
        return;
      }

      const teamDoc = snap.docs[0];

      await setDoc(doc(db, 'teams', teamDoc.id), {
        memberIds: arrayUnion(user.uid)
      }, { merge: true });

      await setDoc(doc(db, 'users', user.uid), {
        teamIds: arrayUnion(teamDoc.id)
      }, { merge: true });

      switchTeam(teamDoc.id);
      navigate('/dashboard');
    } catch (error) {
      console.error('Join team error:', error);
      setErrorMsg('Something went wrong joining the team.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="teamsetup-page">
      <div className="teamsetup-card">
        <h1>Set up your team</h1>
        <p className="teamsetup-sub">Create a new team or join one with an invite code.</p>

        <div className="teamsetup-tabs">
          <button
            className={mode === 'create' ? 'active' : ''}
            onClick={() => setMode('create')}
          >
            Create a team
          </button>
          <button
            className={mode === 'join' ? 'active' : ''}
            onClick={() => setMode('join')}
          >
            Join a team
          </button>
        </div>

        {mode === 'create' ? (
          <form className="teamsetup-form" onSubmit={handleCreate}>
            <input
              type="text"
              placeholder="Team name"
              required
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
            />
            <input
              type="text"
              placeholder="Sport (e.g. Soccer, Hockey)"
              value={sport}
              onChange={(e) => setSport(e.target.value)}
            />
            {errorMsg && <p className="form-error">{errorMsg}</p>}
            <button type="submit" className="btn btn-primary btn-full" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create team'}
            </button>
          </form>
        ) : (
          <form className="teamsetup-form" onSubmit={handleJoin}>
            <input
              type="text"
              placeholder="Invite code (e.g. RALLY-7XK2)"
              required
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
            />
            {errorMsg && <p className="form-error">{errorMsg}</p>}
            <button type="submit" className="btn btn-primary btn-full" disabled={isLoading}>
              {isLoading ? 'Joining...' : 'Join team'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}