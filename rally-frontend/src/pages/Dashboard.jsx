import { useEffect, useState, useCallback, useRef } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../services/firebase";
import { useTeam } from "../context/TeamContext";

// ─── Theme & Constants ────────────────────────────────────────────────────────
const THEME = {
  lime: "#B3F500",
  bg: "#0D0D0D",
  surface: "#1A1A1A",
  surface2: "#222222",
  border: "#2A2A2A",
  text: "#FFFFFF",
  muted: "#6B6B6B",
  dark: "#444",
  red: "#FF4444",
};

const TABS = [
  { id: "announcements", label: "ANNOUNCEMENTS" },
  { id: "members",       label: "MEMBERS"       },
  { id: "photos",        label: "PHOTOS"        },
  { id: "team-info",     label: "TEAM INFO"     },
];

// ─── Utility ──────────────────────────────────────────────────────────────────
function timeAgo(date) {
  if (!date) return "";
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 60)     return "just now";
  if (secs < 3600)   return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400)  return `${Math.floor(secs / 3600)}h ago`;
  if (secs < 604800) return `${Math.floor(secs / 86400)}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getInitials(name) {
  return (name || "?")
    .split(" ")
    .filter(Boolean)
    .map(w => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ name, src, size = 38 }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={{
          width: size, height: size, borderRadius: "50%",
          objectFit: "cover", flexShrink: 0,
        }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: THEME.lime, color: "#000",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 800, fontSize: size * 0.36, flexShrink: 0,
    }}>
      {getInitials(name)}
    </div>
  );
}

// ─── Invite Code Banner ───────────────────────────────────────────────────────
function InviteCodeBanner({ inviteCode }) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  if (!inviteCode) return null;

  const handleCopy = () => {
    if (!navigator.clipboard) {
      setCopyError(true);
      setTimeout(() => setCopyError(false), 2000);
      return;
    }
    navigator.clipboard.writeText(inviteCode)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error("Clipboard write failed:", err);
        setCopyError(true);
        setTimeout(() => setCopyError(false), 2000);
      });
  };

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      background: THEME.surface,
      border: `1px solid ${THEME.border}`,
      borderRadius: 10,
      padding: "8px 14px",
      marginBottom: 18,
    }}>
      <span style={{ fontSize: 11, color: THEME.muted, textTransform: "uppercase", letterSpacing: "0.07em", whiteSpace: "nowrap" }}>
        Invite Code
      </span>
      <span style={{
        flex: 1,
        fontFamily: "monospace",
        fontSize: 16,
        fontWeight: 800,
        color: THEME.lime,
        letterSpacing: "0.18em",
      }}>
        {inviteCode}
      </span>
      <button
        onClick={handleCopy}
        style={{
          background: copied ? THEME.lime : copyError ? THEME.red : THEME.surface2,
          color: copied ? "#000" : "#fff",
          border: `1px solid ${copied ? THEME.lime : copyError ? THEME.red : THEME.border}`,
          borderRadius: 7,
          padding: "5px 12px",
          fontSize: 11,
          fontWeight: 800,
          cursor: "pointer",
          letterSpacing: "0.05em",
          transition: "all 0.15s",
          whiteSpace: "nowrap",
        }}
      >
        {copied ? "COPIED!" : copyError ? "COPY FAILED" : "COPY"}
      </button>
    </div>
  );
}

// ─── Post Item ────────────────────────────────────────────────────────────────
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
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}>
          {post.text}
        </div>
      </div>
    </div>
  );
}

// ─── Compose Form ─────────────────────────────────────────────────────────────
function ComposeForm({ currentUser, text, onTextChange, onSubmit, sending }) {
  const isValid = text.trim().length > 0 && !sending;

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && isValid) {
      onSubmit(e);
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      style={{
        borderTop: `1px solid ${THEME.border}`,
        padding: "12px 16px",
        display: "flex",
        gap: 10,
        alignItems: "center",
      }}
    >
      {currentUser && (
        <Avatar name={currentUser.displayName || currentUser.email} size={32} />
      )}
      <input
        value={text}
        onChange={e => onTextChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Post an announcement… (⌘↵ to send)"
        disabled={sending}
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
        onFocus={e => (e.target.style.borderColor = THEME.lime)}
        onBlur={e => (e.target.style.borderColor = THEME.border)}
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

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ message = "Nothing here yet", description = "" }) {
  return (
    <div style={{ textAlign: "center", marginTop: 60, color: THEME.muted }}>
      <div style={{
        fontSize: 15, fontWeight: 700, color: THEME.dark,
        textTransform: "uppercase", letterSpacing: "0.06em",
      }}>
        {message}
      </div>
      {description && (
        <div style={{ fontSize: 13, marginTop: 6 }}>{description}</div>
      )}
    </div>
  );
}

function LoadingState({ label = "Loading…" }) {
  return (
    <p style={{ color: THEME.muted, fontSize: 14, textAlign: "center", marginTop: 40 }}>
      {label}
    </p>
  );
}

function ErrorState({ message }) {
  return (
    <div style={{
      margin: "16px 20px", padding: "10px 14px",
      background: `${THEME.red}18`, border: `1px solid ${THEME.red}44`,
      borderRadius: 8, color: THEME.red, fontSize: 13,
    }}>
      {message}
    </div>
  );
}

// ─── Announcement Feed ────────────────────────────────────────────────────────
function AnnouncementFeed({ teamId, currentUser }) {
  const [posts, setPosts]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [text, setText]       = useState("");
  const [sending, setSending] = useState(false);
  const [postError, setPostError] = useState(null);

  useEffect(() => {
    if (!teamId) { setPosts([]); setLoading(false); setLoadError(null); return; }
    setLoading(true);
    setLoadError(null);
    const q = query(
      collection(db, "teams", teamId, "announcements"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(
      q,
      snap => {
        setPosts(snap.docs.map(d => ({
          id: d.id,
          ...d.data(),
          createdAt: d.data().createdAt?.toDate?.() || null,
        })));
        setLoading(false);
      },
      err => {
        console.error("Failed to load announcements:", err);
        setLoadError("Couldn't load announcements — try refreshing.");
        setLoading(false);
      }
    );
    return () => unsub();
  }, [teamId]);

  const handlePost = useCallback(async e => {
    e.preventDefault();
    if (sending || !text.trim() || !currentUser || !teamId) return;
    setSending(true);
    setPostError(null);
    try {
      await addDoc(collection(db, "teams", teamId, "announcements"), {
        text: text.trim(),
        authorId: currentUser.uid,
        authorName: currentUser.displayName || currentUser.email,
        createdAt: serverTimestamp(),
      });
      setText("");
    } catch (err) {
      console.error("Error posting:", err);
      setPostError("Couldn't post that — please try again.");
    } finally {
      setSending(false);
    }
  }, [text, currentUser, teamId, sending]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{
        flex: 1, overflowY: "auto", padding: "16px 20px",
        display: "flex", flexDirection: "column", gap: 16,
      }}>
        {loading && <LoadingState />}
        {!loading && loadError && <ErrorState message={loadError} />}
        {!loading && !loadError && posts.length === 0 && (
          <EmptyState message="No announcements yet" description="Post something below to get started" />
        )}
        {posts.map(post => <PostItem key={post.id} post={post} />)}
      </div>
      {postError && <ErrorState message={postError} />}
      <ComposeForm
        currentUser={currentUser}
        text={text}
        onTextChange={setText}
        onSubmit={handlePost}
        sending={sending}
      />
    </div>
  );
}

// ─── Members Tab ──────────────────────────────────────────────────────────────
function MemberCard({ member }) {
  const role = member.role || "member";
  const roleColor = role === "admin" ? THEME.lime : THEME.muted;

  return (
    <div style={{
      padding: "12px 20px",
      borderBottom: `1px solid ${THEME.border}`,
      display: "flex",
      alignItems: "center",
      gap: 12,
      justifyContent: "space-between",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
        <Avatar name={member.name || member.email} src={member.photoURL} size={40} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: THEME.text, marginBottom: 2 }}>
            {member.name || member.email || "Unknown"}
          </div>
          {member.name && (
            <div style={{ fontSize: 12, color: THEME.muted }}>
              {member.email}
            </div>
          )}
        </div>
      </div>
      <div style={{
        fontSize: 11, fontWeight: 800, color: roleColor,
        textTransform: "uppercase", letterSpacing: "0.06em",
        background: role === "admin" ? "rgba(179,245,0,0.1)" : "transparent",
        border: role === "admin" ? `1px solid rgba(179,245,0,0.3)` : "1px solid transparent",
        borderRadius: 5,
        padding: "3px 8px",
        flexShrink: 0,
      }}>
        {role}
      </div>
    </div>
  );
}

function MembersTab({ teamId, currentUser }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    if (!teamId) { setMembers([]); setLoading(false); setLoadError(null); return; }
    setLoading(true);
    setLoadError(null);

    let cancelled = false;

    // Watch the team doc — members are stored as a memberIds array, not a subcollection.
    const unsub = onSnapshot(
      doc(db, "teams", teamId),
      (teamSnap) => {
        if (cancelled) return;

        if (!teamSnap.exists()) { setMembers([]); setLoading(false); return; }

        const data = teamSnap.data();
        const memberIds = Array.from(new Set(data.memberIds || []));
        const ownerId = data.ownerId;

        if (memberIds.length === 0) { setMembers([]); setLoading(false); return; }

        // Fetch each user profile from the users collection. Wrapped in a
        // try/catch — previously an unhandled rejection here (e.g. one
        // permission-denied doc) would leave the tab stuck on "Loading…"
        // forever with no feedback.
        (async () => {
          try {
            const userDocs = await Promise.all(
              memberIds.map(uid =>
                getDoc(doc(db, "users", uid)).catch(err => {
                  console.error(`Failed to load user ${uid}:`, err);
                  return null;
                })
              )
            );
            if (cancelled) return;

            const resolved = userDocs.map((userSnap, i) => {
              const uid = memberIds[i];
              const profile = userSnap?.exists() ? userSnap.data() : {};
              return {
                id: uid,
                name: profile.displayName || profile.name || null,
                email: profile.email || null,
                photoURL: profile.photoURL || null,
                role: uid === ownerId ? "admin" : "member",
              };
            });

            // Fill in current user's info from auth if their Firestore profile is sparse.
            const filled = resolved.map(m => {
              if (currentUser && m.id === currentUser.uid && !m.name && !m.email) {
                return {
                  ...m,
                  name: currentUser.displayName || null,
                  email: currentUser.email || null,
                  photoURL: currentUser.photoURL || null,
                };
              }
              return m;
            });

            // Owner first, then alphabetical. (At most one "admin" today,
            // but the tie case is handled so this stays correct if that
            // ever changes.)
            filled.sort((a, b) => {
              if (a.role === "admin" && b.role !== "admin") return -1;
              if (b.role === "admin" && a.role !== "admin") return 1;
              return (a.name || a.email || "").localeCompare(b.name || b.email || "");
            });

            if (!cancelled) {
              setMembers(filled);
              setLoading(false);
            }
          } catch (err) {
            if (!cancelled) {
              console.error("Failed to resolve member profiles:", err);
              setLoadError("Couldn't load members — try refreshing.");
              setLoading(false);
            }
          }
        })();
      },
      err => {
        if (cancelled) return;
        console.error("Failed to watch team doc:", err);
        setLoadError("Couldn't load members — try refreshing.");
        setLoading(false);
      }
    );

    return () => {
      cancelled = true;
      unsub();
    };
  }, [teamId, currentUser]);

  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <div style={{ padding: "12px 20px 8px", borderBottom: `1px solid ${THEME.border}` }}>
        <span style={{ fontSize: 12, color: THEME.muted }}>
          {loading ? "—" : members.length} {members.length === 1 ? "member" : "members"}
        </span>
      </div>
      {loading && <LoadingState label="Loading members…" />}
      {!loading && loadError && <ErrorState message={loadError} />}
      {!loading && !loadError && members.length === 0 && (
        <EmptyState message="No members yet" description="Share the invite code to grow your team" />
      )}
      {members.map(m => <MemberCard key={m.id} member={m} />)}
    </div>
  );
}

// ─── Photos Tab ───────────────────────────────────────────────────────────────
function PhotoGrid({ photos, onPhotoClick }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
      gap: 4,
      padding: 4,
    }}>
      {photos.map(photo => (
        <div
          key={photo.id}
          onClick={() => onPhotoClick(photo)}
          style={{
            position: "relative",
            paddingBottom: "100%",
            background: THEME.surface2,
            cursor: "pointer",
            overflow: "hidden",
          }}
        >
          <img
            src={photo.url}
            alt={photo.caption || "Photo"}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transition: "opacity 0.15s",
            }}
            onMouseEnter={e => (e.target.style.opacity = 0.8)}
            onMouseLeave={e => (e.target.style.opacity = 1)}
          />
          {photo.caption && (
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
              padding: "16px 8px 6px",
              fontSize: 11, color: "#fff",
            }}>
              {photo.caption}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function PhotoLightbox({ photo, onClose }) {
  useEffect(() => {
    const handleKey = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.92)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24,
      }}
    >
      <div onClick={e => e.stopPropagation()} style={{ maxWidth: "90vw", maxHeight: "90vh", position: "relative" }}>
        <img
          src={photo.url}
          alt={photo.caption || "Photo"}
          style={{ maxWidth: "100%", maxHeight: "85vh", objectFit: "contain", borderRadius: 8 }}
        />
        {photo.caption && (
          <div style={{ marginTop: 10, color: "#ccc", fontSize: 14, textAlign: "center" }}>
            {photo.caption}
          </div>
        )}
        <div style={{ fontSize: 12, color: THEME.muted, textAlign: "center", marginTop: 4 }}>
          Uploaded by {photo.uploaderName} · {timeAgo(photo.createdAt)}
        </div>
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: -12, right: -12,
            background: THEME.surface, border: `1px solid ${THEME.border}`,
            borderRadius: "50%", width: 32, height: 32,
            color: THEME.text, fontSize: 16, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}

// Firestore has a 1MB doc limit — we resize images client-side before saving as base64
function resizeImageToBase64(file, maxDimension = 1200, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    const cleanup = () => URL.revokeObjectURL(url);
    img.onload = () => {
      cleanup();
      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        if (width > height) { height = Math.round((height / width) * maxDimension); width = maxDimension; }
        else { width = Math.round((width / height) * maxDimension); height = maxDimension; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = (e) => {
      cleanup();
      reject(e);
    };
    img.src = url;
  });
}

function PhotosTab({ teamId, currentUser }) {
  const [photos, setPhotos]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption]     = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [error, setError]         = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!teamId) { setPhotos([]); setLoading(false); setLoadError(null); return; }
    setLoading(true);
    setLoadError(null);
    const q = query(
      collection(db, "teams", teamId, "photos"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(
      q,
      snap => {
        setPhotos(snap.docs.map(d => ({
          id: d.id,
          ...d.data(),
          createdAt: d.data().createdAt?.toDate?.() || null,
        })));
        setLoading(false);
      },
      err => {
        console.error("Failed to load photos:", err);
        setLoadError("Couldn't load photos — try refreshing.");
        setLoading(false);
      }
    );
    return () => unsub();
  }, [teamId]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser || !teamId || uploading) return;
    setError("");

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }
    // Allow up to 20MB raw — we'll resize it down
    if (file.size > 20 * 1024 * 1024) {
      setError("File too large. Max 20 MB.");
      return;
    }

    setUploading(true);
    try {
      const base64 = await resizeImageToBase64(file);
      await addDoc(collection(db, "teams", teamId, "photos"), {
        url: base64,
        caption: caption.trim() || null,
        uploaderId: currentUser.uid,
        uploaderName: currentUser.displayName || currentUser.email,
        createdAt: serverTimestamp(),
      });
      setCaption("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      console.error("Upload failed:", err);
      setError("Upload failed — image may be too large for Firestore (1 MB doc limit). Try a smaller image.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {selectedPhoto && (
        <PhotoLightbox photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} />
      )}

      <div style={{ flex: 1, overflowY: "auto" }}>
        {loading && <LoadingState label="Loading photos…" />}
        {!loading && loadError && <ErrorState message={loadError} />}
        {!loading && !loadError && photos.length === 0 && (
          <EmptyState message="No photos yet" description="Upload the first photo below" />
        )}
        {photos.length > 0 && (
          <PhotoGrid photos={photos} onPhotoClick={setSelectedPhoto} />
        )}
      </div>

      {/* Upload error banner — previously rendered inline inside the upload
          bar's flex row, squeezed between the buttons; moved above it. */}
      {error && (
        <div style={{ padding: "8px 16px 0", fontSize: 12, color: THEME.red }}>
          {error}
        </div>
      )}

      {/* Upload Bar */}
      <div style={{
        borderTop: `1px solid ${THEME.border}`,
        padding: "12px 16px",
        display: "flex",
        gap: 10,
        alignItems: "center",
      }}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleUpload}
          style={{ display: "none" }}
          id="photo-upload-input"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          style={{
            background: THEME.surface2,
            border: `1px solid ${THEME.border}`,
            borderRadius: 10,
            padding: "10px 14px",
            color: uploading ? THEME.muted : THEME.text,
            fontSize: 13,
            fontWeight: 700,
            cursor: uploading ? "default" : "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {uploading ? "Processing…" : "📷 Add Photo"}
        </button>
        <input
          value={caption}
          onChange={e => setCaption(e.target.value)}
          placeholder="Optional caption…"
          disabled={uploading}
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
          }}
          onFocus={e => (e.target.style.borderColor = THEME.lime)}
          onBlur={e => (e.target.style.borderColor = THEME.border)}
        />
      </div>
    </div>
  );
}

// ─── Team Info Tab ────────────────────────────────────────────────────────────
function InfoRow({ label, value, accent }) {
  return (
    <div style={{
      padding: "14px 20px",
      borderBottom: `1px solid ${THEME.border}`,
      display: "flex",
      alignItems: "flex-start",
      gap: 16,
    }}>
      <div style={{
        fontSize: 11, fontWeight: 800, color: THEME.muted,
        textTransform: "uppercase", letterSpacing: "0.07em",
        minWidth: 100, paddingTop: 1,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 14,
        color: accent ? THEME.lime : THEME.text,
        fontWeight: accent ? 800 : 400,
        fontFamily: accent ? "monospace" : "inherit",
        letterSpacing: accent ? "0.1em" : "normal",
        flex: 1,
      }}>
        {value || <span style={{ color: THEME.muted }}>—</span>}
      </div>
    </div>
  );
}

function TeamInfoTab({ team, currentUser }) {
  const [editing, setEditing]   = useState(false);
  const [desc, setDesc]         = useState(team?.description || "");
  const [saving, setSaving]     = useState(false);
  const [saveError, setSaveError] = useState(null);

  // Bug fix: this previously checked `team.members[...]?.role` and
  // `team.createdBy`, but the actual schema (see MembersTab) stores the
  // owner as `team.ownerId` with no `members` map at all — so isAdmin was
  // always false and the Edit button never appeared for the owner.
  const isAdmin = team?.ownerId === currentUser?.uid;

  // Keep the draft in sync if the underlying team doc changes (e.g. another
  // admin edits it) while this tab isn't in edit mode.
  useEffect(() => {
    if (!editing) setDesc(team?.description || "");
  }, [team?.description, editing]);

  const handleSave = async () => {
    if (!team?.id) return;
    setSaving(true);
    setSaveError(null);
    try {
      await updateDoc(doc(db, "teams", team.id), { description: desc.trim() });
      setEditing(false);
    } catch (err) {
      console.error("Save failed:", err);
      setSaveError("Couldn't save — please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!team) {
    return <EmptyState message="No team selected" description="Create or join a team to get started" />;
  }

  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <InfoRow label="Team Name"   value={team.name} />
      <InfoRow label="Invite Code" value={team.inviteCode} accent />
      <InfoRow label="Sport"       value={team.sport} />
      <InfoRow label="Location"    value={team.location} />
      <InfoRow
        label="Created"
        value={team.createdAt?.toDate
          ? team.createdAt.toDate().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
          : null}
      />

      {/* Description */}
      <div style={{ padding: "14px 20px", borderBottom: `1px solid ${THEME.border}` }}>
        <div style={{
          fontSize: 11, fontWeight: 800, color: THEME.muted,
          textTransform: "uppercase", letterSpacing: "0.07em",
          marginBottom: 10,
        }}>
          Description
        </div>
        {editing ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <textarea
              value={desc}
              onChange={e => setDesc(e.target.value)}
              rows={4}
              placeholder="Describe your team…"
              disabled={saving}
              style={{
                background: THEME.surface2,
                border: `1.5px solid ${THEME.lime}`,
                borderRadius: 8,
                padding: "10px 12px",
                color: THEME.text,
                fontSize: 14,
                fontFamily: "inherit",
                resize: "vertical",
                outline: "none",
              }}
            />
            {saveError && (
              <div style={{ fontSize: 12, color: THEME.red }}>{saveError}</div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  background: THEME.lime, color: "#000",
                  border: "none", borderRadius: 8,
                  padding: "8px 16px", fontSize: 13, fontWeight: 800,
                  cursor: saving ? "default" : "pointer",
                }}
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                onClick={() => { setEditing(false); setDesc(team.description || ""); setSaveError(null); }}
                disabled={saving}
                style={{
                  background: "none", color: THEME.muted,
                  border: `1px solid ${THEME.border}`, borderRadius: 8,
                  padding: "8px 16px", fontSize: 13, fontWeight: 600,
                  cursor: saving ? "not-allowed" : "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{ flex: 1, fontSize: 14, color: team.description ? "#CCC" : THEME.muted, lineHeight: 1.6 }}>
              {team.description || "No description yet."}
            </div>
            {isAdmin && (
              <button
                onClick={() => setEditing(true)}
                style={{
                  background: "none", border: `1px solid ${THEME.border}`,
                  borderRadius: 7, padding: "5px 12px",
                  color: THEME.muted, fontSize: 12, fontWeight: 700,
                  cursor: "pointer", whiteSpace: "nowrap",
                }}
              >
                Edit
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tab Bar ──────────────────────────────────────────────────────────────────
function TabBar({ activeTab, onTabChange }) {
  return (
    <div style={{
      display: "flex", gap: 4,
      marginBottom: 20, marginTop: 22,
      borderBottom: `1px solid ${THEME.border}`,
    }}>
      {TABS.map(tab => {
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              padding: "10px 16px",
              fontSize: 11, fontWeight: 800, letterSpacing: "0.07em",
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

// ─── Content Panel ────────────────────────────────────────────────────────────
function ContentPanel({ activeTab, currentTeam, currentUser }) {
  const currentTabLabel = TABS.find(t => t.id === activeTab)?.label;

  return (
    <div style={{
      background: THEME.surface,
      border: `1px solid ${THEME.border}`,
      borderRadius: 14,
      overflow: "hidden",
      minHeight: 420,
      display: "flex",
      flexDirection: "column",
    }}>
      <div style={{ padding: "14px 20px", borderBottom: `1px solid ${THEME.border}` }}>
        <span style={{ fontSize: 11, color: THEME.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {currentTeam?.name ? `${currentTeam.name} · ` : ""}
        </span>
        <span style={{
          fontSize: 11, fontWeight: 800, color: THEME.lime,
          textTransform: "uppercase", letterSpacing: "0.08em",
        }}>
          {currentTabLabel}
        </span>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {activeTab === "announcements" && (
          <AnnouncementFeed teamId={currentTeam?.id} currentUser={currentUser} />
        )}
        {activeTab === "members" && (
          <MembersTab teamId={currentTeam?.id} currentUser={currentUser} />
        )}
        {activeTab === "photos" && (
          <PhotosTab teamId={currentTeam?.id} currentUser={currentUser} />
        )}
        {activeTab === "team-info" && (
          <TeamInfoTab team={currentTeam} currentUser={currentUser} />
        )}
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const { currentTeam } = useTeam();
  const [activeTab, setActiveTab] = useState("announcements");

  // Bug fix: this used to read `auth.currentUser` once at initial render,
  // which is frequently still `null` at that point (Firebase auth resolves
  // asynchronously) and never updates again afterward — every child that
  // depends on currentUser (compose form, "can I edit this" checks, etc.)
  // could get stuck treating a logged-in user as logged-out. Subscribing to
  // onAuthStateChanged keeps it live.
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setCurrentUser(u));
    return () => unsub();
  }, []);

  const handleTabChange = useCallback(tabId => setActiveTab(tabId), []);

  return (
    <div style={{
      background: THEME.bg,
      minHeight: "100vh",
      fontFamily: "system-ui, -apple-system, sans-serif",
      color: THEME.text,
    }}>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 16px 60px" }}>
        <TabBar activeTab={activeTab} onTabChange={handleTabChange} />
        <InviteCodeBanner inviteCode={currentTeam?.inviteCode} />
        <ContentPanel
          activeTab={activeTab}
          currentTeam={currentTeam}
          currentUser={currentUser}
        />
      </div>
    </div>
  );
}