import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function MainLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/messages', label: 'Messages' },
    { path: '/schedule', label: 'Schedule' },
    { path: '/performance', label: 'Performance' },
    { path: '/team', label: 'Team' }
  ];

  const isActive = (path) => location.pathname === path;
  const GREEN = '#c8ff3d';
  const DARK = '#1a1a1a';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f9f9f9' }}>
      {/* SIDEBAR */}
      <div
        style={{
          width: sidebarOpen ? '240px' : '0',
          backgroundColor: '#fff',
          borderRight: '1px solid #e0e0e0',
          padding: sidebarOpen ? '1.5rem 1rem' : '0',
          transition: 'all 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          overflow: 'hidden'
        }}
      >
        {/* Logo */}
    <div style={{ paddingBottom: '1rem', borderBottom: '1px solid #e0e0e0' }}>
        < div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
        <svg width="28" height="28" viewBox="0 0 40 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <polygon points="0,0 13,16 0,32 7,32 20,16 7,0" fill={GREEN}/>
        <polygon points="10,0 23,16 10,32 17,32 30,16 17,0" fill={GREEN}/>
        <polygon points="20,0 33,16 20,32 27,32 40,16 27,0" fill={GREEN}/>
        </svg>
    <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: GREEN, letterSpacing: '1px' }}>RALLY</h2>
  </div>
  <p style={{ margin: 0, fontSize: '11px', color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sports Platform</p>
</div>

        {/* Navigation */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                textDecoration: 'none',
                padding: '10px 12px',
                borderRadius: '6px',
                backgroundColor: isActive(item.path) ? `${GREEN}20` : 'transparent',
                color: isActive(item.path) ? DARK : '#333',
                fontWeight: isActive(item.path) ? 600 : 400,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                borderLeft: isActive(item.path) ? `3px solid ${GREEN}` : '3px solid transparent'
              }}
              onMouseEnter={(e) => {
                if (!isActive(item.path)) {
                  e.target.style.backgroundColor = '#f0f0f0';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive(item.path)) {
                  e.target.style.backgroundColor = 'transparent';
                }
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Logout Button */}
        <button
          style={{
            width: '100%',
            padding: '10px 12px',
            backgroundColor: GREEN,
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 600,
            color: DARK,
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => (e.target.style.opacity = '0.9')}
          onMouseLeave={(e) => (e.target.style.opacity = '1')}
        >
          Logout
        </button>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Top Bar */}
        <div
            style={{
            backgroundColor: '#fff',
            borderBottom: '1px solid #e0e0e0',
            padding: '1rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
        }}
        >
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer'
            }}
          >
            ☰
          </button>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
            {navItems.find((item) => isActive(item.path))?.label || 'Rally'}
          </h1>
        </div>

        {/* Page Content */}
        <div style={{ flex: 1, padding: '2rem', overflow: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  );
}