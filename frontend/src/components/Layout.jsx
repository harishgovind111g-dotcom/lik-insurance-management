import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import Icon, { CATEGORY_META } from './Icon.jsx';
import ChatWidget from './ChatWidget.jsx';

const CATEGORY_LINKS = [
  ['health', 'Health Insurance'],
  ['life', 'Term Life Insurance'],
  ['motor', 'Car & Bike Insurance'],
  ['travel', 'Travel Insurance'],
  ['home', 'Home Insurance']
];

export function Logo({ light = false }) {
  return (
    <Link to="/" className={`logo ${light ? 'light' : ''}`} aria-label="LIK Insurance home">
      <svg width="34" height="34" viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="9" fill="currentColor" className="logo-bg" />
        <path d="M16 6l8 3v6c0 5-3.4 9.3-8 11-4.6-1.7-8-6-8-11V9l8-3z" fill="#fff" />
        <path d="M12.5 16l2.5 2.5 4.5-5" fill="none" stroke="#f26b1d" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="logo-text">LIK<em>insurance</em></span>
    </Link>
  );
}

function Header() {
  const { user, isAdmin, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const userRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => { setMenuOpen(false); setUserOpen(false); }, [location.pathname]);

  useEffect(() => {
    const close = (e) => { if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const doLogout = () => { logout(); navigate('/'); };

  return (
    <header className="site-header">
      <div className="container header-row">
        <Logo />

        <button className="icon-btn menu-toggle" aria-label="Open menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((v) => !v)}>
          <Icon name={menuOpen ? 'close' : 'menu'} />
        </button>

        <nav className={`main-nav ${menuOpen ? 'open' : ''}`} aria-label="Main">
          {isAdmin ? (
            <>
              <NavLink to="/admin" end>Dashboard</NavLink>
              <NavLink to="/admin/claims">Manage Claims</NavLink>
              <NavLink to="/admin/plans">Plans</NavLink>
              <NavLink to="/admin/users">Users & Policies</NavLink>
            </>
          ) : (
            <>
              <div className="nav-drop">
                <NavLink to="/insurance" className="nav-drop-trigger">Insurance Products <span className="caret" /></NavLink>
                <div className="nav-drop-panel">
                  {CATEGORY_LINKS.map(([slug, label]) => (
                    <Link key={slug} to={`/insurance/${slug}`} className="nav-drop-item">
                      <span className={`tile-icon tone-${CATEGORY_META[slug].tone}`}><Icon name={CATEGORY_META[slug].icon} size={18} /></span>
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
              {user && <NavLink to="/dashboard">Dashboard</NavLink>}
              {user && <NavLink to="/policies">My Policies</NavLink>}
              <NavLink to="/claims">Claims</NavLink>
              <NavLink to="/support">Support</NavLink>
            </>
          )}

          <div className="nav-auth-mobile">
            {user ? (
              <>
                <NavLink to="/profile">My Profile</NavLink>
                <button className="btn btn-outline btn-block" onClick={doLogout}>Log out</button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline btn-block">Sign in</Link>
                <Link to="/register" className="btn btn-primary btn-block">Register</Link>
              </>
            )}
          </div>
        </nav>

        <div className="header-actions">
          {user ? (
            <div className="user-menu" ref={userRef}>
              <button className="user-chip" onClick={() => setUserOpen((v) => !v)} aria-expanded={userOpen}>
                <span className="avatar">{user.name.charAt(0).toUpperCase()}</span>
                <span className="user-chip-name">{user.name.split(' ')[0]}</span>
                <span className="caret" />
              </button>
              {userOpen && (
                <div className="user-pop">
                  <div className="user-pop-head">
                    <strong>{user.name}</strong>
                    <span>{user.email}</span>
                    {isAdmin && <span className="badge badge-info">Admin</span>}
                  </div>
                  {!isAdmin && <Link to="/dashboard"><Icon name="grid" size={18} />Dashboard</Link>}
                  <Link to="/profile"><Icon name="user" size={18} />My Profile</Link>
                  <button onClick={doLogout}><Icon name="logout" size={18} />Log out</button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost">Sign in</Link>
              <Link to="/register" className="btn btn-primary">Register</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Logo light />
          <p>Simple, transparent insurance. Compare plans, buy a policy online, and file and track claims from one place.</p>
          <div className="footer-contact">
            <span><Icon name="phone" size={16} /> 1800-000-0000 (Mon–Sat, 9am–7pm)</span>
            <span><Icon name="mail" size={16} /> support@lik.in</span>
          </div>
        </div>
        <div>
          <h4>Insurance</h4>
          {CATEGORY_LINKS.map(([slug, label]) => <Link key={slug} to={`/insurance/${slug}`}>{label}</Link>)}
        </div>
        <div>
          <h4>Customers</h4>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/policies">My Policies</Link>
          <Link to="/claims">Claims</Link>
          <Link to="/claims/new">File a Claim</Link>
        </div>
        <div>
          <h4>Company</h4>
          <Link to="/support">Help & Support</Link>
          <Link to="/support#faq">FAQs</Link>
          <Link to="/login">Sign in</Link>
          <Link to="/register">Create account</Link>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} LIK Insurance. All plans and providers shown are for demonstration only.</span>
      </div>
    </footer>
  );
}

export default function Layout() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  return (
    <div className="app">
      <Header />
      <main className="site-main">
        <Outlet />
      </main>
      <Footer />
      <ChatWidget />
    </div>
  );
}
