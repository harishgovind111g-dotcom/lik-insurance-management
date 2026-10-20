import { useCallback, useEffect, useState } from 'react';

const inr = new Intl.NumberFormat('en-IN');

/** 1500000 -> "₹15,00,000" */
export const rupees = (n) => `₹${inr.format(Number(n) || 0)}`;

/** 10000000 -> "₹1 Cr", 500000 -> "₹5 Lakh" */
export function shortRupees(n) {
  n = Number(n) || 0;
  if (n >= 10000000) return `₹${+(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${+(n / 100000).toFixed(2)} Lakh`;
  return rupees(n);
}

export function fmtDate(d) {
  if (!d) return '—';
  const date = new Date(`${d}T00:00:00`);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function todayIso() {
  const d = new Date();
  const pad = (x) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function durationText(days) {
  if (days >= 365 && days % 365 === 0) {
    const y = days / 365;
    return `${y} year${y > 1 ? 's' : ''}`;
  }
  if (days >= 365) return `${Math.round(days / 365)} years`;
  return `${days} days`;
}

export function policyStatus(p) {
  const t = todayIso();
  if (p.start > t) return 'Upcoming';
  return p.end >= t ? 'Active' : 'Expired';
}

/** CSS modifier for a status badge. */
export function statusClass(s) {
  return ({
    'Submitted': 'info',
    'Under Review': 'warn',
    'Approved': 'ok',
    'Rejected': 'bad',
    'Active': 'ok',
    'Expired': 'muted',
    'Upcoming': 'info'
  })[s] || 'muted';
}

/** Loads data from one or more API calls. Returns { data, error, loading, reload }. */
export function useLoad(loader, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(loader, deps);

  const reload = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }));
    return Promise.resolve()
      .then(run)
      .then((data) => setState({ data, error: null, loading: false }))
      .catch((error) => setState({ data: null, error, loading: false }));
  }, [run]);

  useEffect(() => { reload(); }, [reload]);
  return { ...state, reload };
}
