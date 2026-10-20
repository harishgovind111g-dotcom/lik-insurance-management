import { Link } from 'react-router-dom';
import { durationText, rupees, shortRupees } from '../lib/util.js';
import Icon, { metaFor } from './Icon.jsx';

export default function PlanCard({ plan, compact = false }) {
  const meta = metaFor(plan.cat);
  return (
    <article className={`plan-card ${plan.popular ? 'is-popular' : ''}`}>
      {plan.popular && <span className="ribbon">Most popular</span>}
      <div className="plan-card-top">
        <span className={`tile-icon tone-${meta.tone}`}><Icon name={meta.icon} size={20} /></span>
        <div>
          <h3>{plan.name}</h3>
          <span className="provider">{plan.provider}</span>
        </div>
      </div>

      <div className="plan-figures">
        <div>
          <span className="fig-label">Cover</span>
          <span className="fig-value">{shortRupees(plan.cover)}</span>
        </div>
        <div>
          <span className="fig-label">Duration</span>
          <span className="fig-value">{durationText(plan.days)}</span>
        </div>
      </div>

      {!compact && (
        <ul className="ticks">
          {plan.benefits.slice(0, 3).map((b) => <li key={b}><Icon name="check" size={16} strokeWidth={2.2} />{b}</li>)}
        </ul>
      )}

      <div className="plan-card-foot">
        <div className="price">
          <strong>{rupees(plan.premium)}</strong>
          <span>{plan.per}</span>
        </div>
        <Link to={`/plans/${plan.id}`} className="btn btn-primary btn-sm">View plan <Icon name="arrow" size={16} /></Link>
      </div>
    </article>
  );
}
