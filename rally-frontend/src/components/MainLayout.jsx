import { useState, useCallback } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useTeam } from '../context/TeamContext';
import '../styles/mainlayout.css';

// Constants
const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/messages', label: 'Messages' },
  { path: '/schedule', label: 'Schedule' },
  { path: '/performance', label: 'Performance' },
];

const PRIMARY_COLOR = '#c8ff3d';

// Logo Component
function RallyLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 40 32" fill="none">
      <polygon points="0,0 13,16 0,32 7,32 20,16 7,0" fill={PRIMARY_COLOR}/>
      <polygon points="10,0 23,16 10,32 17,32 30,16 17,0" fill={PRIMARY_COLOR}/>
      <polygon points="20,0 33,16 20,32 27,32 40,16 27,0" fill={PRIMARY_COLOR}/>
    </svg>
  );
}

// Team Switcher Component
function TeamSwitcher({ teamMenuOpen, onToggle, teams, currentTeam, onSwitch, onCreateTeam }) {
  return (
    <div className="team-switcher">
      <button
        className="team-switcher-btn"
        onClick={onToggle}
        aria-label="Toggle team menu"
      >
        <span className="team-switcher-name">
          {currentTeam?.name || 'No team selected'}
        </span>
        <span className="team-switcher-arrow">{teamMenuOpen ? '▲' : '▼'}</span>
      </button>

      {teamMenuOpen && (
        <div className="team-switcher-menu">
          {teams.map(team => (
            <button
              key={team.id}
              className={`team-switcher-item ${currentTeam?.id === team.id ? 'active' : ''}`}
              onClick={() => onSwitch(team.id)}
            >
              {team.name}
            </button>
          ))}
          <button
            className="team-switcher-item add"
            onClick={onCreateTeam}
          >
            + Create or join a team
          </button>
        </div>
      )}
    </div>
  );
}

// Navigation Component
function SidebarNav({ activePath }) {
  return (
    <nav className="sidebar-nav">
      {NAV_ITEMS.map(item => (
        <Link
          key={item.path}
          to={item.path}
          className={`sidebar-link ${activePath === item.path ? 'active' : ''}`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

// Sidebar Component
function Sidebar({
  open,
  teamMenuOpen,
  onToggleTeamMenu,
  teams,
  currentTeam,
  onSwitchTeam,
  onCreateTeam,
  activeNavPath,
  onLogout
}) {
    return (
    <div className={`sidebar ${open ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <div 
          className="sidebar-logo"
          onClick={() => navigate('/')}
          style={{ cursor: 'pointer' }}
        >
          <RallyLogo />
          <h2>RALLY</h2>
        </div>
      </div>

      <TeamSwitcher
        teamMenuOpen={teamMenuOpen}
        onToggle={onToggleTeamMenu}
        teams={teams}
        currentTeam={currentTeam}
        onSwitch={onSwitchTeam}
        onCreateTeam={onCreateTeam}
      />

      <SidebarNav activePath={activeNavPath} />

      <button className="sidebar-logout" onClick={onLogout}>
        Logout
      </button>
    </div>
  );
}

// Topbar Component
function Topbar({ onToggleSidebar, currentNavLabel }) {
  return (
    <div className="topbar">
      <button 
        className="sidebar-toggle" 
        onClick={onToggleSidebar}
        aria-label="Toggle sidebar"
      >
        ☰
      </button>
      <h1 className="topbar-title">{currentNavLabel}</h1>
    </div>
  );
}

// Main Layout Component
export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [teamMenuOpen, setTeamMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { teams, currentTeam, switchTeam } = useTeam();

  // Get the current nav item label
  const currentNavItem = NAV_ITEMS.find(item => item.path === location.pathname);
  const currentNavLabel = currentNavItem?.label || 'Rally';

  // Handlers
  const handleToggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  const handleToggleTeamMenu = useCallback(() => {
    setTeamMenuOpen(prev => !prev);
  }, []);

  const handleSwitchTeam = useCallback((teamId) => {
    switchTeam(teamId);
    setTeamMenuOpen(false);
  }, [switchTeam]);

  const handleCreateTeam = useCallback(() => {
    setTeamMenuOpen(false);
    navigate('/team-setup');
  }, [navigate]);

  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('rally_current_team');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Optionally show error toast here
    }
  }, [navigate]);

  return (
    <div className="layout">
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
      />

      <div className="main-content">
        <Topbar
          onToggleSidebar={handleToggleSidebar}
          currentNavLabel={currentNavLabel}
        />

        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}