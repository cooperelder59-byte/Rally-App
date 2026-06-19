import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/landing.css';
import huddle from '../assets/huddle.png';

export default function Landing() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', role: '' });
  const [successMsg, setSuccessMsg] = useState(false);
  const navigate = useNavigate();

  const handleFormSubmit = (e) => {
    e.preventDefault();
    // Show success message
    setSuccessMsg(true);
    setFormData({ name: '', email: '', role: '' });
    setTimeout(() => setSuccessMsg(false), 3000);
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const GREEN = '#c8ff3d';

  return (
    <div>
      {/* HEADER */}
      <header>
        <div className="header-inner">
          <a href="#" className="logo">
            <svg width="80" height="32" viewBox="0 0 108 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <polygon points="0,0 13,16 0,32 7,32 20,16 7,0" fill={GREEN}/>
              <polygon points="10,0 23,16 10,32 17,32 30,16 17,0" fill={GREEN}/>
              <polygon points="20,0 33,16 20,32 27,32 40,16 27,0" fill={GREEN}/>
              <text x="43" y="23" fontFamily="'Barlow Condensed', sans-serif" fontSize="16" fontWeight="800" fill={GREEN} letterSpacing="0.06em">RALLY</text>
            </svg>
          </a>
          <nav>
            <a href="#features">Features</a>
            <a href="#how-it-works">How it works</a>
            <a href="#about">About</a>
            <button onClick={() => navigate('/login')} className="btn btn-primary">Get started</button>
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
            <a href="#about">About</a>
            <a onClick={() => navigate('/login')}>Get started</a>
          </div>
        )}
      </header>

      {/* HERO */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-text">
            <div className="eyebrow">School sports & clubs</div>
            <h1>Bring your<br/><span className="accent">team together.</span></h1>
            <p>Rally is the platform built for school sports teams, clubs, and groups. One place for communication, scheduling, attendance, and coordination — so coaches and students can focus on what matters.</p>
            <div className="hero-actions">
              <button onClick={() => navigate('/login')} className="btn btn-primary">Get started</button>
              <a href="#features" className="btn btn-ghost">See what's coming</a>
            </div>
          </div>
            <img src={huddle} alt="Football Huddle" width="500" />
        </div>
        <div className="hero-rule"></div>
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
          <h2>We're just getting started.</h2>
          <p>Rally is being built from the ground up to fix the disorganisation that school sports teams and clubs deal with every season. We're in early development — talking to coaches, students, and admins to make sure Rally solves real problems.</p>
          <p>The first milestone is this web launch: establishing the brand and laying the foundation for the full platform. From here, Rally grows into a complete web app, and eventually into mobile apps for iOS and Android.</p>
          <p>If you want to help shape what Rally becomes, join the waitlist or get in touch.</p>
        </div>
      </section>

      {/* WAITLIST */}
      <section className="section section-waitlist" id="waitlist">
        <div className="container container-narrow">
          <div className="eyebrow">Get involved</div>
          <h2>Be first when Rally launches.</h2>
          <p className="waitlist-sub">Join the waitlist for early access and updates as Rally develops.</p>
          {!successMsg ? (
            <form className="waitlist-form" onSubmit={handleFormSubmit}>
              <div className="form-row">
                <input 
                  type="text" 
                  id="name" 
                  placeholder="Your name" 
                  required 
                  value={formData.name}
                  onChange={handleInputChange}
                />
                <input 
                  type="email" 
                  id="email" 
                  placeholder="Your email" 
                  required 
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>
              <select 
                id="role" 
                required
                value={formData.role}
                onChange={handleInputChange}
              >
                <option value="" disabled>I am a…</option>
                <option value="student">Student or player</option>
                <option value="coach">Coach or team manager</option>
                <option value="admin">School administrator</option>
                <option value="parent">Parent</option>
                <option value="other">Other</option>
              </select>
              <button type="submit" className="btn btn-primary btn-full">Join the waitlist</button>
              <p className="form-note">No spam. Updates only when Rally is ready.</p>
            </form>
          ) : (
            <div className="success-msg visible">
              <div className="success-check">✓</div>
              <h3>You're on the list.</h3>
              <p>We'll be in touch when Rally is ready. Thanks for your interest.</p>
            </div>
          )}
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