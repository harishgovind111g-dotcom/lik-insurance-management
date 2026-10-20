import { useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { fmtDate, policyStatus, rupees, shortRupees, todayIso, useLoad } from '../lib/util.js';
import Icon, { metaFor } from '../components/Icon.jsx';
import { Badge, Empty, ErrorBox, Loader, PageHeader, StatCard } from '../components/ui.jsx';

/** Loads my policies + all plans and joins them. */
function useMyData({ claims = false } = {}) {
  return useLoad(async () => {
    const [policies, plans, myClaims] = await Promise.all([
      api.get('/policies'),
      api.get('/plans'),
      claims ? api.get('/claims') : Promise.resolve([])
    ]);
    const planById = Object.fromEntries(plans.map((p) => [p.id, p]));
    const rich = policies.map((p) => ({ ...p, plan: planById[p.planId], status: policyStatus(p) }));
    const policyById = Object.fromEntries(rich.map((p) => [p.id, p]));
    return { policies: rich, claims: myClaims.map((c) => ({ ...c, policy: policyById[c.policyId] })) };
  });
}

export const CLAIM_STEPS = ['Submitted', 'Under Review', 'Approved'];

export function ClaimProgress({ status }) {
  const rejected = status === 'Rejected';
  const steps = rejected ? ['Submitted', 'Under Review', 'Rejected'] : CLAIM_STEPS;
  const idx = rejected ? 2 : CLAIM_STEPS.indexOf(status);
  return (
    <div className={`progress ${rejected ? 'is-rejected' : ''}`}>
      {steps.map((s, i) => (
        <div key={s} className={`progress-step ${i <= idx ? 'done' : ''} ${i === idx ? 'current' : ''}`}>
          <span className="dot">{i < idx || (i === idx && status !== 'Under Review' && status !== 'Submitted') ? <Icon name={rejected && i === 2 ? 'x' : 'check'} size={14} strokeWidth={2.6} /> : i + 1}</span>
          <span className="progress-label">{s}</span>
        </div>
      ))}
    </div>
  );
}

export function ClaimTimeline({ events }) {
  return (
    <ol className="timeline">
      {[...events].reverse().map((e, i) => (
        <li key={i}>
          <Badge status={e.s} />
          <span className="timeline-date">{fmtDate(e.d)}</span>
          {e.n && <p>{e.n}</p>}
        </li>
      ))}
    </ol>
  );
}

function ClaimsTable({ claims, linkBase = '/claims' }) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr><th>Claim ID</th><th>Policy</th><th>Submitted</th><th className="num">Amount</th><th>Status</th><th /></tr>
        </thead>
        <tbody>
          {claims.map((c) => (
            <tr key={c.id}>
              <td><strong>{c.no}</strong></td>
              <td>{c.policy ? <>{c.policy.plan?.name}<div className="sub">{c.policy.number}</div></> : `#${c.policyId}`}</td>
              <td>{fmtDate(c.created)}</td>
              <td className="num">{rupees(c.amount)}</td>
              <td><Badge status={c.status} /></td>
              <td className="right"><Link to={`${linkBase}/${c.id}`} className="link-arrow">View <Icon name="arrow" size={14} /></Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------- Dashboard ---------------- */
export function Dashboard() {
  const { user } = useAuth();
  const { data, error, loading, reload } = useMyData({ claims: true });
  const policies = data?.policies || [];
  const claims = data?.claims || [];
  const active = policies.filter((p) => p.status === 'Active');
  const pending = claims.filter((c) => c.status === 'Submitted' || c.status === 'Under Review');
  const totalCover = active.reduce((s, p) => s + (p.plan?.cover || 0), 0);

  return (
    <>
      <PageHeader
        title={`Hello, ${user.name.split(' ')[0]}`}
        subtitle="Here is a summary of your insurance with LIK."
        actions={<><Link to="/insurance" className="btn btn-outline">Buy a new plan</Link><Link to="/claims/new" className="btn btn-primary">File a claim</Link></>}
      />
      <div className="container section-sm">
        {loading && <Loader />}
        <ErrorBox error={error} onRetry={reload} />
        {data && (
          <>
            <div className="stat-grid">
              <StatCard icon="shield" label="Active policies" value={active.length} tone="blue" to="/policies" />
              <StatCard icon="rupee" label="Total active cover" value={shortRupees(totalCover)} tone="teal" />
              <StatCard icon="claim" label="Claims in progress" value={pending.length} tone="amber" to="/claims" />
              <StatCard icon="check" label="Claims approved" value={claims.filter((c) => c.status === 'Approved').length} tone="green" to="/claims" />
            </div>

            <div className="dash-grid">
              <div className="card">
                <div className="card-head">
                  <h2 className="card-title">My active policies</h2>
                  <Link to="/policies" className="link-arrow">View all <Icon name="arrow" size={14} /></Link>
                </div>
                {active.length === 0 ? (
                  <Empty icon="shield" title="No active policies" text="Browse our categories and buy your first plan." action={<Link to="/insurance" className="btn btn-primary btn-sm">Browse plans</Link>} />
                ) : (
                  <ul className="mini-list">
                    {active.map((p) => {
                      const meta = metaFor(p.plan?.cat);
                      return (
                        <li key={p.id}>
                          <span className={`tile-icon tone-${meta.tone}`}><Icon name={meta.icon} size={18} /></span>
                          <div className="grow">
                            <strong>{p.plan?.name}</strong>
                            <span className="sub">{p.number} · valid till {fmtDate(p.end)}</span>
                          </div>
                          <span className="mini-amount">{shortRupees(p.plan?.cover)}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="card">
                <div className="card-head">
                  <h2 className="card-title">Recent claims</h2>
                  <Link to="/claims" className="link-arrow">View all <Icon name="arrow" size={14} /></Link>
                </div>
                {claims.length === 0 ? (
                  <Empty icon="claim" title="No claims yet" text="When you file a claim, you can track it here." />
                ) : (
                  <ul className="mini-list">
                    {claims.slice(0, 4).map((c) => (
                      <li key={c.id}>
                        <span className="tile-icon tone-slate"><Icon name="claim" size={18} /></span>
                        <div className="grow">
                          <Link to={`/claims/${c.id}`}><strong>{c.no}</strong></Link>
                          <span className="sub">{c.policy?.plan?.name} · {rupees(c.amount)}</span>
                        </div>
                        <Badge status={c.status} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="quick-links">
              <Link to="/insurance" className="quick-link"><Icon name="grid" /><span>Browse insurance</span></Link>
              <Link to="/policies" className="quick-link"><Icon name="shield" /><span>My policies</span></Link>
              <Link to="/claims/new" className="quick-link"><Icon name="plus" /><span>New claim</span></Link>
              <Link to="/profile" className="quick-link"><Icon name="user" /><span>My profile</span></Link>
            </div>
          </>
        )}
      </div>
    </>
  );
}

/* ---------------- My Policies ---------------- */
export function MyPolicies() {
  const { data, error, loading, reload } = useMyData();
  const policies = data?.policies || [];

  return (
    <>
      <PageHeader title="My Policies" subtitle="All policies you have bought with LIK." actions={<Link to="/insurance" className="btn btn-primary">Buy a new plan</Link>} />
      <div className="container section-sm">
        {loading && <Loader />}
        <ErrorBox error={error} onRetry={reload} />
        {data && policies.length === 0 && (
          <Empty icon="shield" title="You have no policies yet" text="Choose a category, pick a plan and press Apply." action={<Link to="/insurance" className="btn btn-primary">Browse plans</Link>} />
        )}
        <div className="policy-grid">
          {policies.map((p) => {
            const meta = metaFor(p.plan?.cat);
            return (
              <article key={p.id} className="policy-card">
                <div className="policy-card-head">
                  <span className={`tile-icon tone-${meta.tone}`}><Icon name={meta.icon} size={20} /></span>
                  <div className="grow">
                    <h3>{p.plan?.name || 'Plan'}</h3>
                    <span className="provider">{p.plan?.provider}</span>
                  </div>
                  <Badge status={p.status} />
                </div>
                <dl className="kv">
                  <div><dt>Policy number</dt><dd>{p.number}</dd></div>
                  <div><dt>Premium</dt><dd>{rupees(p.plan?.premium)}{p.plan?.per}</dd></div>
                  <div><dt>Start date</dt><dd>{fmtDate(p.start)}</dd></div>
                  <div><dt>End date</dt><dd>{fmtDate(p.end)}</dd></div>
                  <div><dt>Cover</dt><dd>{rupees(p.plan?.cover)}</dd></div>
                </dl>
                <div className="policy-card-foot">
                  <Link to={`/plans/${p.planId}`} className="btn btn-ghost btn-sm">Plan details</Link>
                  {p.status === 'Active' && <Link to={`/claims/new?policy=${p.id}`} className="btn btn-outline btn-sm">File a claim</Link>}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </>
  );
}

/* ---------------- Claims list ---------------- */
export function Claims() {
  const { user, isAdmin } = useAuth();
  if (isAdmin) return <Navigate to="/admin/claims" replace />;
  if (!user) return <ClaimsGuest />;
  return <MyClaims />;
}

function ClaimsGuest() {
  return (
    <>
      <PageHeader title="Claims" subtitle="File a claim online and track it until it is settled." />
      <div className="container section-sm">
        <div className="claims-guest">
          <div className="card">
            <h2 className="card-title">How to file a claim</h2>
            <ol className="num-list">
              <li><strong>Sign in</strong> to your LIK account.</li>
              <li>Open <strong>Claims → New claim</strong> and choose one of your active policies.</li>
              <li>Enter the <strong>incident date, claim amount</strong> and a short description. Attach a document if you have one.</li>
              <li>Track the status: <Badge status="Submitted" /> → <Badge status="Under Review" /> → <Badge status="Approved" /></li>
            </ol>
          </div>
          <div className="card center-card">
            <span className="tile-icon xl tone-blue"><Icon name="claim" size={32} /></span>
            <h3>Sign in to file or track a claim</h3>
            <p className="muted">Your claims are linked to your account and policies.</p>
            <Link to="/login" state={{ from: '/claims' }} className="btn btn-primary btn-block">Sign in</Link>
            <Link to="/register" state={{ from: '/claims' }} className="btn btn-ghost btn-block">Create an account</Link>
          </div>
        </div>
      </div>
    </>
  );
}

function MyClaims() {
  const [filter, setFilter] = useState('All');
  const { data, error, loading, reload } = useMyData({ claims: true });
  const claims = (data?.claims || []).filter((c) => filter === 'All' || c.status === filter);

  return (
    <>
      <PageHeader title="My Claims" subtitle="Submit a new claim or check the status of an existing one." actions={<Link to="/claims/new" className="btn btn-primary"><Icon name="plus" size={18} /> New claim</Link>} />
      <div className="container section-sm">
        {loading && <Loader />}
        <ErrorBox error={error} onRetry={reload} />
        {data && (
          <>
            <div className="tabs">
              {['All', 'Submitted', 'Under Review', 'Approved', 'Rejected'].map((s) => (
                <button key={s} className={filter === s ? 'active' : ''} onClick={() => setFilter(s)}>{s}</button>
              ))}
            </div>
            {claims.length === 0
              ? <Empty icon="claim" title="No claims here" text={filter === 'All' ? 'You have not filed any claims yet.' : `No claims with status “${filter}”.`} action={filter === 'All' && <Link to="/claims/new" className="btn btn-primary">File a claim</Link>} />
              : <ClaimsTable claims={claims} />}
          </>
        )}
      </div>
    </>
  );
}

/* ---------------- Submit claim ---------------- */
export function NewClaim() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { data, error, loading, reload } = useMyData();
  const active = useMemo(() => (data?.policies || []).filter((p) => p.status === 'Active'), [data]);
  const [form, setForm] = useState({ policyId: params.get('policy') || '', incidentDate: '', amount: '', description: '' });
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [busy, setBusy] = useState(false);

  const policy = active.find((p) => p.id === form.policyId);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  function validate() {
    const e = {};
    if (!policy) e.policyId = 'Choose one of your active policies.';
    if (!form.incidentDate) e.incidentDate = 'Enter the incident date.';
    else if (form.incidentDate > todayIso()) e.incidentDate = 'The incident date cannot be in the future.';
    else if (policy && form.incidentDate < policy.start) e.incidentDate = `Must be on or after the policy start date (${fmtDate(policy.start)}).`;
    const amt = Number(form.amount);
    if (!amt || amt <= 0) e.amount = 'Enter the amount you are claiming.';
    else if (policy && amt > policy.plan.cover) e.amount = `Cannot exceed the cover of ${rupees(policy.plan.cover)}.`;
    if (form.description.trim().length < 20) e.description = 'Describe what happened in at least 20 characters.';
    if (file && !/\.(pdf|jpe?g|png)$/i.test(file.name)) e.file = 'Only PDF, JPG and PNG files are allowed.';
    else if (file && file.size > 5 * 1024 * 1024) e.file = 'The file must be 5 MB or smaller.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(ev) {
    ev.preventDefault();
    setSubmitError(null);
    if (!validate()) return;
    setBusy(true);
    try {
      const claim = await api.post('/claims', {
        policyId: Number(form.policyId),
        incidentDate: form.incidentDate,
        amount: Math.round(Number(form.amount)),
        description: form.description.trim(),
        documentName: null
      });
      let uploadError = null;
      if (file) {
        try { await api.upload(`/claims/${claim.id}/document`, file); } catch (err) { uploadError = err.message; }
      }
      navigate(`/claims/${claim.id}`, { state: { justFiled: true, uploadError } });
    } catch (err) {
      setSubmitError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader back={{ to: '/claims', label: 'My claims' }} title="File a new claim" subtitle="Fill in the details below. Your claim starts with the status Submitted." />
      <div className="container section-sm narrow">
        {loading && <Loader />}
        <ErrorBox error={error} onRetry={reload} />
        {data && active.length === 0 && (
          <Empty icon="shield" title="You need an active policy" text="Claims can only be filed against an active policy." action={<Link to="/insurance" className="btn btn-primary">Browse plans</Link>} />
        )}
        {data && active.length > 0 && (
          <form className="card form" onSubmit={submit} noValidate>
            <label className="field">
              <span>Policy</span>
              <select value={form.policyId} onChange={set('policyId')} aria-invalid={!!errors.policyId}>
                <option value="">Select a policy</option>
                {active.map((p) => <option key={p.id} value={p.id}>{p.number} — {p.plan?.name}</option>)}
              </select>
              {errors.policyId && <small className="field-error">{errors.policyId}</small>}
              {policy && <small className="hint">Cover {rupees(policy.plan.cover)} · valid {fmtDate(policy.start)} to {fmtDate(policy.end)}</small>}
            </label>
            <div className="form-row">
              <label className="field">
                <span>Incident date</span>
                <input type="date" max={todayIso()} min={policy?.start} value={form.incidentDate} onChange={set('incidentDate')} aria-invalid={!!errors.incidentDate} />
                {errors.incidentDate && <small className="field-error">{errors.incidentDate}</small>}
              </label>
              <label className="field">
                <span>Claim amount (₹)</span>
                <input type="number" min="1" step="1" inputMode="numeric" value={form.amount} onChange={set('amount')} placeholder="e.g. 25000" aria-invalid={!!errors.amount} />
                {errors.amount && <small className="field-error">{errors.amount}</small>}
              </label>
            </div>
            <label className="field">
              <span>What happened?</span>
              <textarea rows={5} maxLength={1000} value={form.description} onChange={set('description')} placeholder="Describe the incident, where and when it happened, and what the claim is for." aria-invalid={!!errors.description} />
              <small className="hint right">{form.description.trim().length}/1000</small>
              {errors.description && <small className="field-error">{errors.description}</small>}
            </label>
            <label className="field file-field">
              <span>Supporting document <em>(optional)</em></span>
              <div className="file-drop">
                <Icon name="upload" size={20} />
                <span>{file ? file.name : 'Choose a bill, report or photo (PDF, JPG, PNG)'}</span>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </div>
              {errors.file ? <small className="field-error">{errors.file}</small> : <small className="hint">Max 5 MB.</small>}
            </label>
            <ErrorBox error={submitError} />
            <div className="form-actions">
              <Link to="/claims" className="btn btn-ghost">Cancel</Link>
              <button className="btn btn-primary btn-lg" disabled={busy}>{busy ? 'Submitting…' : 'Submit claim'}</button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}

/* ---------------- Claim details ---------------- */
export function ClaimDetail() {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const location = useLocation();
  const { data, error, loading } = useLoad(async () => {
    const claim = await api.get(`/claims/${id}`);
    let policy = null;
    if (!isAdmin) {
      const [policies, plans] = await Promise.all([api.get('/policies'), api.get('/plans')]);
      policy = policies.find((p) => p.id === claim.policyId) || null;
      if (policy) policy = { ...policy, plan: plans.find((pl) => pl.id === policy.planId) };
    }
    return { claim, policy };
  }, [id, isAdmin]);

  if (isAdmin) return <Navigate to={`/admin/claims/${id}`} replace />;

  return (
    <>
      <PageHeader back={{ to: '/claims', label: 'My claims' }} title={data ? `Claim ${data.claim.no}` : 'Claim details'} subtitle={data ? `Submitted on ${fmtDate(data.claim.created)}` : ''} actions={data && <Badge status={data.claim.status} />} />
      <div className="container section-sm">
        {location.state?.justFiled && data && <div className="alert alert-success" style={{ marginBottom: 18 }}>Your claim {data.claim.no} has been submitted. We will review it shortly.</div>}
        {location.state?.uploadError && <div className="alert alert-error" style={{ marginBottom: 18 }}>The claim was saved but the file was not uploaded: {location.state.uploadError}</div>}
        {loading && <Loader />}
        {error && <Empty title="Claim not found" text={error.message} action={<Link to="/claims" className="btn btn-primary">Back to claims</Link>} />}
        {data && <ClaimBody claim={data.claim} policy={data.policy} />}
      </div>
    </>
  );
}

/** Opens the uploaded claim file in a new tab (the request carries the login token). */
function DocumentLink({ claim }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function open() {
    setErr('');
    setBusy(true);
    const win = window.open('', '_blank');
    try {
      const blob = await api.getBlob(`/claims/${claim.id}/document`);
      const url = URL.createObjectURL(blob);
      if (win) win.location.href = url; else window.location.href = url;
    } catch (e) {
      if (win) win.close();
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <span className="doc-name">{claim.doc}</span>
      <button type="button" className="btn btn-outline btn-sm doc-btn" onClick={open} disabled={busy}>
        <Icon name="claim" size={16} /> {busy ? 'Opening…' : 'View file'}
      </button>
      {err && <small className="field-error doc-err">{err}</small>}
    </>
  );
}

export function ClaimBody({ claim, policy, owner, side }) {
  return (
    <div className="detail-layout">
      <div className="detail-main">
        <div className="card">
          <h2 className="card-title">Claim progress</h2>
          <ClaimProgress status={claim.status} />
          {claim.remarks && (
            <div className="remark">
              <strong>Latest remarks from LIK</strong>
              <p>{claim.remarks}</p>
            </div>
          )}
        </div>
        <div className="card">
          <h2 className="card-title">Claim information</h2>
          <dl className="kv two">
            <div><dt>Claim ID</dt><dd>{claim.no}</dd></div>
            <div><dt>Claim amount</dt><dd>{rupees(claim.amount)}</dd></div>
            <div><dt>Incident date</dt><dd>{fmtDate(claim.incident)}</dd></div>
            <div><dt>Submitted on</dt><dd>{fmtDate(claim.created)}</dd></div>
            <div><dt>Policy</dt><dd>{policy ? `${policy.number}` : `#${claim.policyId}`}{policy?.plan && <span className="sub">{policy.plan.name}</span>}</dd></div>
            <div><dt>Document</dt><dd>{claim.doc ? <DocumentLink claim={claim} /> : '—'}</dd></div>
            {owner && <div><dt>Customer</dt><dd>{owner.name}<span className="sub">{owner.email}</span></dd></div>}
          </dl>
          <div className="desc-block">
            <dt>Description</dt>
            <p>{claim.desc}</p>
          </div>
        </div>
      </div>
      <aside className="detail-side">
        {side}
        <div className="card">
          <h2 className="card-title">Status history</h2>
          <ClaimTimeline events={claim.events} />
        </div>
      </aside>
    </div>
  );
}

/* ---------------- Profile ---------------- */
export function Profile() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ name: user.name, phone: user.phone });
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setMsg(null); setErr(null); setBusy(true);
    try {
      setUser(await api.put('/auth/profile', { name: form.name.trim(), phone: form.phone.trim() }));
      setMsg('Your profile has been updated.');
    } catch (ex) {
      setErr(ex);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="My Profile" subtitle="Your account details." />
      <div className="container section-sm narrow">
        <div className="card profile-card">
          <div className="profile-head">
            <span className="avatar xl">{user.name.charAt(0).toUpperCase()}</span>
            <div>
              <h2>{user.name}</h2>
              <span className="muted">{user.email}</span>
              <div className="chip-row"><span className="chip">{user.role === 'admin' ? 'Administrator' : 'Customer'}</span><span className="chip">Member since {fmtDate(user.since)}</span></div>
            </div>
          </div>
          <form className="form" onSubmit={submit}>
            <div className="form-row">
              <label className="field"><span>Full name</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
              <label className="field"><span>Mobile number</span><input value={form.phone} maxLength={10} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
            </div>
            <label className="field"><span>Email address</span><input value={user.email} disabled /><small className="hint">Email cannot be changed.</small></label>
            {msg && <div className="alert alert-success">{msg}</div>}
            <ErrorBox error={err} />
            <div className="form-actions"><button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button></div>
          </form>
        </div>
      </div>
    </>
  );
}

export { ClaimsTable };
