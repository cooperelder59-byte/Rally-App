import { useState } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useTeam } from '../context/TeamContext';
import '../styles/mainlayout.css';

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [teamMenuOpen, setTeamMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { teams, currentTeam, switchTeam } = useTeam();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/messages', label: 'Messages' },
    { path: '/schedule', label: 'Schedule' },
    { path: '/performance', label: 'Performance' },
    { path: '/team', label: 'Team' }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="layout">

      {/* SIDEBAR */}
      <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <svg width="28" height="28" viewBox="0 0 40 32" fill="none">
              <polygon points="0,0 13,16 0,32 7,32 20,16 7,0" fill="#c8ff3d"/>
              <polygon points="10,0 23,16 10,32 17,32 30,16 17,0" fill="#c8ff3d"/>
              <polygon points="20,0 33,16 20,32 27,32 40,16 27,0" fill="#c8ff3d"/>
            </svg>
            <h2>RALLY</h2>
          </div>
        </div>

        {/* TEAM SWITCHER */}
        <div className="team-switcher">
          <button
            className="team-switcher-btn"
            onClick={() => setTeamMenuOpen(!teamMenuOpen)}
          >
            <span className="team-switcher-name">
              {currentTeam ? currentTeam.name : 'No team selected'}
            </span>
            <span className="team-switcher-arrow">{teamMenuOpen ? '▲' : '▼'}</span>
          </button>

          {teamMenuOpen && (
            <div className="team-switcher-menu">
              {teams.map((t) => (
                <button
                  key={t.id}
                  className={`team-switcher-item ${currentTeam?.id === t.id ? 'active' : ''}`}
                  onClick={() => {
                    switchTeam(t.id);
                    setTeamMenuOpen(false);
                  }}
                >
                  {t.name}
                </button>
              ))}
              <button
                className="team-switcher-item add"
                onClick={() => navigate('/team-setup')}
              >
                + Create or join a team
              </button>
            </div>
          )}
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-link ${isActive(item.path) ? 'active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <button className="sidebar-logout">Logout</button>
      </div>

      {/* MAIN CONTENT */}
      <div className="main-content">
        <div className="topbar">
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            ☰
          </button>
          <h1 className="topbar-title">
            {navItems.find((item) => isActive(item.path))?.label || 'Rally'}
          </h1>
        </div>

        <div className="page-content">
          <Outlet />
        </div>
      </div>

    </div>
  );
}