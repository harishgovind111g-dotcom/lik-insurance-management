import { useState } from 'react';
import Icon from '../components/Icon.jsx';
import { PageHeader } from '../components/ui.jsx';

const FAQS = [
  ['How do I buy a policy?', 'Open Insurance Products, choose a category and a plan, then press Apply now. If you are not signed in you will be asked to sign in or register first. The policy appears in My Policies straight away.'],
  ['How do I file a claim?', 'Go to Claims → New claim, choose an active policy, enter the incident date, the amount (up to the plan cover) and a description of at least 20 characters. You can attach a supporting document.'],
  ['What do the claim statuses mean?', 'Submitted: we have received your claim. Under Review: our team is checking the documents. Approved: the claim is accepted. Rejected: the claim cannot be paid — the remarks explain why.'],
  ['Can I claim more than my cover amount?', 'No. The claim amount cannot exceed the cover amount of the plan attached to your policy.'],
  ['Is the AI assistant a licensed advisor?', 'No. The LIK Assistant, powered by Google Gemini, explains plans and insurance terms using our plan data. Always read the plan exclusions before you buy.']
];

export default function Support() {
  const [open, setOpen] = useState(0);
  const [sent, setSent] = useState(false);

  return (
    <>
      <PageHeader title="Help & Support" subtitle="We are here to help with plans, policies and claims." />
      <div className="container section-sm">
        <div className="support-cards">
          <div className="card contact-card"><span className="tile-icon tone-blue"><Icon name="phone" /></span><div><strong>Call us</strong><span>1800-000-0000</span><small>Mon–Sat, 9am–7pm</small></div></div>
          <div className="card contact-card"><span className="tile-icon tone-teal"><Icon name="mail" /></span><div><strong>Email</strong><span>support@lik.in</span><small>Reply within 24 hours</small></div></div>
          <div className="card contact-card"><span className="tile-icon tone-orange"><Icon name="sparkle" /></span><div><strong>LIK Assistant</strong><span>Ask our AI anytime</span><small>Button at the bottom right</small></div></div>
        </div>

        <div className="support-grid">
          <div id="faq">
            <h2 className="h2">Frequently asked questions</h2>
            <div className="faq">
              {FAQS.map(([q, a], i) => (
                <div key={q} className={`faq-item ${open === i ? 'open' : ''}`}>
                  <button onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}>
                    {q}<span className="faq-sign">{open === i ? '−' : '+'}</span>
                  </button>
                  {open === i && <p>{a}</p>}
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <h2 className="card-title">Send us a message</h2>
            {sent ? (
              <div className="alert alert-success">Thanks! Our team will get back to you by email.</div>
            ) : (
              <form className="form" onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
                <label className="field"><span>Name</span><input required /></label>
                <label className="field"><span>Email</span><input type="email" required /></label>
                <label className="field"><span>Message</span><textarea rows={4} required /></label>
                <button className="btn btn-primary btn-block">Send message</button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
