import { useState, useEffect, useRef } from 'react';
import {
  collection, query, where, orderBy, onSnapshot,
  addDoc, serverTimestamp, doc, updateDoc, getDoc
} from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { useTeam } from '../context/TeamContext';
import '../styles/messages.css';

export default function Messages() {
  const { currentTeam } = useTeam();
  const [conversations, setConversations] = useState([]);
  const [activeConvo, setActiveConvo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showNewConvo, setShowNewConvo] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [convoName, setConvoName] = useState('');
  const [loadingMembers, setLoadingMembers] = useState(false);
  const messagesEndRef = useRef(null);

  const currentUser = auth.currentUser;

  // Load conversations for the current team
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
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, [activeConvo]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConvo || !currentUser) return;
    const text = newMessage.trim();
    setNewMessage('');
    await addDoc(collection(db, 'conversations', activeConvo.id, 'messages'), {
      text,
      senderId: currentUser.uid,
      senderName: currentUser.displayName || currentUser.email,
      createdAt: serverTimestamp()
    });
    await updateDoc(doc(db, 'conversations', activeConvo.id), {
      lastMessage: text,
      lastMessageAt: serverTimestamp()
    });
  };

  // Load team members by reading the team doc fresh from Firestore
  // so we always have memberIds even if currentTeam context is stale
  const openNewConvo = async () => {
    if (!currentTeam?.id) return;
    setShowNewConvo(true);
    setSelectedMembers([]);
    setConvoName('');
    setTeamMembers([]);
    setLoadingMembers(true);

    try {
      // Read team doc directly to get fresh memberIds
      const teamSnap = await getDoc(doc(db, 'teams', currentTeam.id));
      if (!teamSnap.exists()) { setLoadingMembers(false); return; }

      const memberIds = teamSnap.data().memberIds || [];
      const otherIds = memberIds.filter(uid => uid !== currentUser.uid);

      if (otherIds.length === 0) { setLoadingMembers(false); return; }

      const userDocs = await Promise.all(
        otherIds.map(uid => getDoc(doc(db, 'users', uid)))
      );

      const members = userDocs
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
    if (selectedMembers.length === 0 || !currentTeam) return;

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
          <button
            key={c.id}
            className={`convo-item ${activeConvo?.id === c.id ? 'active' : ''}`}
            onClick={() => setActiveConvo(c)}
          >
            <div className="convo-name">{c.name}</div>
            <div className="convo-last">{c.lastMessage || 'No messages yet'}</div>
          </button>
        ))}
      </div>

      {/* Active chat */}
      <div className="chat-panel">
        {activeConvo ? (
          <>
            <div className="chat-header">{activeConvo.name}</div>
            <div className="chat-messages">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`chat-bubble ${m.senderId === currentUser?.uid ? 'own' : ''}`}
                >
                  <div className="chat-sender">
                    {m.senderId === currentUser?.uid ? 'You' : m.senderName}
                  </div>
                  <div className="chat-text">{m.text}</div>
                </div>
              ))}
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
                placeholder="Conversation name (optional)"
                value={convoName}
                onChange={(e) => setConvoName(e.target.value)}
                className="modal-input"
              />

              <div className="member-list">
                {loadingMembers && (
                  <p className="convo-empty">Loading members…</p>
                )}
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
                        {m.name || m.email}
                      </span>
                      {m.name && (
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