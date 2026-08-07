import { describe, it, expect } from 'vitest';
import { timeline, julyLoss } from './timeline.js';
import { referents } from './referents.js';

const records = [...timeline, ...referents, julyLoss];

describe('data invariants', () => {
  it('gives every record a non-empty source', () => {
    for (const r of records) {
      expect(r.source, JSON.stringify(r)).toBeTruthy();
      expect(r.source).toMatch(/^https?:\/\//);
    }
  });

  it('gives every record an ISO as-of date', () => {
    for (const r of records) {
      expect(r.asOf, JSON.stringify(r)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('gives every record a positive dollar figure', () => {
    for (const r of records) {
      expect(r.dollars).toBeGreaterThan(0);
      expect(Number.isFinite(r.dollars)).toBe(true);
    }
  });
});

describe('timeline', () => {
  it('runs in chronological order', () => {
    const dates = timeline.map((t) => t.date);
    expect([...dates].sort()).toEqual(dates);
  });

  it('opens at the IPO and closes at the current reading', () => {
    expect(timeline[0].date).toBe('2026-06-12');
    expect(timeline[timeline.length - 1].date).toBe('2026-08-04');
  });

  it('records the peak as data, not as a scale constant', () => {
    const peak = Math.max(...timeline.map((t) => t.dollars));
    expect(peak).toBe(1_320_000_000_000);
  });

  it('crosses the trillion threshold the ribbon ends at', () => {
    const crossings = timeline.filter((t) => t.dollars >= 1_000_000_000_000);
    expect(crossings.length).toBeGreaterThan(0);
    expect(crossings[0].date).toBe('2026-06-12');
  });

  it('flags the entries whose figures are disputed between outlets', () => {
    const disputed = timeline.filter((t) => t.conflict);
    for (const t of disputed) {
      expect(t.conflict.figure).toBeGreaterThan(0);
      expect(t.conflict.source).toMatch(/^https?:\/\//);
    }
    expect(disputed.length).toBeGreaterThan(0);
  });
});

describe('referents', () => {
  it('runs in ascending dollar order', () => {
    const values = referents.map((r) => r.dollars);
    expect([...values].sort((a, b) => a - b)).toEqual(values);
  });

  it('stays below a billion, so the ladder ends before the scroll begins', () => {
    for (const r of referents) {
      expect(r.dollars).toBeLessThan(1e9);
    }
  });

  it('fits the whole ladder inside the first thousandth of the ribbon', () => {
    const largest = Math.max(...referents.map((r) => r.dollars));
    expect(largest / 1_320_000_000_000).toBeLessThan(0.001);
  });
});

describe('julyLoss', () => {
  it('records the figure Act IV subtracts', () => {
    expect(julyLoss.dollars).toBe(363_000_000_000);
  });

  it('exceeds every referent on the ladder combined', () => {
    const ladder = referents.reduce((sum, r) => sum + r.dollars, 0);
    expect(julyLoss.dollars).toBeGreaterThan(ladder);
  });
});
