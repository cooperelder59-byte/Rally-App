import { useState, useEffect, useRef } from 'react';
import {
  collection, query, where, orderBy, onSnapshot,
  addDoc, serverTimestamp, doc, updateDoc, getDoc, deleteDoc
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { useTeam } from '../context/TeamContext';
import '../styles/messages.css';

export default function Messages() {
  const { currentTeam } = useTeam();
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [conversations, setConversations] = useState([]);
  const [activeConvo, setActiveConvo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showNewConvo, setShowNewConvo] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [convoName, setConvoName] = useState('');
  const [loadingMembers, setLoadingMembers] = useState(false);

  // uid -> { name, email } cache for every member of the current team.
  // This is the single source of truth for "who is this person" across
  // the convo list, chat bubbles, and the new-conversation picker —
  // instead of relying on Firebase Auth's displayName (often never set).
  const [memberProfiles, setMemberProfiles] = useState({});

  const messagesEndRef = useRef(null);

  // Wait for Firebase auth to resolve before doing anything
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setCurrentUser(u));
    return () => unsub();
  }, []);

  // Load + cache profile info (name/email) for every member of the team,
  // as soon as we know the team — not just when opening the "new convo" modal.
  useEffect(() => {
    if (!currentTeam?.id) {
      setMemberProfiles({});
      return;
    }

    const memberIds = currentTeam.memberIds || [];
    if (memberIds.length === 0) {
      setMemberProfiles({});
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const snaps = await Promise.all(
          memberIds.map(uid => getDoc(doc(db, 'users', uid)))
        );
        if (cancelled) return;

        const profiles = {};
        snaps.forEach((snap, i) => {
          const uid = memberIds[i];
          if (snap.exists()) {
            const data = snap.data();
            profiles[uid] = {
              name: data.name || data.displayName || null,
              email: data.email || null,
            };
          } else {
            profiles[uid] = { name: null, email: null };
          }
        });
        setMemberProfiles(profiles);
      } catch (err) {
        console.error('Failed to load member profiles:', err);
      }
    })();

    return () => { cancelled = true; };
  }, [currentTeam?.id, currentTeam?.memberIds]);

  // Helper: best display name we have for a given uid
  const displayNameFor = (uid, fallback) => {
    const profile = memberProfiles[uid];
    return profile?.name || profile?.email || fallback || 'Unknown';
  };

  // Load conversations once we have both user and team
  useEffect(() => {
    if (!currentUser || !currentTeam?.id) {
      setConversations([]);
      setActiveConvo(null);
      return;
    }

    const q = query(
      collection(db, 'conversations'),
      where('teamId', '==', currentTeam.id),
      orderBy('lastMessageAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const convos = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(c => c.type === 'announcement' || c.participants?.includes(currentUser.uid));
      setConversations(convos);
      setActiveConvo(prev => {
        if (prev && convos.some(c => c.id === prev.id)) return prev;
        return convos[0] || null;
      });
    });

    return () => unsubscribe();
  }, [currentUser, currentTeam?.id]);

  // Load messages for active conversation
  useEffect(() => {
    if (!activeConvo) { setMessages([]); return; }
    const q = query(
      collection(db, 'conversations', activeConvo.id, 'messages'),
      orderBy('createdAt', 'asc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [activeConvo]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConvo || !currentUser) return;
    const text = newMessage.trim();
    setNewMessage('');

    // Resolve the sender's display name from the Firestore profile cache
    // first, falling back to Auth displayName, then email. This is what
    // actually fixes messages/convo entries showing blank or email-only.
    const senderName =
      displayNameFor(currentUser.uid, currentUser.displayName) ||
      currentUser.email;

    await addDoc(collection(db, 'conversations', activeConvo.id, 'messages'), {
      text,
      senderId: currentUser.uid,
      senderName,
      createdAt: serverTimestamp()
    });
    await updateDoc(doc(db, 'conversations', activeConvo.id), {
      lastMessage: text,
      lastMessageAt: serverTimestamp()
    });
  };

  const handleDeleteConvo = async (convoId) => {
    if (!window.confirm('Delete this conversation?')) return;
    if (activeConvo?.id === convoId) setActiveConvo(null);
    await deleteDoc(doc(db, 'conversations', convoId));
  };

  // Load team members for the "new conversation" picker.
  // Reuses the memberProfiles cache instead of re-fetching from scratch.
  const openNewConvo = async () => {
    if (!currentTeam?.id || !currentUser) return;
    setShowNewConvo(true);
    setSelectedMembers([]);
    setConvoName('');
    setTeamMembers([]);
    setLoadingMembers(true);

    try {
      const memberIds = currentTeam.memberIds || [];
      const otherIds = memberIds.filter(uid => uid !== currentUser.uid);

      if (otherIds.length === 0) { setLoadingMembers(false); return; }

      // If we already have profiles cached (the common case), use them
      // directly instead of hitting Firestore again.
      const haveAllCached = otherIds.every(uid => memberProfiles[uid]);

      let members;
      if (haveAllCached) {
        members = otherIds.map(uid => ({
          uid,
          name: memberProfiles[uid]?.name || null,
          email: memberProfiles[uid]?.email || null,
        }));
      } else {
        const userDocs = await Promise.all(
          otherIds.map(uid => getDoc(doc(db, 'users', uid)))
        );

        members = userDocs
          .map((snap, i) => {
            if (!snap.exists()) return null;
            const data = snap.data();
            return {
              uid: otherIds[i],
              name: data.name || data.displayName || null,
              email: data.email || null,
            };
          })
          .filter(Boolean);
      }

      setTeamMembers(members);
    } catch (err) {
      console.error('Failed to load members:', err);
    } finally {
      setLoadingMembers(false);
    }
  };

  const toggleMember = (uid) => {
    setSelectedMembers(prev =>
      prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
    );
  };

  const handleCreateConvo = async (e) => {
    e.preventDefault();
    if (selectedMembers.length === 0 || !currentTeam || !currentUser) return;

    const participants = [currentUser.uid, ...selectedMembers];
    const type = selectedMembers.length === 1 ? 'direct' : 'group';

    let name = convoName.trim();
    if (!name) {
      if (type === 'direct') {
        const other = teamMembers.find(m => m.uid === selectedMembers[0]);
        name = other?.name || other?.email || 'Direct message';
      } else {
        name = teamMembers
          .filter(m => selectedMembers.includes(m.uid))
          .map(m => m.name || m.email)
          .join(', ');
      }
    }

    const convoRef = await addDoc(collection(db, 'conversations'), {
      teamId: currentTeam.id,
      type,
      name,
      participants,
      lastMessage: '',
      lastMessageAt: serverTimestamp()
    });

    setShowNewConvo(false);
    setActiveConvo({ id: convoRef.id, teamId: currentTeam.id, type, name, participants });
  };

  const isAdmin = currentTeam?.ownerId === currentUser?.uid;

  return (
    <div className="messages-page">

      {/* Conversation list */}
      <div className="convo-list">
        <div className="convo-list-header">
          <h2 className="convo-list-title">Messages</h2>
          <button className="new-convo-btn" onClick={openNewConvo} title="New conversation">+</button>
        </div>

        {!currentTeam && <p className="convo-empty">Select a team to see messages</p>}
        {currentTeam && conversations.length === 0 && <p className="convo-empty">No conversations yet</p>}

        {conversations.map((c) => (
          <div key={c.id} style={{ position: 'relative' }}>
            <button
              className={`convo-item ${activeConvo?.id === c.id ? 'active' : ''}`}
              onClick={() => setActiveConvo(c)}
              style={{ paddingRight: isAdmin ? 36 : undefined }}
            >
              <div className="convo-name">{c.name}</div>
              <div className="convo-last">{c.lastMessage || 'No messages yet'}</div>
            </button>
            {isAdmin && (
              <button
                onClick={(e) => { e.stopPropagation(); handleDeleteConvo(c.id); }}
                title="Delete conversation"
                style={{
                  position: 'absolute', top: '50%', right: 10,
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none',
                  color: '#6B6B6B', fontSize: 16, cursor: 'pointer',
                  lineHeight: 1, padding: '2px 4px', borderRadius: 4,
                  transition: 'color 0.15s',
                }}
                onMouseEnter={e => e.target.style.color = '#FF4444'}
                onMouseLeave={e => e.target.style.color = '#6B6B6B'}
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Active chat */}
      <div className="chat-panel">
        {activeConvo ? (
          <>
            <div className="chat-header">{activeConvo.name}</div>
            <div className="chat-messages">
              {messages.map((m) => {
                const isOwn = m.senderId === currentUser?.uid;
                // Fall back to the live profile cache if the message was
                // stored without a senderName (e.g. older messages, or
                // messages sent before displayName was ever set).
                const label = isOwn
                  ? 'You'
                  : (m.senderName || displayNameFor(m.senderId));
                return (
                  <div
                    key={m.id}
                    className={`chat-bubble ${isOwn ? 'own' : ''}`}
                  >
                    <div className="chat-sender">{label}</div>
                    <div className="chat-text">{m.text}</div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
            <form className="chat-input-row" onSubmit={handleSend}>
              <input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <button type="submit" className="send-btn" aria-label="Send">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </form>
          </>
        ) : (
          <div className="chat-empty">Select a conversation to start chatting</div>
        )}
      </div>

      {/* New conversation modal */}
      {showNewConvo && (
        <div className="modal-overlay" onClick={() => setShowNewConvo(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>New conversation</h3>
            <form onSubmit={handleCreateConvo}>
              <input
                type="text"
                placeholder="Group name (optional)"
                value={convoName}
                onChange={(e) => setConvoName(e.target.value)}
                className="modal-input"
              />

              <div className="member-list">
                {loadingMembers && <p className="convo-empty">Loading members…</p>}
                {!loadingMembers && teamMembers.length === 0 && (
                  <p className="convo-empty">No other team members yet</p>
                )}
                {!loadingMembers && teamMembers.map((m) => {
                  const selected = selectedMembers.includes(m.uid);
                  return (
                    <div
                      key={m.uid}
                      onClick={() => toggleMember(m.uid)}
                      style={{
                        padding: '10px 14px',
                        cursor: 'pointer',
                        borderRadius: 8,
                        marginBottom: 4,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: selected ? 'rgba(179,245,0,0.1)' : 'transparent',
                        border: selected ? '1px solid rgba(179,245,0,0.4)' : '1px solid transparent',
                        transition: 'all 0.15s',
                      }}
                    >
                      <span style={{ fontWeight: 600, fontSize: 14 }}>
                        {m.name || m.email || 'Unknown'}
                      </span>
                      {m.name && m.email && (
                        <span style={{ fontSize: 12, color: '#6B6B6B' }}>{m.email}</span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowNewConvo(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={selectedMembers.length === 0}>
                  Start chat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}