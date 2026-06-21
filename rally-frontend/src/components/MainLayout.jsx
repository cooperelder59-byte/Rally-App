import { useState, useCallback } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useTeam } from '../context/TeamContext';

// ─── Constants ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { path: '/dashboard',   label: 'Dashboard'   },
  { path: '/messages',    label: 'Messages'    },
  { path: '/schedule',    label: 'Schedule'    },
  { path: '/roster',      label: 'Roster'      },
  { path: '/performance', label: 'Performance' },
];

const PRIMARY = '#c8ff3d';

// ─── Logo ─────────────────────────────────────────────────────────────────────

function RallyLogo() {
  return (
    <svg width="26" height="26" viewBox="0 0 40 32" fill="none" aria-hidden="true">
      <polygon points="0,0 13,16 0,32 7,32 20,16 7,0"   fill={PRIMARY} />
      <polygon points="10,0 23,16 10,32 17,32 30,16 17,0" fill={PRIMARY} opacity=".75" />
      <polygon points="20,0 33,16 20,32 27,32 40,16 27,0" fill={PRIMARY} opacity=".5" />
    </svg>
  );
}

// ─── Team Switcher ────────────────────────────────────────────────────────────

function TeamSwitcher({ teamMenuOpen, onToggle, teams, currentTeam, onSwitch, onCreateTeam }) {
  return (
    <div style={styles.teamSwitcher}>
      <button style={styles.teamBtn} onClick={onToggle} aria-label="Switch team">
        <span style={styles.teamDot} />
        <span style={styles.teamName}>{currentTeam?.name || 'No team'}</span>
        <span style={{ ...styles.teamArrow, transform: teamMenuOpen ? 'rotate(180deg)' : 'none' }}>
          ⌄
        </span>
      </button>

      {teamMenuOpen && (
        <div style={styles.teamMenu}>
          {teams.map(team => (
            <button
              key={team.id}
              style={{
                ...styles.teamMenuItem,
                ...(currentTeam?.id === team.id ? styles.teamMenuItemActive : {}),
              }}
              onClick={() => onSwitch(team.id)}
            >
              {currentTeam?.id === team.id && <span style={styles.teamCheck}>✓</span>}
              {team.name}
            </button>
          ))}
          <div style={styles.teamMenuDivider} />
          <button style={{ ...styles.teamMenuItem, ...styles.teamMenuCreate }} onClick={onCreateTeam}>
            + Create or join a team
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Sidebar Nav ──────────────────────────────────────────────────────────────

function SidebarNav({ activePath }) {
  return (
    <nav style={styles.nav} aria-label="Main navigation">
      {NAV_ITEMS.map(item => {
        const isActive = activePath === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            style={{
              ...styles.navLink,
              ...(isActive ? styles.navLinkActive : {}),
            }}
          >
            {item.label}
            {isActive && <span style={styles.navActivePip} />}
          </Link>
        );
      })}
    </nav>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({
  open,
  teamMenuOpen, onToggleTeamMenu,
  teams, currentTeam, onSwitchTeam, onCreateTeam,
  activeNavPath,
  onLogout,
  onLogoClick,
}) {
  return (
    <>
      {/* Overlay for mobile */}
      {open && (
        <div
          style={styles.overlay}
          onClick={onLogoClick /* close on overlay tap */}
          aria-hidden="true"
        />
      )}

      <aside style={{ ...styles.sidebar, ...(open ? styles.sidebarOpen : styles.sidebarClosed) }}>
        {/* Logo */}
        <button style={styles.logoBtn} onClick={onLogoClick} aria-label="Go to home">
          <RallyLogo />
          <span style={styles.logoText}>RALLY</span>
        </button>

        <TeamSwitcher
          teamMenuOpen={teamMenuOpen}
          onToggle={onToggleTeamMenu}
          teams={teams}
          currentTeam={currentTeam}
          onSwitch={onSwitchTeam}
          onCreateTeam={onCreateTeam}
        />

        <SidebarNav activePath={activeNavPath} />

        <div style={styles.sidebarFooter}>
          <button style={styles.logoutBtn} onClick={onLogout}>
            <span>↩</span> Log out
          </button>
        </div>
      </aside>
    </>
  );
}

// ─── Topbar ───────────────────────────────────────────────────────────────────

function Topbar({ onToggleSidebar, sidebarOpen, currentNavLabel }) {
  return (
    <header style={styles.topbar}>
      <button
        style={styles.hamburger}
        onClick={onToggleSidebar}
        aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
      >
        <span style={styles.hamburgerLine} />
        <span style={styles.hamburgerLine} />
        <span style={styles.hamburgerLine} />
      </button>
      <h1 style={styles.topbarTitle}>{currentNavLabel}</h1>
    </header>
  );
}

// ─── Main Layout ──────────────────────────────────────────────────────────────

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [teamMenuOpen, setTeamMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { teams, currentTeam, switchTeam } = useTeam();

  const currentNavLabel = NAV_ITEMS.find(i => i.path === location.pathname)?.label || 'Rally';

  const handleToggleSidebar  = useCallback(() => setSidebarOpen(p => !p), []);
  const handleToggleTeamMenu = useCallback(() => setTeamMenuOpen(p => !p), []);

  const handleSwitchTeam = useCallback((teamId) => {
    switchTeam(teamId);
    setTeamMenuOpen(false);
  }, [switchTeam]);

  const handleCreateTeam = useCallback(() => {
    setTeamMenuOpen(false);
    navigate('/team-setup');
  }, [navigate]);

  // ✅ FIX: navigate is now in scope (MainLayout), passed down as a prop
  const handleLogoClick = useCallback(() => {
    navigate('/');
    setSidebarOpen(false); // collapse on mobile after navigating
  }, [navigate]);

  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('rally_current_team');
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  }, [navigate]);

  return (
    <div style={styles.layout}>
      <Sidebar
        open={sidebarOpen}
        teamMenuOpen={teamMenuOpen}
        onToggleTeamMenu={handleToggleTeamMenu}
        teams={teams}
        currentTeam={currentTeam}
        onSwitchTeam={handleSwitchTeam}
        onCreateTeam={handleCreateTeam}
        activeNavPath={location.pathname}
        onLogout={handleLogout}
        onLogoClick={handleLogoClick}  // ✅ passed in instead of inline navigate()
      />

      <div style={{ ...styles.mainContent, marginLeft: sidebarOpen ? 240 : 0 }}>
        <Topbar
          onToggleSidebar={handleToggleSidebar}
          sidebarOpen={sidebarOpen}
          currentNavLabel={currentNavLabel}
        />
        <main style={styles.pageContent}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

// ─── Styles (inline, no external CSS dependency) ──────────────────────────────

const BG        = '#0f0f0f';
const SURFACE   = '#161616';
const BORDER    = '#222';
const TEXT      = '#e8e8e8';
const MUTED     = '#555';
const SIDEBAR_W = 240;

const styles = {
  // Layout shell
  layout: {
    display: 'flex',
    minHeight: '100vh',
    background: BG,
    fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
    color: TEXT,
  },

  // Sidebar
  sidebar: {
    position: 'fixed',
    top: 0, left: 0, bottom: 0,
    width: SIDEBAR_W,
    background: SURFACE,
    borderRight: `1px solid ${BORDER}`,
    display: 'flex',
    flexDirection: 'column',
    padding: '0',
    zIndex: 100,
    transition: 'transform 0.22s cubic-bezier(.4,0,.2,1)',
    overflowY: 'auto',
  },
  sidebarOpen:   { transform: 'translateX(0)' },
  sidebarClosed: { transform: `translateX(-${SIDEBAR_W}px)` },

  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,.5)',
    zIndex: 99,
    display: 'none', // shown via media query or JS if needed
  },

  // Logo button
  logoBtn: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '20px 20px 16px',
    background: 'none', border: 'none',
    cursor: 'pointer',
    textDecoration: 'none',
    color: TEXT,
    width: '100%',
  },
  logoText: {
    fontSize: 15,
    fontWeight: 700,
    letterSpacing: '0.18em',
    color: PRIMARY,
  },

  // Team switcher
  teamSwitcher: {
    position: 'relative',
    margin: '0 12px 8px',
  },
  teamBtn: {
    display: 'flex', alignItems: 'center', gap: 8,
    width: '100%',
    padding: '8px 10px',
    background: 'rgba(255,255,255,.04)',
    border: `1px solid ${BORDER}`,
    borderRadius: 8,
    cursor: 'pointer',
    color: TEXT,
    fontSize: 13,
    textAlign: 'left',
  },
  teamDot: {
    width: 7, height: 7,
    borderRadius: '50%',
    background: PRIMARY,
    flexShrink: 0,
  },
  teamName: { flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  teamArrow: {
    fontSize: 18, lineHeight: 1,
    color: MUTED,
    transition: 'transform .15s',
    marginTop: -2,
  },
  teamMenu: {
    position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
    background: '#1c1c1c',
    border: `1px solid ${BORDER}`,
    borderRadius: 8,
    overflow: 'hidden',
    zIndex: 200,
    boxShadow: '0 8px 24px rgba(0,0,0,.5)',
  },
  teamMenuItem: {
    display: 'flex', alignItems: 'center', gap: 8,
    width: '100%', padding: '9px 14px',
    background: 'none', border: 'none',
    cursor: 'pointer',
    color: TEXT, fontSize: 13,
    textAlign: 'left',
  },
  teamMenuItemActive: { color: PRIMARY, background: 'rgba(200,255,61,.06)' },
  teamCheck: { color: PRIMARY, fontSize: 11 },
  teamMenuDivider: { height: 1, background: BORDER, margin: '4px 0' },
  teamMenuCreate: { color: MUTED },

  // Nav
  nav: {
    display: 'flex', flexDirection: 'column',
    padding: '8px 12px',
    gap: 2,
    flex: 1,
  },
  navLink: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '9px 12px',
    borderRadius: 8,
    textDecoration: 'none',
    fontSize: 14,
    color: MUTED,
    position: 'relative',
    transition: 'background .12s, color .12s',
  },
  navLinkActive: {
    color: TEXT,
    background: 'rgba(255,255,255,.06)',
  },
  navIcon: { fontSize: 13, color: MUTED, width: 16, textAlign: 'center' },
  navIconActive: { color: PRIMARY },
  navActivePip: {
    position: 'absolute', right: 10,
    width: 5, height: 5,
    borderRadius: '50%',
    background: PRIMARY,
  },

  // Sidebar footer
  sidebarFooter: {
    padding: '12px',
    borderTop: `1px solid ${BORDER}`,
  },
  logoutBtn: {
    display: 'flex', alignItems: 'center', gap: 8,
    width: '100%', padding: '8px 12px',
    background: 'none', border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    color: MUTED, fontSize: 13,
    textAlign: 'left',
    transition: 'color .12s',
  },

  // Main content
  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    transition: 'margin-left 0.22s cubic-bezier(.4,0,.2,1)',
  },

  // Topbar
  topbar: {
    display: 'flex', alignItems: 'center', gap: 16,
    padding: '0 24px',
    height: 56,
    borderBottom: `1px solid ${BORDER}`,
    background: SURFACE,
    position: 'sticky', top: 0,
    zIndex: 50,
  },
  hamburger: {
    display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4,
    width: 36, height: 36,
    padding: '0 6px',
    background: 'none', border: 'none',
    cursor: 'pointer',
    borderRadius: 6,
  },
  hamburgerLine: {
    display: 'block',
    height: 2,
    background: TEXT,
    borderRadius: 2,
    transition: 'background .12s',
  },
  topbarTitle: {
    margin: 0,
    fontSize: 15,
    fontWeight: 600,
    letterSpacing: '0.01em',
    color: TEXT,
  },

  // Page content
  pageContent: {
    flex: 1,
    padding: '32px 28px',
    overflowY: 'auto',
  },
};