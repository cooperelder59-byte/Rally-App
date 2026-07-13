import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/landing.css';
import juniorSoccer from '../assets/junior-soccer.svg';

// Constants
const GREEN = '#c8ff3d';

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'About', href: '#about' }
];

// Feature icons — simple monoline SVGs matching the accent color
function IconMessage() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.4 8.4 0 0 1-8.4 8.4H12a8.3 8.3 0 0 1-3.8-.9L3 21l1.9-5.2a8.3 8.3 0 0 1-.9-3.8A8.4 8.4 0 0 1 12.5 3.1H13a8.4 8.4 0 0 1 8 8.4z" />
    </svg>
  );
}
function IconCalendar() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4.5" width="18" height="16" rx="2" />
      <line x1="16" y1="2.5" x2="16" y2="6.5" />
      <line x1="8" y1="2.5" x2="8" y2="6.5" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
function IconActivity() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 20 9 4 6 12 2 12" />
    </svg>
  );
}
function IconUsers() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16.5 20.5v-1.8a3.6 3.6 0 0 0-3.6-3.6H6.6A3.6 3.6 0 0 0 3 18.7v1.8" />
      <circle cx="9.75" cy="7.5" r="3.5" />
      <path d="M21 20.5v-1.8a3.6 3.6 0 0 0-2.7-3.5" />
      <path d="M14.9 3.8a3.5 3.5 0 0 1 0 6.9" />
    </svg>
  );
}

const FEATURES = [
  {
    type: 'main',
    label: 'Communication',
    icon: IconMessage,
    title: 'Keep everyone in the loop.',
    description: 'Post announcements, share updates, and reach every member of your team — no more buried messages or dead group chats.',
    items: [
      'Team-wide and group-specific posts',
      'Pinned announcements',
      'Push and email notifications',
      'Switch between every team you\'re part of'
    ]
  },
  {
    type: 'main',
    label: 'Scheduling',
    icon: IconCalendar,
    title: 'One calendar for everything.',
    description: 'Practices, competitions, meetings, and events — all in one shared calendar so your group always knows what\'s on and when.',
    items: [
      'Recurring and one-off events',
      'Location and event notes',
      'Export to personal calendar'
    ]
  },
  {
    type: 'card',
    label: 'Performance',
    icon: IconActivity,
    description: 'Coaches and leaders track development, session notes, and progress over the season — all in one view.'
  },
  {
    type: 'card',
    label: 'Roster',
    icon: IconUsers,
    description: 'Roles, contact details, and full group rosters — always up to date and easy to manage.'
  }
];

const STEPS = [
  {
    num: '01',
    title: 'Create your group',
    description: 'Set up your club, team, or activity group in seconds. Invite members by email or a shareable link.'
  },
  {
    num: '02',
    title: 'Set up your season',
    description: 'Add your schedule and get your roster sorted before the season gets underway.'
  },
  {
    num: '03',
    title: 'Run your group',
    description: 'Post updates, track progress, and keep everyone organised all season long.'
  }
];

const AUDIENCE = [
  {
    role: 'Coaches & managers',
    description: 'Track progress, post updates, and run every group you lead from one place — no more chasing people down.'
  },
  {
    role: 'Students & members',
    description: 'One app for every group you\'re in. Never miss a training session, a message, or an update again.'
  },
  {
    role: 'Schools & admins',
    description: 'One platform across every extracurricular group. Consistent, trackable, and easy to manage at scale.'
  }
];

// Logo Component
function LogoSVG() {
  return (
    <svg width="80" height="32" viewBox="0 0 108 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="0,0 13,16 0,32 7,32 20,16 7,0" fill={GREEN}/>
      <polygon points="10,0 23,16 10,32 17,32 30,16 17,0" fill={GREEN}/>
      <polygon points="20,0 33,16 20,32 27,32 40,16 27,0" fill={GREEN}/>
      <text x="48" y="23" fontFamily="'Barlow Condensed', sans-serif" fontSize="30" fontWeight="800" fill={GREEN} letterSpacing="0.06em">Rally</text>
    </svg>
  );
}

// Footer Logo Component
function FooterLogoSVG() {
  return (
    <svg width="100" height="26" viewBox="0 0 120 26" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="0,0 10.5,13 0,26 5.5,26 16,13 5.5,0" fill={GREEN}/>
      <polygon points="8,0 18.5,13 8,26 13.5,26 24,13 13.5,0" fill={GREEN}/>
      <polygon points="16,0 26.5,13 16,26 21.5,26 32,13 21.5,0" fill={GREEN}/>
      <text x="40" y="19" fontFamily="'Barlow Condensed', sans-serif" fontSize="18" fontWeight="800" fill={GREEN} letterSpacing="0.06em">RALLY</text>
    </svg>
  );
}

// Navigation Component
function Navigation({ mobileOpen, onToggle, onNavigate, scrolled }) {
  const handleLinkClick = () => {
    if (mobileOpen) onToggle();
  };

  return (
    <header className={scrolled ? 'scrolled' : ''}>
      <div className="header-inner">
        <a href="#" className="logo" aria-label="Rally home">
          <LogoSVG />
        </a>
        <nav aria-label="Primary">
          {NAV_LINKS.map(link => (
            <a key={link.href} href={link.href}>{link.label}</a>
          ))}
          <button onClick={() => onNavigate('/register')} className="btn btn-primary">
            Get started
          </button>
        </nav>
        <button
          className="hamburger"
          onClick={onToggle}
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav"
        >
          <span></span><span></span><span></span>
        </button>
      </div>
      {mobileOpen && (
        <div id="mobile-nav" className="mobile-nav open">
          {NAV_LINKS.map(link => (
            <a key={link.href} href={link.href} onClick={handleLinkClick}>{link.label}</a>
          ))}
          <button type="button" className="mobile-nav-cta" onClick={() => onNavigate('/register')}>
            Get started
          </button>
        </div>
      )}
    </header>
  );
}

// Hero Section Component
function HeroSection({ onNavigate }) {
  return (
    <section className="hero">
      <div className="hero-inner">
        <div className="hero-text">
          <div className="eyebrow">School sports & clubs</div>
          <h1>
            Bring your<br />
            <span className="accent">group together.</span>
          </h1>
          <p>
            Rally is the communication platform built for school sports groups, clubs, and activities.
            Messaging, scheduling, rosters, and performance tracking — all in one place, across
            every group you’re part of.
          </p>
          <div className="hero-actions">
            <button onClick={() => onNavigate('/register')} className="btn btn-primary">
              Get started
            </button>
            <a href="#how-it-works" className="btn btn-ghost">
              See how it works
            </a>
          </div>
        </div>
        <div className="hero-gallery">
          <div className="gallery-image-card">
            <div className="hero-image-glow"></div>
            <img src={juniorSoccer} alt="Sports team group activity" className="hero-image-img" />
          </div>
        </div>
      </div>
      <div className="hero-rule"></div>
    </section>
  );
}

// Product Mockup Component — clickable tabs, each showing a lightweight
// recreation of the real screen (placeholder data, not real member info).
const MOCKUP_TABS = ['Dashboard', 'Messages', 'Schedule', 'Roster', 'Performance'];

function MockupDashboard() {
  const posts = [
    { initial: 'C', name: 'Coach Rivera', date: 'Jun 20', text: 'Great session today, well done everyone!' },
    { initial: 'C', name: 'Coach Rivera', date: 'Jun 20', text: 'Reminder — kit wash rota starts this week.' }
  ];
  return (
    <div className="mockup-screen">
      <div className="mockup-subtabs">
        {['Announcements', 'Members', 'Photos', 'Team Info'].map((t, i) => (
          <span key={t} className={`mockup-subtab ${i === 0 ? 'active' : ''}`}>{t}</span>
        ))}
      </div>
      <div className="mockup-invite-bar">
        <span className="mockup-invite-label">INVITE CODE</span>
        <span className="mockup-invite-code">RALLY-6XLRCD</span>
        <span className="mockup-copy-btn">Copy</span>
      </div>
      <div className="mockup-panel">
        <div className="mockup-panel-title">Announcements</div>
        {posts.map((p, i) => (
          <div key={i} className="mockup-post">
            <div className="mockup-avatar">{p.initial}</div>
            <div className="mockup-post-body">
              <div className="mockup-post-meta"><b>{p.name}</b> {p.date}</div>
              <div className="mockup-post-text">{p.text}</div>
            </div>
          </div>
        ))}
        <div className="mockup-post-input">
          <div className="mockup-avatar small">Y</div>
          <span className="mockup-input-placeholder">Post an announcement…</span>
          <span className="mockup-post-btn">Post</span>
        </div>
      </div>
    </div>
  );
}

function MockupMessages() {
  return (
    <div className="mockup-screen mockup-screen-split">
      <div className="mockup-thread-list">
        <div className="mockup-thread active">
          <div className="mockup-avatar small">T</div>
          <div>
            <div className="mockup-thread-name">Coach Rivera</div>
            <div className="mockup-thread-sub">Nice work today!</div>
          </div>
        </div>
        <div className="mockup-thread">
          <div className="mockup-avatar small">T</div>
          <div>
            <div className="mockup-thread-name">Team Announcements</div>
            <div className="mockup-thread-sub">3 new posts</div>
          </div>
        </div>
      </div>
      <div className="mockup-chat-panel">
        <div className="mockup-chat-header">Coach Rivera</div>
        <div className="mockup-chat-empty" />
        <div className="mockup-chat-input">
          <span className="mockup-input-placeholder">Type a message…</span>
          <span className="mockup-send-btn">➔</span>
        </div>
      </div>
    </div>
  );
}

function MockupSchedule() {
  return (
    <div className="mockup-screen">
      <div className="mockup-screen-header">
        <div>
          <div className="mockup-eyebrow-sm">NORTHSIDE GROUP</div>
          <div className="mockup-screen-title">Schedule</div>
        </div>
        <span className="mockup-cta-btn">+ New Event</span>
      </div>
      <div className="mockup-subtabs">
        {['Upcoming', 'Past', 'All'].map((t, i) => (
          <span key={t} className={`mockup-subtab ${i === 0 ? 'active' : ''}`}>{t}</span>
        ))}
      </div>
      <div className="mockup-empty-state">
        <div className="mockup-empty-icon">🗓</div>
        <div className="mockup-empty-title">No upcoming events</div>
        <span className="mockup-ghost-btn">+ Create one</span>
      </div>
    </div>
  );
}

function MockupRoster() {
  const members = [
    { initial: 'J', name: 'J. Alvarez', badge: 'Member', role: 'Core role' },
    { initial: 'R', name: 'Coach Rivera', badge: 'Coach', role: 'Head Coach', accent: true }
  ];
  return (
    <div className="mockup-screen">
      <div className="mockup-screen-header">
        <div>
          <div className="mockup-eyebrow-sm">NORTHSIDE GROUP</div>
          <div className="mockup-screen-title">Roster</div>
        </div>
        <span className="mockup-member-count">2 members</span>
      </div>
      <div className="mockup-search">Search by name or role…</div>
      <div className="mockup-section-label">Members &amp; coaches</div>
      {members.map((m, i) => (
        <div key={i} className="mockup-member-row">
          <div className="mockup-avatar">{m.initial}</div>
          <div className="mockup-member-info">
            <div className="mockup-member-name">
              {m.name}
              <span className={`mockup-badge ${m.accent ? 'coach' : ''}`}>{m.badge}</span>
            </div>
            <div className="mockup-member-role">{m.role}</div>
          </div>
          <span className="mockup-edit-btn">Edit</span>
        </div>
      ))}
    </div>
  );
}

function MockupPerformance() {
  const stats = [
    { label: 'Consistency', value: '84%' },
    { label: 'Sessions', value: '2.3' },
    { label: 'Focus', value: '14' },
    { label: 'Support', value: '9' }
  ];
  return (
    <div className="mockup-screen">
      <div className="mockup-screen-title">Performance</div>
      <div className="mockup-eyebrow-sm" style={{ marginBottom: '0.9rem' }}>NORTHSIDE GROUP · SEASON 2025–26</div>
      <div className="mockup-panel">
        <div className="mockup-panel-title">Member statistics</div>
        <div className="mockup-perf-row mockup-perf-head">
          <span>Member</span><span>Sessions</span><span>Highlights</span><span>Rating</span>
        </div>
        <div className="mockup-perf-row">
          <span className="mockup-perf-name"><span className="mockup-avatar small">J</span> J. Alvarez</span>
          <span>12</span><span className="accent-text">4</span><span>7.8</span>
        </div>
      </div>
      <div className="mockup-stats-card">
        {stats.map(s => (
          <div key={s.label} className="mockup-stat-row">
            <span>{s.label}</span>
            <span className="accent-text">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const MOCKUP_SCREENS = {
  Dashboard: MockupDashboard,
  Messages: MockupMessages,
  Schedule: MockupSchedule,
  Roster: MockupRoster,
  Performance: MockupPerformance
};

function ProductMockup() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const ActiveScreen = MOCKUP_SCREENS[activeTab];

  return (
    <section className="section" id="preview">
      <div className="container">
        <div className="section-header">
          <div className="eyebrow">See it in action</div>
          <h2>Your team's home base.</h2>
        </div>

        <div className="mockup-frame">
          <div className="mockup-topbar">
            <div className="mockup-dot red"></div>
            <div className="mockup-dot yellow"></div>
            <div className="mockup-dot green"></div>
          </div>
          <div className="mockup-body">
            <div className="mockup-sidebar">
              <div className="mockup-logo">RALLY</div>
              <div className="mockup-team-switcher">
                <span className="mockup-team-dot"></span>
                <span className="mockup-team-name">Northside Group</span>
                <span className="mockup-chevron">⌄</span>
              </div>
              {MOCKUP_TABS.map(item => (
                <button
                  key={item}
                  type="button"
                  className={`mockup-nav-item ${activeTab === item ? 'active' : ''}`}
                  onClick={() => setActiveTab(item)}
                  aria-pressed={activeTab === item}
                >
                  <span>{item}</span>
                  {activeTab === item && <span className="mockup-nav-dot"></span>}
                </button>
              ))}
            </div>
            <div className="mockup-main mockup-main-single">
              <ActiveScreen />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Features Section Component
function FeaturesSection() {
  return (
    <section className="section" id="features">
      <div className="container">
        <div className="section-header">
          <div className="eyebrow">What Rally does</div>
          <h2>Everything your team needs.<br/>Nothing it doesn't.</h2>
        </div>
        <div className="features-grid">
          {FEATURES.map((feature, idx) => (
            feature.type === 'main' ? (
              <div key={idx} className="feature-main">
                <div className="feature-icon"><feature.icon /></div>
                <div className="feature-label">{feature.label}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
                <ul className="feature-list">
                  {feature.items.map(item => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <div key={idx} className="feature-card">
                <div className="feature-icon"><feature.icon /></div>
                <div className="feature-label">{feature.label}</div>
                <p>{feature.description}</p>
              </div>
            )
          ))}
        </div>
      </div>
    </section>
  );
}

// How It Works Component
function HowItWorks() {
  return (
    <section className="section section-dark" id="how-it-works">
      <div className="container">
        <div className="section-header">
          <div className="eyebrow">How it works</div>
          <h2>Set up in minutes.<br/>Run all season.</h2>
        </div>
        <div className="steps">
          {STEPS.map(step => (
            <div key={step.num} className="step">
              <div className="step-num">{step.num}</div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Audience Section Component
function AudienceSection() {
  return (
    <section className="section" id="audience">
      <div className="container">
        <div className="section-header">
          <div className="eyebrow">Who it's for</div>
          <h2>Built for every person<br/>in your school's groups.</h2>
        </div>
        <div className="audience-grid">
          {AUDIENCE.map(item => (
            <div key={item.role} className="audience-card">
              <div className="audience-role">{item.role}</div>
              <p>{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// About Section Component
function AboutSection() {
  return (
    <section className="section section-dark" id="about">
      <div className="container container-narrow">
        <div className="eyebrow">About Rally</div>
        <h2>Built for school sports, clubs, and activity groups.</h2>
        <p>Rally fixes the disorganisation that school groups deal with every season — one place for communication, scheduling, rosters, and performance tracking.</p>
        <p>Create your group, invite your members, and get your season organised in minutes.</p>
      </div>
    </section>
  );
}

// CTA Section Component
function CTASection({ onNavigate }) {
  return (
    <section className="section section-waitlist" id="get-started">
      <div className="container container-narrow">
        <div className="eyebrow">Get started</div>
        <h2>Ready to bring your team together?</h2>
        <p className="waitlist-sub">Create your team and start organising your season today.</p>
        <button onClick={() => onNavigate('/register')} className="btn btn-primary btn-full">
          Get started — it's free
        </button>
      </div>
    </section>
  );
}

// Footer Component
function Footer() {
  return (
    <footer>
      <div className="footer-inner">
        <a href="#" className="footer-logo-link" aria-label="Rally home">
          <FooterLogoSVG />
        </a>
        <p className="footer-tag">Bring your team together.</p>
        <p className="footer-copy">&copy; 2026 Rally. All rights reserved.</p>
      </div>
    </footer>
  );
}

// Main Landing Component
export default function Landing() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    setMobileNavOpen(false);
    navigate(path);
  };

  const toggleMobileNav = () => {
    setMobileNavOpen(!mobileNavOpen);
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div>
      <a href="#main" className="skip-link">Skip to content</a>
      <Navigation
        mobileOpen={mobileNavOpen}
        onToggle={toggleMobileNav}
        onNavigate={handleNavigation}
        scrolled={scrolled}
      />
      <main id="main">
        <HeroSection onNavigate={handleNavigation} />
        <ProductMockup />
        <FeaturesSection />
        <HowItWorks />
        <AudienceSection />
        <AboutSection />
        <CTASection onNavigate={handleNavigation} />
      </main>
      <Footer />
    </div>
  );
}