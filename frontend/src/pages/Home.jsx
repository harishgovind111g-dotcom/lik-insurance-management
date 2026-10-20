import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { useLoad } from '../lib/util.js';
import Icon, { metaFor } from '../components/Icon.jsx';
import PlanCard from '../components/PlanCard.jsx';
import { ErrorBox, Loader } from '../components/ui.jsx';

const STEPS = [
  { icon: 'search', title: 'Choose a plan', text: 'Browse a category, compare cover and premium, and read the benefits and exclusions.' },
  { icon: 'shield', title: 'Buy your policy', text: 'Sign in and apply. Your policy number appears instantly in My Policies.' },
  { icon: 'claim', title: 'File a claim', text: 'Pick the policy, enter the incident date, amount and details, and attach a document.' },
  { icon: 'check', title: 'Track the status', text: 'Follow your claim from Submitted to Under Review to Approved, with remarks from our team.' }
];


export default function Home() {
  const { user } = useAuth();
  const { data, error, loading, reload } = useLoad(() => Promise.all([api.get('/categories'), api.get('/plans')]));
  const [categories = [], plans = []] = data || [];
  const popular = plans.filter((p) => p.active && p.popular).slice(0, 4);

  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow"><Icon name="shield" size={16} /> Simple. Transparent. Online.</span>
            <h1>Let’s find you the <span className="hl">best insurance</span></h1>
            <p className="lead">Compare health, life, motor, travel and home insurance plans, buy a policy in minutes, and track your claims — all in one place.</p>
            <ul className="hero-points">
              <li><Icon name="check" size={18} strokeWidth={2.2} /> Plans from trusted insurers</li>
              <li><Icon name="check" size={18} strokeWidth={2.2} /> Policy issued instantly</li>
              <li><Icon name="check" size={18} strokeWidth={2.2} /> Track claims online</li>
            </ul>
            <div className="hero-cta">
              <Link to="/insurance" className="btn btn-primary btn-lg">Explore plans <Icon name="arrow" size={18} /></Link>
              <Link to={user ? '/claims/new' : '/claims'} className="btn btn-outline btn-lg">File a claim</Link>
            </div>
          </div>

          <div className="hero-panel">
            <div className="hero-panel-head">
              <strong>Choose insurance type</strong>
              <Link to="/insurance">View all <Icon name="arrow" size={14} /></Link>
            </div>
            {loading && <Loader />}
            <ErrorBox error={error} onRetry={reload} />
            <div className="product-grid">
              {categories.map((c) => {
                const meta = metaFor(c.id);
                return (
                  <Link key={c.id} to={`/insurance/${c.id}`} className="product-tile">
                    <span className={`tile-icon lg tone-${meta.tone}`}><Icon name={meta.icon} size={26} /></span>
                    <span className="product-name">{meta.short} Insurance</span>
                    <span className="product-tag">{meta.tag}</span>
                  </Link>
                );
              })}
              {categories.length > 0 && (
                <Link to="/claims" className="product-tile">
                  <span className="tile-icon lg tone-slate"><Icon name="claim" size={26} /></span>
                  <span className="product-name">Claims</span>
                  <span className="product-tag">File & track online</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>


      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Popular plans</span>
              <h2>Plans our customers choose most</h2>
            </div>
            <Link to="/insurance" className="link-arrow">See all plans <Icon name="arrow" size={16} /></Link>
          </div>
          {loading ? <Loader /> : (
            <div className="plan-grid">
              {popular.map((p) => <PlanCard key={p.id} plan={p} />)}
            </div>
          )}
        </div>
      </section>

      <section className="section section-tint">
        <div className="container">
          <div className="section-head center">
            <div>
              <span className="eyebrow">How it works</span>
              <h2>From choosing a plan to settling a claim</h2>
            </div>
          </div>
          <ol className="steps">
            {STEPS.map((s, i) => (
              <li key={s.title} className="step">
                <span className="step-num">{i + 1}</span>
                <span className="tile-icon tone-blue"><Icon name={s.icon} size={20} /></span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>


      <section className="section">
        <div className="container">
          <div className="cta-band">
            <div>
              <h2>Have a question about a plan?</h2>
              <p>Ask the LIK Assistant, or reach our support team. We are happy to help.</p>
            </div>
            <div className="cta-actions">
              <Link to="/support" className="btn btn-white">Contact support</Link>
              {!user && <Link to="/register" className="btn btn-accent">Create free account</Link>}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
