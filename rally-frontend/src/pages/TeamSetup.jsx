import { useState, useId } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  collection, addDoc, doc, setDoc, arrayUnion,
  query, where, getDocs, serverTimestamp
} from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { useTeam } from '../context/TeamContext';
import '../styles/teamsetup.css';

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateInviteCode() {
  let code = '';
  for (let i = 0; i < 6; i++) code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return `RALLY-${code}`;
}

// Invite codes are random, so collisions are rare but not impossible.
// Regenerate until we find one that isn't already in use.
async function generateUniqueInviteCode(maxAttempts = 5) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = generateInviteCode();
    const q = query(collection(db, 'teams'), where('inviteCode', '==', code));
    const snap = await getDocs(q);
    if (snap.empty) return code;
  }
  throw new Error('Could not generate a unique invite code. Please try again.');
}

const TEAM_NAME_MAX = 60;

function validateTeamName(name) {
  const trimmed = name.trim();
  if (!trimmed) return 'Team name is required.';
  if (trimmed.length > TEAM_NAME_MAX) return `Team name must be ${TEAM_NAME_MAX} characters or fewer.`;
  return null;
}

function validateInviteCode(code) {
  const trimmed = code.trim();
  if (!trimmed) return 'Invite code is required.';
  if (!/^RALLY-[A-Z0-9]{6}$/i.test(trimmed)) return 'That doesn\u2019t look like a valid invite code (e.g. RALLY-7XK2).';
  return null;
}

// Auto-format as the user types: uppercase, keep only valid chars, insert the dash.
function formatInviteCodeInput(raw) {
  let value = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (value.startsWith('RALLY')) value = value.slice(5);
  value = value.slice(0, 6);
  return value ? `RALLY-${value}` : '';
}

export default function TeamSetup() {
  const [mode, setMode] = useState('create');
  const [teamName, setTeamName] = useState('');
  const [sport, setSport] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [createdTeam, setCreatedTeam] = useState(null); // { id, name, inviteCode }
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();
  const { switchTeam } = useTeam();

  const nameErrId = useId();
  const codeErrId = useId();

  const switchMode = (nextMode) => {
    if (isLoading) return;
    setMode(nextMode);
    setFieldError('');
    setErrorMsg('');
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    const nameError = validateTeamName(teamName);
    setFieldError(nameError ?? '');
    setErrorMsg('');
    if (nameError) return;

    setIsLoading(true);
    try {
      const user = auth.currentUser;
      const code = await generateUniqueInviteCode();

      const teamRef = await addDoc(collection(db, 'teams'), {
        name: teamName.trim(),
        sport: sport.trim(),
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
      // Show the invite code before moving on — previously the owner never saw it.
      setCreatedTeam({ id: teamRef.id, name: teamName.trim(), inviteCode: code });
    } catch (error) {
      console.error('Create team error:', error);
      setErrorMsg('Something went wrong creating the team. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    const codeError = validateInviteCode(inviteCode);
    setFieldError(codeError ?? '');
    setErrorMsg('');
    if (codeError) return;

    setIsLoading(true);
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
      setErrorMsg('Something went wrong joining the team. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = async () => {
    if (!createdTeam) return;
    try {
      await navigator.clipboard.writeText(createdTeam.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  // ─── Post-create: show the invite code before heading to the dashboard ───────
  if (createdTeam) {
    return (
      <div className="teamsetup-page">
        <div className="teamsetup-card">
          <h1>Team created 🎉</h1>
          <p className="teamsetup-sub">
            Share this invite code with your players and staff so they can join {createdTeam.name}.
          </p>

          <div className="invite-code-display" role="group" aria-label="Team invite code">
            <span className="invite-code-value">{createdTeam.inviteCode}</span>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleCopyCode}
            >
              {copied ? 'Copied!' : 'Copy code'}
            </button>
          </div>

          <button
            type="button"
            className="btn btn-primary btn-full"
            onClick={() => navigate('/dashboard')}
          >
            Continue to dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="teamsetup-page">
      <div className="teamsetup-card">
        <h1>Set up your team</h1>
        <p className="teamsetup-sub">Create a new team or join one with an invite code.</p>

        <div className="teamsetup-tabs" role="tablist" aria-label="Team setup mode">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'create'}
            className={mode === 'create' ? 'active' : ''}
            onClick={() => switchMode('create')}
            disabled={isLoading}
          >
            Create a team
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'join'}
            className={mode === 'join' ? 'active' : ''}
            onClick={() => switchMode('join')}
            disabled={isLoading}
          >
            Join a team
          </button>
        </div>

        {mode === 'create' ? (
          <form className="teamsetup-form" onSubmit={handleCreate} noValidate>
            <input
              type="text"
              placeholder="Team name"
              required
              maxLength={TEAM_NAME_MAX}
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              disabled={isLoading}
              aria-invalid={Boolean(fieldError)}
              aria-describedby={fieldError ? nameErrId : undefined}
            />
            {fieldError && <p id={nameErrId} className="form-error">{fieldError}</p>}
            <input
              type="text"
              placeholder="Sport (e.g. Soccer, Hockey)"
              value={sport}
              onChange={(e) => setSport(e.target.value)}
              disabled={isLoading}
            />
            {errorMsg && <p className="form-error">{errorMsg}</p>}
            <button type="submit" className="btn btn-primary btn-full" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create team'}
            </button>
          </form>
        ) : (
          <form className="teamsetup-form" onSubmit={handleJoin} noValidate>
            <input
              type="text"
              placeholder="Invite code (e.g. RALLY-7XK2)"
              required
              value={inviteCode}
              onChange={(e) => setInviteCode(formatInviteCodeInput(e.target.value))}
              disabled={isLoading}
              aria-invalid={Boolean(fieldError)}
              aria-describedby={fieldError ? codeErrId : undefined}
            />
            {fieldError && <p id={codeErrId} className="form-error">{fieldError}</p>}
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