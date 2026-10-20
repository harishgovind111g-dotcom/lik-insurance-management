import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { durationText, rupees, shortRupees, useLoad } from '../lib/util.js';
import Icon, { metaFor } from '../components/Icon.jsx';
import { Empty, ErrorBox, Loader } from '../components/ui.jsx';

export default function PlanDetails() {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: plan, error, loading } = useLoad(() => api.get(`/plans/${id}`), [id]);
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState(null);
  const [policy, setPolicy] = useState(null);

  async function apply() {
    if (!user) {
      navigate('/login', { state: { from: location.pathname, message: 'Sign in or create an account to buy this plan.' } });
      return;
    }
    setApplying(true);
    setApplyError(null);
    try {
      setPolicy(await api.post('/policies', { planId: Number(id) }));
    } catch (err) {
      setApplyError(err);
    } finally {
      setApplying(false);
    }
  }

  if (loading) return <div className="container section"><Loader /></div>;
  if (error || !plan) {
    return (
      <div className="container section">
        <Empty title="Plan not found" text={error?.message} action={<Link className="btn btn-primary" to="/insurance">Browse plans</Link>} />
      </div>
    );
  }

  const meta = metaFor(plan.cat);

  return (
    <>
      <div className="page-head">
        <div className="container">
          <Link to={`/insurance/${plan.cat}`} className="back-link"><Icon name="back" size={16} /> Back to {meta.short} plans</Link>
          <div className="plan-hero">
            <span className={`tile-icon xl tone-${meta.tone}`}><Icon name={meta.icon} size={34} /></span>
            <div>
              <span className="provider">{plan.provider}</span>
              <h1>{plan.name}</h1>
              <div className="chip-row">
                {plan.popular && <span className="chip chip-orange"><Icon name="star" size={14} /> Most popular</span>}
                <span className="chip">{meta.short} insurance</span>
                {!plan.active && <span className="chip chip-muted">Not open for new applications</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container section-sm detail-layout">
        <div className="detail-main">
          <div className="card">
            <h2 className="card-title">Plan at a glance</h2>
            <div className="glance">
              <div><span>Cover amount</span><strong>{rupees(plan.cover)}</strong></div>
              <div><span>Premium</span><strong>{rupees(plan.premium)} <small>{plan.per}</small></strong></div>
              <div><span>Policy duration</span><strong>{durationText(plan.days)}</strong></div>
              <div><span>Provider</span><strong>{plan.provider}</strong></div>
            </div>
          </div>

          <div className="card">
            <h2 className="card-title">What’s covered</h2>
            <ul className="ticks lg">
              {plan.benefits.map((b) => <li key={b}><Icon name="check" size={18} strokeWidth={2.2} />{b}</li>)}
            </ul>
          </div>

          {plan.excl.length > 0 && (
            <div className="card">
              <h2 className="card-title">What’s not covered</h2>
              <ul className="ticks lg crosses">
                {plan.excl.map((b) => <li key={b}><Icon name="x" size={18} strokeWidth={2.2} />{b}</li>)}
              </ul>
            </div>
          )}
        </div>

        <aside className="detail-side">
          <div className="card buy-card">
            {policy ? (
              <div className="success-box">
                <span className="success-icon"><Icon name="check" size={28} strokeWidth={2.4} /></span>
                <h3>Policy issued!</h3>
                <p>Your policy number is</p>
                <div className="policy-no">{policy.number}</div>
                <p className="muted">Valid until {new Date(policy.end).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                <Link to="/policies" className="btn btn-primary btn-block">Go to My Policies</Link>
              </div>
            ) : (
              <>
                <span className="muted">Premium</span>
                <div className="buy-price">{rupees(plan.premium)}<small>{plan.per}</small></div>
                <div className="buy-line"><span>Cover</span><strong>{shortRupees(plan.cover)}</strong></div>
                <div className="buy-line"><span>Duration</span><strong>{durationText(plan.days)}</strong></div>
                <ErrorBox error={applyError} />
                <button className="btn btn-accent btn-lg btn-block" onClick={apply} disabled={applying || !plan.active || isAdmin}>
                  {applying ? 'Issuing policy…' : user ? 'Apply now' : 'Sign in to apply'}
                </button>
                {isAdmin && <p className="fine">Admin accounts cannot buy plans.</p>}
                <p className="fine"><Icon name="lock" size={14} /> Policy is issued instantly. Payment is not part of this demo.</p>
              </>
            )}
          </div>
          <div className="card help-card">
            <Icon name="headset" size={22} />
            <div>
              <strong>Need help choosing?</strong>
              <p>Ask the LIK Assistant (bottom right) or <Link to="/support">contact support</Link>.</p>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
