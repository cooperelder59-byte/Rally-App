import { useEffect, useState, useCallback } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../services/firebase";
import { useTeam } from "../context/TeamContext";

// ─── Theme & Constants ───────────────────────────────────────────────────────
const THEME = {
  lime: "#B3F500",
  bg: "#0D0D0D",
  surface: "#1A1A1A",
  border: "#2A2A2A",
  text: "#FFFFFF",
  muted: "#6B6B6B",
  dark: "#444",
};

const TABS = [
  { id: "announcements", label: "ANNOUNCEMENTS" },
  { id: "members", label: "MEMBERS" },
  { id: "photos", label: "PHOTOS" },
  { id: "team-info", label: "TEAM INFO" },
];

// ─── Utility Functions ───────────────────────────────────────────────────────
function timeAgo(date) {
  if (!date) return "";
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  if (secs < 604800) return `${Math.floor(secs / 86400)}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getInitials(name) {
  return (name || "?")
    .split(" ")
    .map(w => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// ─── Avatar Component ───────────────────────────────────────────────────────
function Avatar({ name, size = 38 }) {
  const initials = getInitials(name);
  
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: "50%",
      background: THEME.lime,
      color: "#000",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: 800,
      fontSize: size * 0.36,
      flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

// ─── Post Item Component ───────────────────────────────────────────────────
function PostItem({ post }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
      <Avatar name={post.authorName} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
          <span style={{ fontWeight: 800, fontSize: 13, color: THEME.text }}>
            {post.authorName || "Unknown"}
          </span>
          <span style={{ fontSize: 11, color: THEME.muted }}>
            {timeAgo(post.createdAt)}
          </span>
        </div>
        <div style={{
          background: THEME.surface,
          border: `1px solid ${THEME.border}`,
          borderRadius: "4px 12px 12px 12px",
          padding: "10px 14px",
          fontSize: 14,
          color: "#CCC",
          lineHeight: 1.5,
        }}>
          {post.text}
        </div>
      </div>
    </div>
  );
}

// ─── Compose Form Component ───────────────────────────────────────────────
function ComposeForm({ currentUser, text, onTextChange, onSubmit, sending }) {
  const isValid = text.trim().length > 0 && !sending;

  return (
    <form onSubmit={onSubmit} style={{
      borderTop: `1px solid ${THEME.border}`,
      padding: "12px 16px",
      display: "flex",
      gap: 10,
      alignItems: "center",
    }}>
      {currentUser && (
        <Avatar name={currentUser.displayName || currentUser.email} size={32} />
      )}
      <input
        value={text}
        onChange={e => onTextChange(e.target.value)}
        placeholder="Post an announcement…"
        style={{
          flex: 1,
          background: THEME.surface,
          border: `1.5px solid ${THEME.border}`,
          borderRadius: 10,
          padding: "10px 14px",
          color: THEME.text,
          fontSize: 14,
          fontFamily: "inherit",
          outline: "none",
          transition: "border-color 0.15s",
        }}
        onFocus={e => e.target.style.borderColor = THEME.lime}
        onBlur={e => e.target.style.borderColor = THEME.border}
      />
      <button
        type="submit"
        disabled={!isValid}
        style={{
          background: isValid ? THEME.lime : THEME.surface,
          color: isValid ? "#000" : THEME.muted,
          border: "none",
          borderRadius: 10,
          padding: "10px 18px",
          fontSize: 13,
          fontWeight: 800,
          cursor: isValid ? "pointer" : "default",
          letterSpacing: "0.04em",
          transition: "all 0.15s",
          whiteSpace: "nowrap",
        }}
      >
        {sending ? "…" : "POST"}
      </button>
    </form>
  );
}

// ─── Empty State Component ───────────────────────────────────────────────
function EmptyState({ message = "No announcements yet", description = "Post something below to get started" }) {
  return (
    <div style={{ textAlign: "center", marginTop: 60, color: THEME.muted }}>
      <div style={{
        fontSize: 15,
        fontWeight: 700,
        color: THEME.dark,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
      }}>
        {message}
      </div>
      <div style={{ fontSize: 13, marginTop: 6 }}>
        {description}
      </div>
    </div>
  );
}

// ─── Loading State Component ───────────────────────────────────────────────
function LoadingState() {
  return (
    <p style={{
      color: THEME.muted,
      fontSize: 14,
      textAlign: "center",
      marginTop: 40,
    }}>
      Loading…
    </p>
  );
}

// ─── Announcement Feed Component ───────────────────────────────────────────
function AnnouncementFeed({ teamId, currentUser }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  // Fetch posts
  useEffect(() => {
    if (!teamId) {
      setPosts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, "teams", teamId, "announcements"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, snapshot => {
      setPosts(
        snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || null,
        }))
      );
      setLoading(false);
    });

    return () => unsub();
  }, [teamId]);

  // Handle post submission
  const handlePost = useCallback(async e => {
    e.preventDefault();
    if (!text.trim() || !currentUser || !teamId) return;

    setSending(true);
    try {
      await addDoc(collection(db, "teams", teamId, "announcements"), {
        text: text.trim(),
        authorId: currentUser.uid,
        authorName: currentUser.displayName || currentUser.email,
        createdAt: serverTimestamp(),
      });
      setText("");
    } catch (error) {
      console.error("Error posting announcement:", error);
    } finally {
      setSending(false);
    }
  }, [text, currentUser, teamId]);

  const handleTextChange = useCallback(value => {
    setText(value);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Posts Feed */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "16px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}>
        {loading && <LoadingState />}
        {!loading && posts.length === 0 && <EmptyState />}
        {posts.map(post => (
          <PostItem key={post.id} post={post} />
        ))}
      </div>

      {/* Compose */}
      <ComposeForm
        currentUser={currentUser}
        text={text}
        onTextChange={handleTextChange}
        onSubmit={handlePost}
        sending={sending}
      />
    </div>
  );
}

// ─── Members Component ──────────────────────────────────────────────────
function MemberCard({ member }) {
  const role = member.role || "member";
  const roleColor = role === "admin" ? THEME.lime : THEME.muted;

  return (
    <div style={{
      padding: "12px 14px",
      borderBottom: `1px solid ${THEME.border}`,
      display: "flex",
      alignItems: "center",
      gap: 12,
      justifyContent: "space-between",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
        <Avatar name={member.name || member.email} size={40} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontWeight: 600,
            fontSize: 14,
            color: THEME.text,
            marginBottom: 3,
          }}>
            {member.name || member.email || "Unknown"}
          </div>
          <div style={{
            fontSize: 12,
            color: THEME.muted,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}>
            {member.email}
          </div>
        </div>
      </div>
      <div style={{
        fontSize: 11,
        fontWeight: 800,
        color: roleColor,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
      }}>
        {role}
      </div>
    </div>
  );
}

function MembersTab({ teamId }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teamId) {
      setMembers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, "teams", teamId, "members"),
      orderBy("joinedAt", "desc")
    );

    const unsub = onSnapshot(q, snapshot => {
      setMembers(
        snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }))
      );
      setLoading(false);
    });

    return () => unsub();
  }, [teamId]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "16px 0",
      }}>
        {loading && (
          <p style={{
            color: THEME.muted,
            fontSize: 14,
            textAlign: "center",
            marginTop: 40,
          }}>
            Loading members…
          </p>
        )}
        {!loading && members.length === 0 && <EmptyState message="No members yet" description="Invite teammates to get started" />}
        {members.map(member => (
          <MemberCard key={member.id} member={member} />
        ))}
      </div>
    </div>
  );
}

// ─── Placeholder Tab Component ───────────────────────────────────────────
function PlaceholderTab({ label }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: 300,
      color: THEME.muted,
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: THEME.dark,
        }}>
          {label}
        </div>
        <div style={{ fontSize: 13, marginTop: 6 }}>Coming soon</div>
      </div>
    </div>
  );
}

// ─── Tab Bar Component ───────────────────────────────────────────────────
function TabBar({ activeTab, onTabChange }) {
  return (
    <div style={{
      display: "flex",
      gap: 4,
      marginBottom: 20,
      marginTop: 22,
      borderBottom: `1px solid ${THEME.border}`,
    }}>
      {TABS.map(tab => {
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "10px 16px",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.07em",
              color: active ? THEME.lime : THEME.muted,
              borderBottom: active ? `2px solid ${THEME.lime}` : "2px solid transparent",
              marginBottom: -1,
              transition: "all 0.15s",
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Content Panel Component ───────────────────────────────────────────────
function ContentPanel({ activeTab, currentTeam, currentUser }) {
  const currentTabLabel = TABS.find(t => t.id === activeTab)?.label;

  return (
    <div style={{
      background: THEME.surface,
      border: `1px solid ${THEME.border}`,
      borderRadius: 14,
      overflow: "hidden",
      minHeight: 420,
    }}>
      {/* Header */}
      <div style={{
        padding: "14px 20px",
        borderBottom: `1px solid ${THEME.border}`,
      }}>
        <span style={{
          fontSize: 11,
          color: THEME.muted,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}>
          {currentTeam?.name ? `${currentTeam.name} · ` : ""}
        </span>
        <span style={{
          fontSize: 11,
          fontWeight: 800,
          color: THEME.lime,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}>
          {currentTabLabel}
        </span>
      </div>

      {/* Content */}
      {activeTab === "announcements" && (
        <AnnouncementFeed teamId={currentTeam?.id} currentUser={currentUser} />
      )}
      {activeTab === "members" && (
        <MembersTab teamId={currentTeam?.id} />
      )}
      {activeTab === "photos" && <PlaceholderTab label="Photos" />}
      {activeTab === "team-info" && <PlaceholderTab label="Team Info" />}
    </div>
  );
}

// ─── Main Dashboard Component ───────────────────────────────────────────
export default function Dashboard() {
  const { currentTeam } = useTeam();
  const [activeTab, setActiveTab] = useState("announcements");
  const currentUser = auth.currentUser;

  const handleTabChange = useCallback(tabId => {
    setActiveTab(tabId);
  }, []);

  return (
    <div style={{
      background: THEME.bg,
      minHeight: "100vh",
      fontFamily: "system-ui, -apple-system, sans-serif",
      color: THEME.text,
    }}>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 16px 60px" }}>
        <TabBar activeTab={activeTab} onTabChange={handleTabChange} />
        <ContentPanel
          activeTab={activeTab}
          currentTeam={currentTeam}
          currentUser={currentUser}
        />
      </div>
    </div>
  );
}