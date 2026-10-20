import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PlanCard from '../components/PlanCard.jsx';
import { Badge, Empty } from '../components/ui.jsx';

afterEach(cleanup);

const plan = {
  id: '2', cat: 'health', provider: 'Suraksha Health', name: 'Aarogya Family Floater',
  premium: 14999, cover: 1000000, days: 365, per: '/year', popular: true, active: true,
  benefits: ['Cashless treatment', 'Free health check-up', 'Covers 4 members', 'Extra benefit'], excl: []
};

describe('PlanCard', () => {
  it('shows the plan name, provider, price and cover', () => {
    render(<MemoryRouter><PlanCard plan={plan} /></MemoryRouter>);

    expect(screen.getByText('Aarogya Family Floater')).toBeTruthy();
    expect(screen.getByText('Suraksha Health')).toBeTruthy();
    expect(screen.getByText('₹14,999')).toBeTruthy();
    expect(screen.getByText('₹10 Lakh')).toBeTruthy();
  });

  it('shows only the first three benefits', () => {
    render(<MemoryRouter><PlanCard plan={plan} /></MemoryRouter>);

    expect(screen.getByText('Covers 4 members')).toBeTruthy();
    expect(screen.queryByText('Extra benefit')).toBeNull();
  });

  it('shows the Most popular label for popular plans', () => {
    render(<MemoryRouter><PlanCard plan={plan} /></MemoryRouter>);
    expect(screen.getByText('Most popular')).toBeTruthy();
  });

  it('links to the plan details page', () => {
    render(<MemoryRouter><PlanCard plan={plan} /></MemoryRouter>);
    expect(screen.getByRole('link', { name: /view plan/i }).getAttribute('href')).toBe('/plans/2');
  });
});

describe('Badge', () => {
  it('uses the right colour for the status', () => {
    render(<Badge status="Approved" />);
    const badge = screen.getByText('Approved');
    expect(badge.className).toContain('badge-ok');
  });
});

describe('Empty', () => {
  it('shows the title and text', () => {
    render(<Empty title="No claims yet" text="File your first claim." />);
    expect(screen.getByText('No claims yet')).toBeTruthy();
    expect(screen.getByText('File your first claim.')).toBeTruthy();
  });
});
