import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/landing.css';
import juniorSoccer from '../assets/junior-soccer.svg';

// Constants
const GREEN = '#c8ff3d';
const CONTACT_EMAIL = 'rallyoffical387@gmail.com';

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Contact', href: '#contact' },
  { label: 'About', href: '#about' }
];

const FEATURES = [
  {
    type: 'main',
    label: 'Communication',
    title: 'Keep everyone in the loop.',
    description: 'Post announcements, share updates, and reach every member of your team or club — no more buried messages or dead group chats.',
    items: [
      'Team-wide and group-specific posts',
      'Pinned announcements',
      'Push and email notifications'
    ]
  },
  {
    type: 'main',
    label: 'Scheduling',
    title: 'One calendar for everything.',
    description: 'Practices, games, meetings, and events — all in one shared calendar so your team always knows what\'s on and when.',
    items: [
      'Recurring and one-off events',
      'Location and event notes',
      'Export to personal calendar'
    ]
  },
  {
    type: 'card',
    label: 'Attendance',
    description: 'Know who\'s in, out, or unsure before every training and event. No more last-minute scrambling.'
  },
  {
    type: 'card',
    label: 'Member management',
    description: 'Rosters, roles, and permissions for coaches, admins, and players — all in one place.'
  }
];

const STEPS = [
  {
    num: '01',
    title: 'Create your group',
    description: 'Set up your team, club, or committee in seconds. Invite members by email or a shareable link.'
  },
  {
    num: '02',
    title: 'Set up your season',
    description: 'Add your schedule and get your roster sorted before the season kicks off.'
  },
  {
    num: '03',
    title: 'Run your group',
    description: 'Post updates, track attendance, and keep everyone organised all season long.'
  }
];

const AUDIENCE = [
  {
    role: 'Coaches & managers',
    description: 'Less time chasing people and sorting logistics. More time coaching. Rally handles the admin so you don\'t have to.'
  },
  {
    role: 'Students & players',
    description: 'One app for every group you\'re in. Never miss a practice, a payment, or an update again.'
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
      <text x="43" y="23" fontFamily="'Barlow Condensed', sans-serif" fontSize="16" fontWeight="800" fill={GREEN} letterSpacing="0.06em">RALLY</text>
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
function Navigation({ mobileOpen, onToggle, onNavigate }) {
  return (
    <header>
      <div className="header-inner">
        <a href="#" className="logo">
          <LogoSVG />
        </a>
        <nav>
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
          aria-label="Toggle mobile menu"
        >
          <span></span><span></span><span></span>
        </button>
      </div>
      {mobileOpen && (
        <div className="mobile-nav open">
          {NAV_LINKS.map(link => (
            <a key={link.href} href={link.href}>{link.label}</a>
          ))}
          <a onClick={() => onNavigate('/register')}>Get started</a>
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
            <span className="accent">team together.</span>
          </h1>
          <p>
            Rally is the platform built for school sports teams, clubs, and groups.
            One place for communication, scheduling, attendance, and coordination —
            so coaches and students can focus on what matters.
          </p>
          <div className="hero-actions">
            <button onClick={() => onNavigate('/register')} className="btn btn-primary">
              Get started
            </button>
            <a href="#features" className="btn btn-ghost">
              See what's coming
            </a>
          </div>
        </div>
        <div className="hero-gallery" style={{gap: '20px' }}>
          <div className="gallery-image-card">
            <img src={juniorSoccer} alt="Junior soccer team" className="hero-image-img" />
          </div>
        </div>
      </div>
      <div className="hero-rule"></div>
    </section>
  );
}

// Product Mockup Component
function ProductMockup() {
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
              {['Dashboard', 'Messages', 'Schedule', 'Performance', 'Team'].map((item, idx) => (
                <div key={item} className={`mockup-nav-item ${idx === 0 ? 'active' : ''}`}>
                  {item}
                </div>
              ))}
            </div>
            <div className="mockup-main">
              {['Upcoming Events', 'Messages', 'Team Activity', 'Performance'].map(card => (
                <div key={card} className="mockup-card">
                  <div className="mockup-card-label">{card}</div>
                  <div className="mockup-card-line"></div>
                  <div className="mockup-card-line short"></div>
                </div>
              ))}
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
        <h2>Built for school sports and clubs.</h2>
        <p>Rally fixes the disorganisation that school sports teams and clubs deal with every season — one place for communication, scheduling, and attendance.</p>
        <p>Create your team, invite your players, and get your season organised in minutes.</p>
      </div>
    </section>
  );
}

// Contact Section Component (replaces Pricing)
function ContactSection() {
  return (
    <section className="section section-dark" id="contact">
      <div className="container container-narrow" style={{ textAlign: 'center' }}>
        <div className="eyebrow">Contact</div>
        <h2>Get in touch.</h2>
        <p className="waitlist-sub">
          Questions about Rally, or want to bring it to your school or club? We'd love to hear from you.
        </p>
        <button
          onClick={() => { window.location.href = `mailto:${CONTACT_EMAIL}`; }}
          className="btn btn-primary btn-full"
          style={{ maxWidth: '320px', margin: '0 auto', display: 'block' }}
        >
          Contact us
        </button>
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
        <a href="#" className="footer-logo-link">
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
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    setMobileNavOpen(false);
    navigate(path);
  };

  const toggleMobileNav = () => {
    setMobileNavOpen(!mobileNavOpen);
  };

  return (
    <div>
      <Navigation 
        mobileOpen={mobileNavOpen}
        onToggle={toggleMobileNav}
        onNavigate={handleNavigation}
      />
      <HeroSection onNavigate={handleNavigation} />
      <ProductMockup />
      <FeaturesSection />
      <HowItWorks />
      <AudienceSection />
      <AboutSection />
      <CTASection onNavigate={handleNavigation} />
      <ContactSection />
      <Footer />
    </div>
  );
}