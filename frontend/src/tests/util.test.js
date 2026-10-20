import { describe, expect, it } from 'vitest';
import { durationText, policyStatus, rupees, shortRupees, statusClass, todayIso } from '../lib/util.js';

describe('rupees', () => {
  it('formats amounts in Indian style', () => {
    expect(rupees(1500000)).toBe('₹15,00,000');
    expect(rupees(499)).toBe('₹499');
  });

  it('treats missing values as zero', () => {
    expect(rupees(undefined)).toBe('₹0');
  });
});

describe('shortRupees', () => {
  it('shows crore and lakh', () => {
    expect(shortRupees(10000000)).toBe('₹1 Cr');
    expect(shortRupees(500000)).toBe('₹5 Lakh');
    expect(shortRupees(2500000)).toBe('₹25 Lakh');
  });

  it('shows small amounts in full', () => {
    expect(shortRupees(50000)).toBe('₹50,000');
  });
});

describe('durationText', () => {
  it('converts days into years', () => {
    expect(durationText(365)).toBe('1 year');
    expect(durationText(9125)).toBe('25 years');
  });

  it('keeps short durations in days', () => {
    expect(durationText(30)).toBe('30 days');
  });
});

describe('policyStatus', () => {
  const addDays = (n) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  };

  it('is Active between start and end date', () => {
    expect(policyStatus({ start: addDays(-10), end: addDays(100) })).toBe('Active');
  });

  it('is Expired after the end date', () => {
    expect(policyStatus({ start: addDays(-400), end: addDays(-5) })).toBe('Expired');
  });

  it('is Upcoming before the start date', () => {
    expect(policyStatus({ start: addDays(5), end: addDays(370) })).toBe('Upcoming');
  });
});

describe('statusClass', () => {
  it('gives each claim status a colour', () => {
    expect(statusClass('Approved')).toBe('ok');
    expect(statusClass('Rejected')).toBe('bad');
    expect(statusClass('Under Review')).toBe('warn');
    expect(statusClass('Submitted')).toBe('info');
    expect(statusClass('Something else')).toBe('muted');
  });
});

describe('todayIso', () => {
  it('returns the date as yyyy-mm-dd', () => {
    expect(todayIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
