import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { statusClass } from '../lib/util.js';
import Icon from './Icon.jsx';

export function Badge({ status, children }) {
  return <span className={`badge badge-${statusClass(status)}`}>{children || status}</span>;
}

export function Loader({ text = 'Loading…' }) {
  return (
    <div className="loader" role="status">
      <span className="spinner" />
      <span>{text}</span>
    </div>
  );
}

export function ErrorBox({ error, onRetry }) {
  if (!error) return null;
  return (
    <div className="alert alert-error" role="alert">
      <span>{error.message || String(error)}</span>
      {onRetry && <button className="btn btn-sm btn-outline" onClick={onRetry}>Try again</button>}
    </div>
  );
}

export function Empty({ icon = 'shield', title, text, action }) {
  return (
    <div className="empty">
      <span className="empty-icon"><Icon name={icon} size={28} /></span>
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}

export function PageHeader({ title, subtitle, back, actions }) {
  return (
    <div className="page-head">
      <div className="container page-head-row">
        <div>
          {back && <Link to={back.to} className="back-link"><Icon name="back" size={16} /> {back.label}</Link>}
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {actions && <div className="page-head-actions">{actions}</div>}
      </div>
    </div>
  );
}

export function StatCard({ icon, label, value, tone = 'blue', to }) {
  const body = (
    <>
      <span className={`tile-icon tone-${tone}`}><Icon name={icon} size={20} /></span>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </>
  );
  return to ? <Link to={to} className="stat-card">{body}</Link> : <div className="stat-card">{body}</div>;
}

/** Sends visitors to /login (and back afterwards). role="admin" or "user" limits the page further. */
export function RequireAuth({ role, children }) {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) return <div className="container section"><Loader /></div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  if (role === 'admin' && user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  if (role === 'user' && user.role === 'admin') return <Navigate to="/admin" replace />;
  return children;
}
