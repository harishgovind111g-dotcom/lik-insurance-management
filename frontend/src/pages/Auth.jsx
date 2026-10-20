import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import Icon from '../components/Icon.jsx';
import { Logo } from '../components/Layout.jsx';

function AuthShell({ title, subtitle, children }) {
  return (
    <div className="auth-wrap">
      <div className="auth-side">
        <Logo light />
        <h2>Insurance, made simple.</h2>
        <ul>
          <li><Icon name="check" size={18} strokeWidth={2.2} /> Compare plans across 5 categories</li>
          <li><Icon name="check" size={18} strokeWidth={2.2} /> Buy a policy in under a minute</li>
          <li><Icon name="check" size={18} strokeWidth={2.2} /> File and track claims online</li>
          <li><Icon name="check" size={18} strokeWidth={2.2} /> Get answers from our AI assistant</li>
        </ul>
      </div>
      <div className="auth-main">
        <div className="auth-card">
          <h1>{title}</h1>
          <p className="muted">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}

function Field({ label, error, ...props }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input {...props} aria-invalid={!!error} />
      {error && <small className="field-error">{error}</small>}
    </label>
  );
}

const homeFor = (u) => (u.role === 'admin' ? '/admin' : '/dashboard');

export function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={homeFor(user)} replace />;

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) { setError('Enter your email and password.'); return; }
    setBusy(true);
    try {
      const u = await login(form.email, form.password);
      const from = location.state?.from;
      navigate(from && u.role !== 'admin' ? from : homeFor(u), { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to manage your policies and claims.">
      {location.state?.message && <div className="alert alert-info">{location.state.message}</div>}
      <form onSubmit={submit} noValidate className="form">
        <Field label="Email address" type="email" autoComplete="email" value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
        <Field label="Password" type="password" autoComplete="current-password" value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Your password" />
        {error && <div className="alert alert-error">{error}</div>}
        <button className="btn btn-primary btn-lg btn-block" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
      <p className="auth-switch">New to LIK? <Link to="/register" state={location.state}>Create an account</Link></p>
    </AuthShell>
  );
}

export function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={homeFor(user)} replace />;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  function validate() {
    const e = {};
    if (form.name.trim().length < 2) e.name = 'Enter your full name.';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = 'Enter a valid email address.';
    if (!/^[6-9]\d{9}$/.test(form.phone.trim())) e.phone = 'Enter a 10-digit mobile number starting with 6–9.';
    if (form.password.length < 8 || !/[a-z]/i.test(form.password) || !/\d/.test(form.password)) e.password = 'Use at least 8 characters with a letter and a number.';
    if (form.confirm !== form.password) e.confirm = 'Passwords do not match.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!validate()) return;
    setBusy(true);
    try {
      await register({ name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(), password: form.password });
      navigate(location.state?.from || '/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell title="Create your account" subtitle="It takes less than a minute.">
      <form onSubmit={submit} noValidate className="form">
        <Field label="Full name" autoComplete="name" value={form.name} onChange={set('name')} error={errors.name} placeholder="e.g. Arun Kumar" />
        <div className="form-row">
          <Field label="Email address" type="email" autoComplete="email" value={form.email} onChange={set('email')} error={errors.email} placeholder="you@example.com" />
          <Field label="Mobile number" type="tel" inputMode="numeric" maxLength={10} autoComplete="tel" value={form.phone} onChange={set('phone')} error={errors.phone} placeholder="10-digit number" />
        </div>
        <div className="form-row">
          <Field label="Password" type="password" autoComplete="new-password" value={form.password} onChange={set('password')} error={errors.password} placeholder="Min. 8 characters" />
          <Field label="Confirm password" type="password" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} error={errors.confirm} placeholder="Re-enter password" />
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <button className="btn btn-primary btn-lg btn-block" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
        <p className="fine">By registering you agree to the terms of use and privacy policy.</p>
      </form>
      <p className="auth-switch">Already have an account? <Link to="/login" state={location.state}>Sign in</Link></p>
    </AuthShell>
  );
}
