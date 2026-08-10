import { describe, it, expect } from 'vitest';
import { SECONDS_PER_DAY, SECONDS_PER_YEAR, humanDuration } from './time.js';

describe('constants', () => {
  it('counts a day in seconds', () => {
    expect(SECONDS_PER_DAY).toBe(86_400);
  });

  it('uses a Julian year', () => {
    // 365.25 days. A 365-day year puts a trillion seconds at 31,710 years and
    // the spec's figures stop matching.
    expect(SECONDS_PER_YEAR).toBe(31_557_600);
  });
});

describe('humanDuration', () => {
  it('makes a million seconds eleven and a half days', () => {
    expect(humanDuration(1e6)).toBe('11.6 days');
  });

  it('makes a billion seconds a working life', () => {
    expect(humanDuration(1e9)).toBe('31.7 years');
  });

  it('makes a trillion seconds deep prehistory', () => {
    expect(humanDuration(1e12)).toBe('31,688 years');
  });

  it('drops the decimal on whole units', () => {
    expect(humanDuration(SECONDS_PER_DAY)).toBe('1 day');
    expect(humanDuration(SECONDS_PER_YEAR)).toBe('1 year');
  });

  it('pluralises', () => {
    expect(humanDuration(SECONDS_PER_DAY * 2)).toBe('2 days');
  });

  it('groups large figures', () => {
    expect(humanDuration(SECONDS_PER_YEAR * 31_688)).toBe('31,688 years');
  });

  it('drops to hours and minutes below a day', () => {
    expect(humanDuration(3600)).toBe('1 hour');
    expect(humanDuration(90)).toBe('1.5 minutes');
    expect(humanDuration(30)).toBe('30 seconds');
  });

  it('holds at zero', () => {
    expect(humanDuration(0)).toBe('0 seconds');
  });
});
