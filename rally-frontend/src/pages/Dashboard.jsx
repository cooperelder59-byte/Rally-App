import { useEffect, useState } from "react";
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

// ─── Theme ───────────────────────────────────────────────────────────────────
const LIME = "#B3F500";
const BG = "#0D0D0D";
const SURFACE = "#1A1A1A";
const BORDER = "#2A2A2A";
const TEXT = "#FFFFFF";
const MUTED = "#6B6B6B";

function timeAgo(date) {
  if (!date) return "";
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  if (secs < 604800) return `${Math.floor(secs / 86400)}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function Avatar({ name, size = 38 }) {
  const initials = (name || "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: LIME, color: "#000",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 800, fontSize: size * 0.36, flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

// ─── Announcement Feed ───────────────────────────────────────────────────────
function AnnouncementFeed({ teamId, currentUser }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!teamId) { setPosts([]); setLoading(false); return; }
    setLoading(true);
    const q = query(
      collection(db, "teams", teamId, "announcements"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate?.() || null,
      })));
      setLoading(false);
    });
    return () => unsub();
  }, [teamId]);

  async function handlePost(e) {
    e.preventDefault();
    if (!text.trim() || !currentUser || !teamId) return;
    setSending(true);
    await addDoc(collection(db, "teams", teamId, "announcements"), {
      text: text.trim(),
      authorId: currentUser.uid,
      authorName: currentUser.displayName || currentUser.email,
      createdAt: serverTimestamp(),
    });
    setText("");
    setSending(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Posts */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
        {loading && (
          <p style={{ color: MUTED, fontSize: 14, textAlign: "center", marginTop: 40 }}>Loading…</p>
        )}
        {!loading && posts.length === 0 && (
          <div style={{ textAlign: "center", marginTop: 60, color: MUTED }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#444", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              No announcements yet
            </div>
            <div style={{ fontSize: 13, marginTop: 6 }}>Post something below to get started</div>
          </div>
        )}
        {posts.map((post) => (
          <div key={post.id} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <Avatar name={post.authorName} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
                <span style={{ fontWeight: 800, fontSize: 13, color: TEXT }}>
                  {post.authorName || "Unknown"}
                </span>
                <span style={{ fontSize: 11, color: MUTED }}>{timeAgo(post.createdAt)}</span>
              </div>
              <div style={{
                background: SURFACE, border: `1px solid ${BORDER}`,
                borderRadius: "4px 12px 12px 12px",
                padding: "10px 14px", fontSize: 14, color: "#CCC", lineHeight: 1.5,
              }}>
                {post.text}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Compose */}
      <form onSubmit={handlePost} style={{
        borderTop: `1px solid ${BORDER}`,
        padding: "12px 16px",
        display: "flex", gap: 10, alignItems: "center",
      }}>
        {currentUser && <Avatar name={currentUser.displayName || currentUser.email} size={32} />}
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Post an announcement…"
          style={{
            flex: 1, background: SURFACE, border: `1.5px solid ${BORDER}`,
            borderRadius: 10, padding: "10px 14px", color: TEXT,
            fontSize: 14, fontFamily: "inherit", outline: "none",
          }}
          onFocus={(e) => e.target.style.borderColor = LIME}
          onBlur={(e) => e.target.style.borderColor = BORDER}
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          style={{
            background: text.trim() ? LIME : SURFACE,
            color: text.trim() ? "#000" : MUTED,
            border: "none", borderRadius: 10,
            padding: "10px 18px", fontSize: 13, fontWeight: 800,
            cursor: text.trim() ? "pointer" : "default",
            letterSpacing: "0.04em", transition: "all 0.15s",
            whiteSpace: "nowrap",
          }}
        >
          {sending ? "…" : "POST"}
        </button>
      </form>
    </div>
  );
}

// ─── Placeholder tabs ─────────────────────────────────────────────────────────
function PlaceholderTab({ label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, color: MUTED }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#333" }}>
          {label}
        </div>
        <div style={{ fontSize: 13, marginTop: 6 }}>Coming soon</div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "announcements", label: "ANNOUNCEMENTS" },
  { id: "members", label: "MEMBERS" },
  { id: "photos", label: "PHOTOS" },
  { id: "team-info", label: "TEAM INFO" },
];

export default function Dashboard() {
  const { currentTeam } = useTeam();
  const [activeTab, setActiveTab] = useState("announcements");
  const currentUser = auth.currentUser;

  return (
    <div style={{
      background: BG, minHeight: "100vh",
      fontFamily: "system-ui, -apple-system, sans-serif", color: TEXT,
    }}>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 16px 60px" }}>

        {/* Tab bar */}
        <div style={{
          display: "flex", gap: 4, marginBottom: 20, marginTop: 22,
          borderBottom: `1px solid ${BORDER}`,
        }}>
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  padding: "10px 16px", fontSize: 11, fontWeight: 800,
                  letterSpacing: "0.07em", color: active ? LIME : MUTED,
                  borderBottom: active ? `2px solid ${LIME}` : "2px solid transparent",
                  marginBottom: -1, transition: "all 0.15s",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content panel */}
        <div style={{
          background: SURFACE, border: `1px solid ${BORDER}`,
          borderRadius: 14, overflow: "hidden", minHeight: 420,
        }}>
          {/* Panel header */}
          <div style={{
            padding: "14px 20px", borderBottom: `1px solid ${BORDER}`,
          }}>
            <span style={{ fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {currentTeam?.name ? `${currentTeam.name} · ` : ""}
            </span>
            <span style={{ fontSize: 11, fontWeight: 800, color: LIME, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {TABS.find((t) => t.id === activeTab)?.label}
            </span>
          </div>

          {activeTab === "announcements" && (
            <AnnouncementFeed teamId={currentTeam?.id} currentUser={currentUser} />
          )}
          {activeTab === "members" && <PlaceholderTab label="Members" />}
          {activeTab === "photos" && <PlaceholderTab label="Photos" />}
          {activeTab === "team-info" && <PlaceholderTab label="Team Info" />}
        </div>
      </div>
    </div>
  );
}