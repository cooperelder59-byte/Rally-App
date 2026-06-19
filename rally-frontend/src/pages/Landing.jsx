import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/landing.css';
import huddle from "../assets/huddle.png";
import hockey from "../assets/hockey.png";

const galleryImages = [
    huddle,
    hockey,
]

export default function Landing() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const navigate = useNavigate();
  const GREEN = '#c8ff3d';

  return (
    <div>
      {/* HEADER */}
      <header>
        <div className="header-inner">
          <a href="#" className="logo">
            <svg width="80" height="32" viewBox="0 0 120 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <polygon points="0,0 13,16 0,32 7,32 20,16 7,0" fill={GREEN}/>
              <polygon points="10,0 23,16 10,32 17,32 30,16 17,0" fill={GREEN}/>
              <polygon points="20,0 33,16 20,32 27,32 40,16 27,0" fill={GREEN}/>
              <text x="43" y="23" fontFamily="'Barlow Condensed', sans-serif" fontSize="20" fontWeight="800" fill={GREEN} letterSpacing="0.06em">RALLY</text>
            </svg>
          </a>
          <nav>
            <a href="#features">Features</a>
            <a href="#how-it-works">How it works</a>
            <a href="#pricing">Pricing</a>
            <a href="#about">About</a>
            <button onClick={() => navigate('/register')} className="btn btn-primary">Get started</button>
          </nav>
          <button 
            className="hamburger" 
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
          >
            <span></span><span></span><span></span>
          </button>
        </div>
        {mobileNavOpen && (
          <div className="mobile-nav open">
            <a href="#features">Features</a>
            <a href="#how-it-works">How it works</a>
            <a href="#pricing">Pricing</a>
            <a href="#about">About</a>
            <a onClick={() => navigate('/register')}>Get started</a>
          </div>
        )}
      </header>

      {/* HERO */}
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
              <button onClick={() => navigate('/register')} className="btn btn-primary">
                Get started
              </button>
              <a href="#features" className="btn btn-ghost">
                See what's coming
              </a>
            </div>
          </div>

          <div className="hero-gallery" style={{gap: '20px' }}>
            {galleryImages.map((image, index) => (
              <div key={index} className="gallery-image-card">
                <img
                  src={image}
                  alt={`Gallery ${index + 1}`}
                  className={`hero-image-img ${index === 1 ? "rugby-big" : ""}`}
                />
              </div>
            ))}
          </div>

        </div>
        <div className="hero-rule"></div>
      </section>

      {/* PRODUCT MOCKUP */}
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
                <div className="mockup-nav-item active">Dashboard</div>
                <div className="mockup-nav-item">Messages</div>
                <div className="mockup-nav-item">Schedule</div>
                <div className="mockup-nav-item">Performance</div>
                <div className="mockup-nav-item">Team</div>
              </div>
              <div className="mockup-main">
                <div className="mockup-card">
                  <div className="mockup-card-label">Upcoming Events</div>
                  <div className="mockup-card-line"></div>
                  <div className="mockup-card-line short"></div>
                </div>
                <div className="mockup-card">
                  <div className="mockup-card-label">Messages</div>
                  <div className="mockup-card-line"></div>
                  <div className="mockup-card-line short"></div>
                </div>
                <div className="mockup-card">
                  <div className="mockup-card-label">Team Activity</div>
                  <div className="mockup-card-line"></div>
                  <div className="mockup-card-line short"></div>
                </div>
                <div className="mockup-card">
                  <div className="mockup-card-label">Performance</div>
                  <div className="mockup-card-line"></div>
                  <div className="mockup-card-line short"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="section" id="features">
        <div className="container">
          <div className="section-header">
            <div className="eyebrow">What Rally does</div>
            <h2>Everything your team needs.<br/>Nothing it doesn't.</h2>
          </div>
          <div className="features-grid">
            <div className="feature-main">
              <div className="feature-label">Communication</div>
              <h3>Keep everyone in the loop.</h3>
              <p>Post announcements, share updates, and reach every member of your team or club — no more buried messages or dead group chats.</p>
              <ul className="feature-list">
                <li>Team-wide and group-specific posts</li>
                <li>Pinned announcements</li>
                <li>Push and email notifications</li>
              </ul>
            </div>
            <div className="feature-main">
              <div className="feature-label">Scheduling</div>
              <h3>One calendar for everything.</h3>
              <p>Practices, games, meetings, and events — all in one shared calendar so your team always knows what's on and when.</p>
              <ul className="feature-list">
                <li>Recurring and one-off events</li>
                <li>Location and event notes</li>
                <li>Export to personal calendar</li>
              </ul>
            </div>
            <div className="feature-card">
              <div className="feature-label">Attendance</div>
              <p>Know who's in, out, or unsure before every training and event. No more last-minute scrambling.</p>
            </div>
            <div className="feature-card">
              <div className="feature-label">Payments</div>
              <p>Collect fees for uniforms, trips, and tournaments. Tracked, simple, no cash required.</p>
            </div>
            <div className="feature-card">
              <div className="feature-label">Lineups & tools</div>
              <p>Build lineups, assign positions, and manage your squad directly in the platform.</p>
            </div>
            <div className="feature-card">
              <div className="feature-label">Member management</div>
              <p>Rosters, roles, and permissions for coaches, admins, and players — all in one place.</p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section section-dark" id="how-it-works">
        <div className="container">
          <div className="section-header">
            <div className="eyebrow">How it works</div>
            <h2>Set up in minutes.<br/>Run all season.</h2>
          </div>
          <div className="steps">
            <div className="step">
              <div className="step-num">01</div>
              <h3>Create your group</h3>
              <p>Set up your team, club, or committee in seconds. Invite members by email or a shareable link.</p>
            </div>
            <div className="step">
              <div className="step-num">02</div>
              <h3>Set up your season</h3>
              <p>Add your schedule, configure payment items, and get your roster sorted before the season kicks off.</p>
            </div>
            <div className="step">
              <div className="step-num">03</div>
              <h3>Run your group</h3>
              <p>Post updates, track attendance, collect payments, and keep everyone organised all season long.</p>
            </div>
          </div>
        </div>
      </section>

      {/* WHO IT'S FOR */}
      <section className="section" id="audience">
        <div className="container">
          <div className="section-header">
            <div className="eyebrow">Who it's for</div>
            <h2>Built for every person<br/>in your school's groups.</h2>
          </div>
          <div className="audience-grid">
            <div className="audience-card">
              <div className="audience-role">Coaches & managers</div>
              <p>Less time chasing people and sorting logistics. More time coaching. Rally handles the admin so you don't have to.</p>
            </div>
            <div className="audience-card">
              <div className="audience-role">Students & players</div>
              <p>One app for every group you're in. Never miss a practice, a payment, or an update again.</p>
            </div>
            <div className="audience-card">
              <div className="audience-role">Schools & admins</div>
              <p>One platform across every extracurricular group. Consistent, trackable, and easy to manage at scale.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="section section-dark" id="about">
        <div className="container container-narrow">
          <div className="eyebrow">About Rally</div>
          <h2>Built for school sports and clubs.</h2>
          <p>Rally fixes the disorganisation that school sports teams and clubs deal with every season — one place for communication, scheduling, attendance, and payments.</p>
          <p>Create your team, invite your players, and get your season organised in minutes.</p>
        </div>
      </section>

      {/* PRICING */}
      <section className="section section-dark" id="pricing">
        <div className="container">
          <div className="section-header">
            <div className="eyebrow">Pricing</div>
            <h2>Simple pricing.<br/>No surprises.</h2>
          </div>
          <div className="pricing-grid">
            <div className="pricing-card">
              <div className="pricing-tier">Free</div>
              <div className="pricing-price">$0<span>/mo</span></div>
              <p className="pricing-desc">For small teams just getting started.</p>
              <ul className="pricing-list">
                <li>Up to 20 members</li>
                <li>Team messaging</li>
                <li>Shared calendar</li>
                <li>Basic attendance tracking</li>
              </ul>
              <button onClick={() => navigate('/register')} className="btn btn-ghost btn-full">Get started</button>
            </div>

            <div className="pricing-card featured">
              <div className="pricing-badge">Most popular</div>
              <div className="pricing-tier">Team</div>
              <div className="pricing-price">$12<span>/mo</span></div>
              <p className="pricing-desc">For active teams running a full season.</p>
              <ul className="pricing-list">
                <li>Unlimited members</li>
                <li>Payments & fee collection</li>
                <li>Lineups & performance tracking</li>
                <li>Priority support</li>
              </ul>
              <button onClick={() => navigate('/register')} className="btn btn-primary btn-full">Get started</button>
            </div>

            <div className="pricing-card">
              <div className="pricing-tier">School / Club</div>
              <div className="pricing-price">Custom</div>
              <p className="pricing-desc">For schools / clubs managing multiple teams.</p>
              <ul className="pricing-list">
                <li>Multiple teams & clubs</li>
                <li>Admin dashboard</li>
                <li>Custom roles & permissions</li>
                <li>Dedicated onboarding</li>
              </ul>
              <button onClick={() => navigate('#')} className="btn btn-ghost btn-full">Contact us</button>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="section section-waitlist" id="get-started">
        <div className="container container-narrow">
          <div className="eyebrow">Get started</div>
          <h2>Ready to bring your team together?</h2>
          <p className="waitlist-sub">Create your team and start organising your season today.</p>
          <button onClick={() => navigate('/register')} className="btn btn-primary btn-full">
            Get started — it's free
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-inner">
          <a href="#" className="footer-logo-link">
            <svg width="100" height="26" viewBox="0 0 120 26" fill="none" xmlns="http://www.w3.org/2000/svg">
              <polygon points="0,0 10.5,13 0,26 5.5,26 16,13 5.5,0" fill={GREEN}/>
              <polygon points="8,0 18.5,13 8,26 13.5,26 24,13 13.5,0" fill={GREEN}/>
              <polygon points="16,0 26.5,13 16,26 21.5,26 32,13 21.5,0" fill={GREEN}/>
              <text x="40" y="19" fontFamily="'Barlow Condensed', sans-serif" fontSize="18" fontWeight="800" fill={GREEN} letterSpacing="0.06em">RALLY</text>
            </svg>
          </a>
          <p className="footer-tag">Bring your team together.</p>
          <p className="footer-copy">&copy; 2026 Rally. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}