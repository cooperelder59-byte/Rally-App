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
  const messagesEndRef = useRef(null);

  const currentUser = auth.currentUser;

  // Load conversations for the CURRENT TEAM only
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
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(c => c.type === 'announcement' || c.participants?.includes(currentUser.uid));
      setConversations(convos);
      setActiveConvo(prev => {
        if (prev && convos.some(c => c.id === prev.id)) return prev;
        return convos[0] || null;
      });
    });

    return () => unsubscribe();
  }, [currentUser, currentTeam?.id]);

  // Load messages for the active conversation
  useEffect(() => {
    if (!activeConvo) {
      setMessages([]);
      return;
    }

    const q = query(
      collection(db, 'conversations', activeConvo.id, 'messages'),
      orderBy('createdAt', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
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

  // Load team members when opening "new conversation"
  const openNewConvo = async () => {
    if (!currentTeam) return;
    setShowNewConvo(true);
    setSelectedMembers([]);
    setConvoName('');

    const memberDocs = await Promise.all(
      (currentTeam.memberIds || [])
        .filter(uid => uid !== currentUser.uid)
        .map(async (uid) => {
          const snap = await getDoc(doc(db, 'users', uid));
          return snap.exists() ? { uid, ...snap.data() } : null;
        })
    );
    setTeamMembers(memberDocs.filter(Boolean));
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
        name = other?.name || 'Direct message';
      } else {
        name = teamMembers
          .filter(m => selectedMembers.includes(m.uid))
          .map(m => m.name)
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
          <button className="new-convo-btn" onClick={openNewConvo} title="New conversation">
            +
          </button>
        </div>

        {!currentTeam && (
          <p className="convo-empty">Select a team to see messages</p>
        )}
        {currentTeam && conversations.length === 0 && (
          <p className="convo-empty">No conversations yet</p>
        )}
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

      {/* NEW CONVERSATION MODAL */}
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
                {teamMembers.length === 0 && (
                  <p className="convo-empty">No other team members yet</p>
                )}
                {teamMembers.map((m) => (
                  <label key={m.uid} className="member-item">
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(m.uid)}
                      onChange={() => toggleMember(m.uid)}
                    />
                    {m.name || m.email}
                  </label>
                ))}
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