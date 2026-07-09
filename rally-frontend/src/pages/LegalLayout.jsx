import { useNavigate } from 'react-router-dom';
import '../styles/landing.css';
import '../styles/legal.css';

const GREEN = '#c8ff3d';

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

// Minimal header/footer reused across legal pages so they sit inside the
// same shell as the marketing site without depending on Landing.jsx internals.
function LegalHeader({ onNavigate }) {
  return (
    <header>
      <div className="header-inner">
        <a href="/" className="logo" onClick={(e) => { e.preventDefault(); onNavigate('/'); }}>
          <LogoSVG />
        </a>
        <nav>
          <a href="/#features">Features</a>
          <a href="/#how-it-works">How it works</a>
          <a href="/#about">About</a>
          <button onClick={() => onNavigate('/register')} className="btn btn-primary">
            Get started
          </button>
        </nav>
      </div>
    </header>
  );
}

function LegalFooter() {
  return (
    <footer>
      <div className="footer-inner">
        <a href="/" className="footer-logo-link">
          <FooterLogoSVG />
        </a>
        <p className="footer-tag">Bring your team together.</p>
        <p className="footer-copy">&copy; 2026 Rally. All rights reserved.</p>
      </div>
    </footer>
  );
}

// Shared shell for legal pages. Pass `title`, `updated` (last-updated date
// string) and children (the actual clauses, using the .legal-* classes
// defined in styles/legal.css).
export default function LegalLayout({ title, updated, children }) {
  const navigate = useNavigate();

  return (
    <div>
      <LegalHeader onNavigate={navigate} />

      <section className="legal-hero">
        <div className="container container-narrow">
          <div className="eyebrow">Rally &middot; New Zealand</div>
          <h1 className="legal-title">{title}</h1>
          {updated && <p className="legal-updated">Last updated {updated}</p>}
        </div>
      </section>

      <section className="section">
        <div className="container container-narrow legal-content">
          {children}
        </div>
      </section>

      <LegalFooter />
    </div>
  );
}