import { useState, useCallback, useEffect, useRef } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useTeam } from '../context/TeamContext';
import '../styles/main-layout.css';

// ─── Constants ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { path: '/dashboard',   label: 'Dashboard'   },
  { path: '/messages',    label: 'Messages'    },
  { path: '/schedule',    label: 'Schedule'    },
  { path: '/roster',      label: 'Roster'      },
  { path: '/performance', label: 'Performance' },
];

const PRIMARY = '#c8ff3d';
const MOBILE_BREAKPOINT = 768;

// ─── Logo ─────────────────────────────────────────────────────────────────────

function RallyLogo() {
  return (
    <svg width="22" height="22" viewBox="0 0 40 32" fill="none" aria-hidden="true">
      <polygon points="0,0 13,16 0,32 7,32 20,16 7,0"   fill={PRIMARY} />
      <polygon points="10,0 23,16 10,32 17,32 30,16 17,0" fill={PRIMARY} opacity=".75" />
      <polygon points="20,0 33,16 20,32 27,32 40,16 27,0" fill={PRIMARY} opacity=".5" />
    </svg>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function GearIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
        stroke="currentColor" strokeWidth="1.8"
      />
      <path
        d="M19.4 13.5c.04-.5.04-1 0-1.5l1.6-1.2a.9.9 0 0 0 .2-1.2l-1.6-2.7a.9.9 0 0 0-1.1-.4l-1.9.6a7.7 7.7 0 0 0-1.3-.75l-.3-2a.9.9 0 0 0-.9-.75h-3.2a.9.9 0 0 0-.9.75l-.3 2c-.47.2-.9.45-1.3.75l-1.9-.6a.9.9 0 0 0-1.1.4L3.8 9.6a.9.9 0 0 0 .2 1.2L5.6 12c-.04.5-.04 1 0 1.5l-1.6 1.2a.9.9 0 0 0-.2 1.2l1.6 2.7c.24.4.72.56 1.1.4l1.9-.6c.4.3.83.55 1.3.75l.3 2c.06.43.45.75.9.75h3.2c.45 0 .84-.32.9-.75l.3-2c.47-.2.9-.45 1.3-.75l1.9.6c.4.16.87 0 1.1-.4l1.6-2.7a.9.9 0 0 0-.2-1.2l-1.6-1.2Z"
        stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Team Switcher ────────────────────────────────────────────────────────────

function TeamSwitcher({ teamMenuOpen, onToggle, teams, currentTeam, onSwitch, onCreateTeam }) {
  const containerRef = useRef(null);

  // Close the menu on outside click / Escape.
  useEffect(() => {
    if (!teamMenuOpen) return;

    const handlePointerDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        onToggle();
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onToggle();
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [teamMenuOpen, onToggle]);

  return (
    <div className="team-switcher" ref={containerRef}>
      <button
        type="button"
        className="team-switcher-btn"
        onClick={onToggle}
        aria-label="Switch group"
        aria-haspopup="menu"
        aria-expanded={teamMenuOpen}
      >
        <span className="team-switcher-name">{currentTeam?.name || 'No team'}</span>
        <span className="team-switcher-arrow" style={{ transform: teamMenuOpen ? 'rotate(180deg)' : 'none' }}>
          ⌄
        </span>
      </button>

      {teamMenuOpen && (
        <div className="team-switcher-menu" role="menu">
          {teams.map(team => (
            <button
              key={team.id}
              type="button"
              role="menuitem"
              className={`team-switcher-item${currentTeam?.id === team.id ? ' active' : ''}`}
              onClick={() => onSwitch(team.id)}
            >
              {team.name}
            </button>
          ))}
          <button
            type="button"
            role="menuitem"
            className="team-switcher-item add"
            onClick={onCreateTeam}
          >
            + Create or join a group
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Sidebar Nav ──────────────────────────────────────────────────────────────

function SidebarNav({ activePath, onNavigate }) {
  return (
    <nav className="sidebar-nav" aria-label="Main navigation">
      {NAV_ITEMS.map(item => {
        const isActive = activePath === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={onNavigate}
            aria-current={isActive ? 'page' : undefined}
            className={`sidebar-link${isActive ? ' active' : ''}`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({
  open,
  isMobile,
  teamMenuOpen, onToggleTeamMenu,
  teams, currentTeam, onSwitchTeam, onCreateTeam,
  activeNavPath,
  onLogout,
  onLogoClick,
  onSettingsClick,
  onCloseSidebar,
  onNavLinkClick,
}) {
  // The dimming overlay only makes sense on mobile, where the sidebar is an
  // overlay panel floating above the page. On desktop the sidebar pushes
  // the layout instead, so the overlay must never render there.
  const overlayVisible = open && isMobile;

  return (
    <>
      <div
        className={`sidebar-overlay${overlayVisible ? ' visible' : ''}`}
        onClick={onCloseSidebar}
        aria-hidden="true"
      />

      <aside className={`sidebar ${open ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <button
            type="button"
            className="sidebar-logo"
            onClick={onLogoClick}
            aria-label="Go to dashboard"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <RallyLogo />
            <h2>RALLY</h2>
          </button>
          <p className="sidebar-tag">Bring your group together.</p>
        </div>

        <TeamSwitcher
          teamMenuOpen={teamMenuOpen}
          onToggle={onToggleTeamMenu}
          teams={teams}
          currentTeam={currentTeam}
          onSwitch={onSwitchTeam}
          onCreateTeam={onCreateTeam}
        />

        <SidebarNav activePath={activeNavPath} onNavigate={onNavLinkClick} />

        <div className="sidebar-footer">
          <button
            type="button"
            className={`sidebar-settings${activeNavPath === '/settings' ? ' active' : ''}`}
            aria-current={activeNavPath === '/settings' ? 'page' : undefined}
            onClick={onSettingsClick}
          >
            <GearIcon /> Settings
          </button>
          <button type="button" className="sidebar-logout" onClick={onLogout}>
            Log out
          </button>
        </div>
      </aside>
    </>
  );
}

// ─── Topbar ───────────────────────────────────────────────────────────────────

function Topbar({ onToggleSidebar, sidebarOpen, currentNavLabel }) {
  return (
    <header className="topbar">
      <button
        type="button"
        className="sidebar-toggle"
        onClick={onToggleSidebar}
        aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        aria-expanded={sidebarOpen}
      >
        ☰
      </button>
      <h1 className="topbar-title">{currentNavLabel}</h1>
    </header>
  );
}

// ─── Main Layout ──────────────────────────────────────────────────────────────

// NOTE: we deliberately do NOT use window.innerWidth here. If this layout is
// ever rendered inside an iframe, a preview pane, a split panel, or any other
// embedded/constrained container, window.innerWidth reflects that container's
// width — not what the layout itself is actually rendered at — and the
// mobile/desktop detection silently goes wrong (e.g. "isMobile" stays true
// on what looks like a full desktop screen, so the mobile-only dimming
// overlay never turns off). Measuring the layout element itself with a
// ResizeObserver is accurate no matter how the page is embedded.

export default function MainLayout() {
  const layoutRef = useRef(null);
  // We don't know the real width until the first measurement comes in, so
  // start as "not mobile" / sidebar open — matches desktop, the common case,
  // and gets corrected within a frame if we're actually narrow.
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [teamMenuOpen, setTeamMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { teams, currentTeam, switchTeam } = useTeam();

  // Measure the actual rendered width of the layout container (not the
  // window — see note above) and keep isMobile in sync. Sidebar snaps to
  // the sensible default whenever we cross the breakpoint, including on
  // the very first measurement.
  useEffect(() => {
    const node = layoutRef.current;
    if (!node) return;

    let isFirstMeasurement = true;

    const handleWidth = (width) => {
      const mobile = width < MOBILE_BREAKPOINT;
      setIsMobile((prevMobile) => {
        if (isFirstMeasurement || prevMobile !== mobile) {
          setSidebarOpen(!mobile);
        }
        return mobile;
      });
      isFirstMeasurement = false;
    };

    if (typeof ResizeObserver === 'undefined') {
      // Fallback for environments without ResizeObserver support.
      handleWidth(node.clientWidth);
      const handleResize = () => handleWidth(node.clientWidth);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }

    const observer = new ResizeObserver((entries) => {
      handleWidth(entries[0]?.contentRect?.width ?? node.clientWidth);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);


  // Lock page scroll while the mobile overlay sidebar is open, so the
  // page underneath doesn't scroll behind the dimmed panel.
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = previousOverflow;
      };
    }
  }, [isMobile, sidebarOpen]);

  // Let Escape close the mobile overlay sidebar, same as it closes the
  // team-switcher menu.
  useEffect(() => {
    if (!(isMobile && sidebarOpen)) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobile, sidebarOpen]);

  // Settings isn't in NAV_ITEMS (it lives in the sidebar footer, not the
  // main nav), so give it its own label here.
  const currentNavLabel =
    location.pathname === '/settings'
      ? 'Settings'
      : NAV_ITEMS.find(i => i.path === location.pathname)?.label || 'Rally';

  const handleToggleSidebar  = useCallback(() => setSidebarOpen(p => !p), []);
  const handleCloseSidebar   = useCallback(() => setSidebarOpen(false), []);
  const handleToggleTeamMenu = useCallback(() => setTeamMenuOpen(p => !p), []);

  // On mobile the sidebar is an overlay — collapse it after any navigation
  // so the destination page is visible without an extra tap.
  const closeSidebarIfMobile = useCallback(() => {
    if (isMobile) setSidebarOpen(false);
  }, [isMobile]);

  const handleSwitchTeam = useCallback((teamId) => {
    switchTeam(teamId);
    setTeamMenuOpen(false);
  }, [switchTeam]);

  const handleCreateTeam = useCallback(() => {
    setTeamMenuOpen(false);
    closeSidebarIfMobile();
    navigate('/team-setup');
  }, [navigate, closeSidebarIfMobile]);

  const handleLogoClick = useCallback(() => {
    navigate('/dashboard');
    closeSidebarIfMobile();
  }, [navigate, closeSidebarIfMobile]);

  const handleSettingsClick = useCallback(() => {
    navigate('/settings');
    closeSidebarIfMobile();
  }, [navigate, closeSidebarIfMobile]);

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
    <div className="layout" ref={layoutRef}>
      <Sidebar
        open={sidebarOpen}
        isMobile={isMobile}
        teamMenuOpen={teamMenuOpen}
        onToggleTeamMenu={handleToggleTeamMenu}
        teams={teams}
        currentTeam={currentTeam}
        onSwitchTeam={handleSwitchTeam}
        onCreateTeam={handleCreateTeam}
        activeNavPath={location.pathname}
        onLogout={handleLogout}
        onLogoClick={handleLogoClick}
        onSettingsClick={handleSettingsClick}
        onCloseSidebar={handleCloseSidebar}
        onNavLinkClick={closeSidebarIfMobile}
      />

      <div className="main-content">
        <Topbar
          onToggleSidebar={handleToggleSidebar}
          sidebarOpen={sidebarOpen}
          currentNavLabel={currentNavLabel}
        />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}