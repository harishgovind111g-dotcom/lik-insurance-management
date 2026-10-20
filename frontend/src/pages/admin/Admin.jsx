import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { fmtDate, policyStatus, rupees, shortRupees, useLoad } from '../../lib/util.js';
import Icon, { metaFor } from '../../components/Icon.jsx';
import { Badge, Empty, ErrorBox, Loader, PageHeader, StatCard } from '../../components/ui.jsx';
import { ClaimBody } from '../Customer.jsx';

const STATUSES = ['Submitted', 'Under Review', 'Approved', 'Rejected'];

/** Loads everything the admin pages need and joins it. */
function useAdminData() {
  return useLoad(async () => {
    const [users, policies, claims, plans, categories] = await Promise.all([
      api.get('/admin/users'), api.get('/admin/policies'), api.get('/admin/claims'), api.get('/plans'), api.get('/categories')
    ]);
    const userById = Object.fromEntries(users.map((u) => [u.id, u]));
    const planById = Object.fromEntries(plans.map((p) => [p.id, p]));
    const richPolicies = policies.map((p) => ({ ...p, plan: planById[p.planId], user: userById[p.userId], status: policyStatus(p) }));
    const policyById = Object.fromEntries(richPolicies.map((p) => [p.id, p]));
    const richClaims = claims.map((c) => ({ ...c, policy: policyById[c.policyId], user: userById[c.userId] }));
    return { users, policies: richPolicies, claims: richClaims, plans, categories };
  });
}

/* ---------------- Admin dashboard ---------------- */
export function AdminDashboard() {
  const { data, error, loading, reload } = useAdminData();
  const pending = (data?.claims || []).filter((c) => c.status === 'Submitted' || c.status === 'Under Review');

  return (
    <>
      <PageHeader title="Admin Dashboard" subtitle="Overview of users, policies, plans and claims." actions={<Link to="/admin/claims" className="btn btn-primary">Review claims</Link>} />
      <div className="container section-sm">
        {loading && <Loader />}
        <ErrorBox error={error} onRetry={reload} />
        {data && (
          <>
            <div className="stat-grid">
              <StatCard icon="users" label="Customers" value={data.users.filter((u) => u.role !== 'admin').length} tone="blue" to="/admin/users" />
              <StatCard icon="shield" label="Policies issued" value={data.policies.length} tone="teal" to="/admin/users" />
              <StatCard icon="grid" label="Active plans" value={data.plans.filter((p) => p.active).length} tone="violet" to="/admin/plans" />
              <StatCard icon="clock" label="Pending claims" value={pending.length} tone="amber" to="/admin/claims" />
            </div>

            <div className="dash-grid">
              <div className="card">
                <div className="card-head">
                  <h2 className="card-title">Claims waiting for review</h2>
                  <Link to="/admin/claims" className="link-arrow">All claims <Icon name="arrow" size={14} /></Link>
                </div>
                {pending.length === 0 ? <Empty icon="check" title="All caught up" text="There are no pending claims." /> : (
                  <ul className="mini-list">
                    {pending.map((c) => (
                      <li key={c.id}>
                        <span className="tile-icon tone-amber"><Icon name="claim" size={18} /></span>
                        <div className="grow">
                          <Link to={`/admin/claims/${c.id}`}><strong>{c.no}</strong></Link>
                          <span className="sub">{c.user?.name} · {rupees(c.amount)} · {fmtDate(c.created)}</span>
                        </div>
                        <Badge status={c.status} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="card">
                <h2 className="card-title">Claims by status</h2>
                <div className="bars">
                  {STATUSES.map((s) => {
                    const n = data.claims.filter((c) => c.status === s).length;
                    const pct = data.claims.length ? (n / data.claims.length) * 100 : 0;
                    return (
                      <div key={s} className="bar-row">
                        <span>{s}</span>
                        <div className="bar"><span className={`bar-fill fill-${s.replace(' ', '-').toLowerCase()}`} style={{ width: `${pct}%` }} /></div>
                        <strong>{n}</strong>
                      </div>
                    );
                  })}
                </div>
                <h2 className="card-title mt">Plans by category</h2>
                <div className="bars">
                  {data.categories.map((c) => {
                    const n = data.plans.filter((p) => p.cat === c.id && p.active).length;
                    return (
                      <div key={c.id} className="bar-row">
                        <span>{metaFor(c.id).short}</span>
                        <div className="bar"><span className="bar-fill" style={{ width: `${Math.min(100, n * 20)}%` }} /></div>
                        <strong>{n}</strong>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

/* ---------------- Manage claims ---------------- */
export function AdminClaims() {
  const [filter, setFilter] = useState('All');
  const { data, error, loading, reload } = useAdminData();
  const claims = (data?.claims || []).filter((c) => filter === 'All' || c.status === filter);

  return (
    <>
      <PageHeader title="Manage Claims" subtitle="Review claims, change their status and add remarks." />
      <div className="container section-sm">
        {loading && <Loader />}
        <ErrorBox error={error} onRetry={reload} />
        {data && (
          <>
            <div className="tabs">
              {['All', ...STATUSES].map((s) => (
                <button key={s} className={filter === s ? 'active' : ''} onClick={() => setFilter(s)}>
                  {s} <span className="tab-count">{s === 'All' ? data.claims.length : data.claims.filter((c) => c.status === s).length}</span>
                </button>
              ))}
            </div>
            {claims.length === 0 ? <Empty icon="claim" title="No claims" text="Nothing matches this filter." /> : (
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>Claim ID</th><th>Customer</th><th>Policy</th><th>Submitted</th><th className="num">Amount</th><th>Status</th><th /></tr></thead>
                  <tbody>
                    {claims.map((c) => (
                      <tr key={c.id}>
                        <td><strong>{c.no}</strong></td>
                        <td>{c.user?.name}<div className="sub">{c.user?.email}</div></td>
                        <td>{c.policy?.plan?.name}<div className="sub">{c.policy?.number}</div></td>
                        <td>{fmtDate(c.created)}</td>
                        <td className="num">{rupees(c.amount)}</td>
                        <td><Badge status={c.status} /></td>
                        <td className="right"><Link to={`/admin/claims/${c.id}`} className="btn btn-outline btn-sm">Review</Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

/* ---------------- Claim review ---------------- */
export function AdminClaimReview() {
  const { id } = useParams();
  const { data, error, loading, reload } = useLoad(async () => {
    const [claim, users, policies, plans] = await Promise.all([
      api.get(`/claims/${id}`), api.get('/admin/users'), api.get('/admin/policies'), api.get('/plans')
    ]);
    const policy = policies.find((p) => p.id === claim.policyId);
    return {
      claim,
      owner: users.find((u) => u.id === claim.userId),
      policy: policy ? { ...policy, plan: plans.find((p) => p.id === policy.planId) } : null
    };
  }, [id]);

  const [status, setStatus] = useState('');
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState(null);
  const [saved, setSaved] = useState(false);
  const [override, setOverride] = useState(null);

  const claim = override || data?.claim;
  const current = status || claim?.status || '';

  async function save(e) {
    e.preventDefault();
    setSaveErr(null); setSaved(false); setSaving(true);
    try {
      const updated = await api.put(`/admin/claims/${id}/status`, { status: current, remarks: remarks.trim() });
      setOverride(updated);
      setRemarks('');
      setStatus('');
      setSaved(true);
    } catch (err) {
      setSaveErr(err);
    } finally {
      setSaving(false);
    }
  }

  const side = claim && (
    <div className="card review-card">
      <h2 className="card-title">Update claim</h2>
      <form className="form" onSubmit={save}>
        <div className="status-pick">
          {STATUSES.map((s) => (
            <label key={s} className={`status-opt ${current === s ? 'on' : ''}`}>
              <input type="radio" name="status" value={s} checked={current === s} onChange={() => setStatus(s)} />
              <Badge status={s} />
            </label>
          ))}
        </div>
        <label className="field">
          <span>Remarks {current === 'Rejected' && <em>(required for rejection)</em>}</span>
          <textarea rows={4} maxLength={500} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Visible to the customer, e.g. documents verified." />
        </label>
        <ErrorBox error={saveErr} />
        {saved && <div className="alert alert-success">Claim updated. The customer can now see the new status.</div>}
        <button className="btn btn-primary btn-block" disabled={saving}>{saving ? 'Saving…' : 'Save update'}</button>
      </form>
    </div>
  );

  return (
    <>
      <PageHeader back={{ to: '/admin/claims', label: 'All claims' }} title={claim ? `Review ${claim.no}` : 'Review claim'} subtitle={data?.owner ? `Filed by ${data.owner.name}` : ''} actions={claim && <Badge status={claim.status} />} />
      <div className="container section-sm">
        {loading && <Loader />}
        <ErrorBox error={error} onRetry={reload} />
        {claim && <ClaimBody claim={claim} policy={data.policy} owner={data.owner} side={side} />}
      </div>
    </>
  );
}

/* ---------------- Manage plans ---------------- */
const EMPTY_PLAN = { category: 'health', provider: '', name: '', premium: '', cover: '', days: '365', benefits: '', exclusions: '', popular: false };

export function AdminPlans() {
  const { data, error, loading, reload } = useLoad(() => Promise.all([api.get('/plans'), api.get('/categories')]));
  const [plans, categories] = data || [[], []];
  const [cat, setCat] = useState('all');
  const [editing, setEditing] = useState(null); // null = form closed, 'new' = add, or a plan id
  const [form, setForm] = useState(EMPTY_PLAN);
  const [formErr, setFormErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [rowErr, setRowErr] = useState(null);
  const [notice, setNotice] = useState('');

  const list = useMemo(() => plans.filter((p) => cat === 'all' || p.cat === cat), [plans, cat]);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const lines = (text) => text.split('\n').map((x) => x.trim()).filter(Boolean);

  function openNew() {
    setForm(EMPTY_PLAN); setEditing('new'); setFormErr(null); setNotice('');
  }

  function openEdit(p) {
    setForm({
      category: p.cat, provider: p.provider, name: p.name, premium: String(p.premium), cover: String(p.cover),
      days: String(p.days), benefits: p.benefits.join('\n'), exclusions: p.excl.join('\n'), popular: p.popular
    });
    setEditing(p.id); setFormErr(null); setNotice('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function save(e) {
    e.preventDefault();
    setFormErr(null); setBusy(true);
    const body = {
      provider: form.provider.trim(), name: form.name.trim(),
      premium: Number(form.premium), cover: Number(form.cover), days: Number(form.days),
      benefits: lines(form.benefits)
    };
    try {
      if (editing === 'new') {
        await api.post('/admin/plans', { ...body, category: form.category });
        setNotice('Plan added.');
      } else {
        await api.put(`/admin/plans/${editing}`, { ...body, exclusions: lines(form.exclusions), popular: form.popular });
        setNotice('Plan updated.');
      }
      setEditing(null);
      reload();
    } catch (err) {
      setFormErr(err);
    } finally {
      setBusy(false);
    }
  }

  async function toggle(id) {
    setRowErr(null);
    try { await api.put(`/admin/plans/${id}/toggle`); reload(); } catch (err) { setRowErr(err); }
  }

  return (
    <>
      <PageHeader title="Manage Plans" subtitle="Add, edit or hide insurance plans." actions={!editing && <button className="btn btn-primary" onClick={openNew}><Icon name="plus" size={18} /> Add plan</button>} />
      <div className="container section-sm">
        {editing && (
          <form className="card form add-plan" onSubmit={save}>
            <h2 className="card-title">{editing === 'new' ? 'New plan' : `Edit plan: ${form.name}`}</h2>
            <div className="form-row three">
              <label className="field"><span>Category</span>
                <select value={form.category} onChange={set('category')} disabled={editing !== 'new'}>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
              </label>
              <label className="field"><span>Provider</span><input value={form.provider} onChange={set('provider')} placeholder="Insurer name" /></label>
              <label className="field"><span>Plan name</span><input value={form.name} onChange={set('name')} /></label>
            </div>
            <div className="form-row three">
              <label className="field"><span>Premium (₹)</span><input type="number" min="1" value={form.premium} onChange={set('premium')} /></label>
              <label className="field"><span>Cover amount (₹)</span><input type="number" min="1" value={form.cover} onChange={set('cover')} /></label>
              <label className="field"><span>Duration (days)</span><input type="number" min="1" value={form.days} onChange={set('days')} /></label>
            </div>
            <div className="form-row">
              <label className="field"><span>Benefits (one per line)</span><textarea rows={4} value={form.benefits} onChange={set('benefits')} /></label>
              {editing !== 'new' && <label className="field"><span>Exclusions (one per line)</span><textarea rows={4} value={form.exclusions} onChange={set('exclusions')} /></label>}
            </div>
            {editing !== 'new' && (
              <label className="check-row"><input type="checkbox" checked={form.popular} onChange={(e) => setForm({ ...form, popular: e.target.checked })} /> Show as "Most popular"</label>
            )}
            <ErrorBox error={formErr} />
            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : editing === 'new' ? 'Create plan' : 'Save changes'}</button>
            </div>
          </form>
        )}

        {notice && <div className="alert alert-success" style={{ marginBottom: 16 }}>{notice}</div>}
        {loading && <Loader />}
        <ErrorBox error={error || rowErr} onRetry={error ? reload : undefined} />
        {data && (
          <>
            <div className="tabs">
              <button className={cat === 'all' ? 'active' : ''} onClick={() => setCat('all')}>All <span className="tab-count">{plans.length}</span></button>
              {categories.map((c) => (
                <button key={c.id} className={cat === c.id ? 'active' : ''} onClick={() => setCat(c.id)}>{metaFor(c.id).short} <span className="tab-count">{plans.filter((p) => p.cat === c.id).length}</span></button>
              ))}
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Plan</th><th>Category</th><th className="num">Premium</th><th className="num">Cover</th><th>Duration</th><th>Status</th><th /></tr></thead>
                <tbody>
                  {list.map((p) => (
                    <tr key={p.id} className={p.active ? '' : 'dim'}>
                      <td><strong>{p.name}</strong><div className="sub">{p.provider}</div></td>
                      <td>{metaFor(p.cat).short}</td>
                      <td className="num">{rupees(p.premium)}<span className="sub-inline">{p.per}</span></td>
                      <td className="num">{shortRupees(p.cover)}</td>
                      <td>{p.days} days</td>
                      <td>{p.active ? <span className="badge badge-ok">Visible</span> : <span className="badge badge-muted">Hidden</span>}</td>
                      <td className="right" style={{ whiteSpace: 'nowrap' }}>
                        <button className="btn btn-outline btn-sm" onClick={() => openEdit(p)}>Edit</button>{' '}
                        <button className="btn btn-ghost btn-sm" onClick={() => toggle(p.id)}>{p.active ? 'Hide' : 'Show'}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </>
  );
}

/* ---------------- Users & policies ---------------- */
export function AdminUsers() {
  const { data, error, loading, reload } = useAdminData();
  const [tab, setTab] = useState('users');

  return (
    <>
      <PageHeader title="Users & Policies" subtitle="Every registered user and every policy issued." />
      <div className="container section-sm">
        {loading && <Loader />}
        <ErrorBox error={error} onRetry={reload} />
        {data && (
          <>
            <div className="tabs">
              <button className={tab === 'users' ? 'active' : ''} onClick={() => setTab('users')}>Users <span className="tab-count">{data.users.length}</span></button>
              <button className={tab === 'policies' ? 'active' : ''} onClick={() => setTab('policies')}>Policies <span className="tab-count">{data.policies.length}</span></button>
            </div>
            {tab === 'users' ? (
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th className="num">Policies</th><th className="num">Claims</th><th>Joined</th></tr></thead>
                  <tbody>
                    {data.users.map((u) => (
                      <tr key={u.id}>
                        <td><span className="cell-user"><span className="avatar sm">{u.name.charAt(0)}</span><strong>{u.name}</strong></span></td>
                        <td>{u.email}</td>
                        <td>{u.phone}</td>
                        <td>{u.role === 'admin' ? <span className="badge badge-info">Admin</span> : <span className="badge badge-muted">Customer</span>}</td>
                        <td className="num">{data.policies.filter((p) => p.userId === u.id).length}</td>
                        <td className="num">{data.claims.filter((c) => c.userId === u.id).length}</td>
                        <td>{fmtDate(u.since)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>Policy number</th><th>Customer</th><th>Plan</th><th>Start</th><th>End</th><th>Status</th></tr></thead>
                  <tbody>
                    {data.policies.map((p) => (
                      <tr key={p.id}>
                        <td><strong>{p.number}</strong></td>
                        <td>{p.user?.name}</td>
                        <td>{p.plan?.name}<div className="sub">{p.plan?.provider}</div></td>
                        <td>{fmtDate(p.start)}</td>
                        <td>{fmtDate(p.end)}</td>
                        <td><Badge status={p.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

