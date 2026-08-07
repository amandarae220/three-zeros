import { describe, it, expect } from 'vitest';
import {
  DOLLARS_PER_PIXEL,
  TRILLION,
  positionOf,
  dollarsAt,
  linearFraction,
  ACT_ZERO,
  formatDollars,
  formatShort,
  secondsToComplete,
  formatDuration
} from './scaleEngine.js';

describe('constants', () => {
  it('scales at one hundred dollars per pixel', () => {
    expect(DOLLARS_PER_PIXEL).toBe(100);
  });

  it('ends the ribbon at a trillion', () => {
    expect(TRILLION).toBe(1_000_000_000_000);
  });
});

describe('positionOf', () => {
  it('places a million at ten thousand pixels', () => {
    expect(positionOf(1e6)).toBe(10_000);
  });

  it('places a billion at ten million pixels', () => {
    expect(positionOf(1e9)).toBe(10_000_000);
  });

  it('places a trillion at ten billion pixels', () => {
    expect(positionOf(TRILLION)).toBe(10_000_000_000);
  });

  it('keeps the end position inside safe integer range', () => {
    expect(positionOf(TRILLION)).toBeLessThan(Number.MAX_SAFE_INTEGER);
  });

  it('overshoots the browser element-height ceiling by about 298x', () => {
    const CHROME_MAX_ELEMENT_PX = 33_554_428;
    expect(positionOf(TRILLION) / CHROME_MAX_ELEMENT_PX).toBeCloseTo(298, 0);
  });

  it('places zero at the origin', () => {
    expect(positionOf(0)).toBe(0);
  });
});

describe('dollarsAt', () => {
  it('inverts positionOf at a million', () => {
    expect(dollarsAt(10_000)).toBe(1e6);
  });

  it('round-trips every order of magnitude', () => {
    for (const value of [1e3, 1e6, 1e9, TRILLION]) {
      expect(dollarsAt(positionOf(value))).toBe(value);
    }
  });
});

describe('linearFraction', () => {
  it('puts a billion a tenth of a percent along the million-to-trillion span', () => {
    expect(linearFraction(1e9, 1e6, 1e12)).toBeCloseTo(0.000999, 6);
  });

  it('renders as under one pixel on a thousand-pixel line', () => {
    expect(linearFraction(1e9, 1e6, 1e12) * 1000).toBeLessThan(1);
  });

  it('returns zero at the minimum', () => {
    expect(linearFraction(1e6, 1e6, 1e12)).toBe(0);
  });

  it('returns one at the maximum', () => {
    expect(linearFraction(1e12, 1e6, 1e12)).toBe(1);
  });

  it('clamps below the minimum', () => {
    expect(linearFraction(0, 1e6, 1e12)).toBe(0);
  });

  it('clamps above the maximum', () => {
    expect(linearFraction(1e15, 1e6, 1e12)).toBe(1);
  });
});

describe('ACT_ZERO', () => {
  it('spans a million to a trillion, asking for a billion', () => {
    expect(ACT_ZERO).toEqual({ min: 1e6, max: 1e12, target: 1e9 });
  });
});

describe('formatDollars', () => {
  it('groups a million', () => {
    expect(formatDollars(1e6)).toBe('$1,000,000');
  });

  it('groups a billion', () => {
    expect(formatDollars(1e9)).toBe('$1,000,000,000');
  });

  it('groups a trillion', () => {
    expect(formatDollars(1e12)).toBe('$1,000,000,000,000');
  });

  it('rounds to whole dollars', () => {
    expect(formatDollars(1234.56)).toBe('$1,235');
  });

  it('formats zero', () => {
    expect(formatDollars(0)).toBe('$0');
  });
});

describe('formatShort', () => {
  it('names a million', () => {
    expect(formatShort(1e6)).toBe('$1 million');
  });

  it('names a billion', () => {
    expect(formatShort(1e9)).toBe('$1 billion');
  });

  it('names the peak with two decimals', () => {
    expect(formatShort(1_320_000_000_000)).toBe('$1.32 trillion');
  });

  it('names the July loss', () => {
    expect(formatShort(363_000_000_000)).toBe('$363 billion');
  });

  it('drops trailing zeros in the decimal', () => {
    expect(formatShort(1_500_000_000)).toBe('$1.5 billion');
  });

  it('falls back to grouped digits below a million', () => {
    expect(formatShort(45_000)).toBe('$45,000');
  });
});

describe('secondsToComplete', () => {
  it('takes about thirty-nine days from zero at a fast scroll', () => {
    const days = secondsToComplete(0, 3000) / 86_400;
    expect(days).toBeGreaterThan(38);
    expect(days).toBeLessThan(40);
  });

  it('takes about three seconds to clear a million', () => {
    expect(
      secondsToComplete(0, 3000) - secondsToComplete(positionOf(1e6), 3000)
    ).toBeCloseTo(3.33, 1);
  });

  it('returns zero at the end', () => {
    expect(secondsToComplete(positionOf(TRILLION), 3000)).toBe(0);
  });

  it('returns Infinity when stopped', () => {
    expect(secondsToComplete(0, 0)).toBe(Infinity);
  });
});

describe('formatDuration', () => {
  it('reads seconds under a minute', () => {
    expect(formatDuration(45)).toBe('45 seconds');
  });

  it('reads minutes under an hour', () => {
    expect(formatDuration(3300)).toBe('55 minutes');
  });

  it('reads hours under a day', () => {
    expect(formatDuration(7200)).toBe('2 hours');
  });

  it('reads days beyond that', () => {
    expect(formatDuration(3_333_333)).toBe('39 days');
  });

  it('singularizes', () => {
    expect(formatDuration(86_400)).toBe('1 day');
  });

  it('reads Infinity as never', () => {
    expect(formatDuration(Infinity)).toBe('never');
  });
});
