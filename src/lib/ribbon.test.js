import { describe, it, expect } from 'vitest';
import {
  MINOR_TICK_PX,
  MAJOR_TICK_PX,
  firstTickAtOrAfter,
  isMajor,
  tickLabel
} from './ribbon.js';

describe('tick spacing', () => {
  it('puts a minor tick every $5,000', () => {
    expect(MINOR_TICK_PX).toBe(50);
  });

  it('puts a major tick every $50,000', () => {
    expect(MAJOR_TICK_PX).toBe(500);
  });

  it('nests majors on minors', () => {
    expect(MAJOR_TICK_PX % MINOR_TICK_PX).toBe(0);
  });
});

describe('firstTickAtOrAfter', () => {
  it('returns the position itself when already on a tick', () => {
    expect(firstTickAtOrAfter(100, 50)).toBe(100);
  });

  it('rounds up to the next tick', () => {
    expect(firstTickAtOrAfter(101, 50)).toBe(150);
  });

  it('starts at zero from the origin', () => {
    expect(firstTickAtOrAfter(0, 50)).toBe(0);
  });

  it('works nine billion pixels in without walking there', () => {
    expect(firstTickAtOrAfter(9_000_000_001, 50)).toBe(9_000_000_050);
  });

  it('stays exact at the end', () => {
    expect(firstTickAtOrAfter(10_000_000_000, 500)).toBe(10_000_000_000);
  });
});

describe('isMajor', () => {
  it('marks every tenth minor tick', () => {
    expect(isMajor(0)).toBe(true);
    expect(isMajor(500)).toBe(true);
    expect(isMajor(550)).toBe(false);
  });

  it('holds deep into the ribbon', () => {
    expect(isMajor(9_000_000_500)).toBe(true);
    expect(isMajor(9_000_000_050)).toBe(false);
  });
});

describe('tickLabel', () => {
  it('labels the first major tick', () => {
    expect(tickLabel(500)).toBe('$50,000');
  });

  it('labels a million', () => {
    expect(tickLabel(10_000)).toBe('$1,000,000');
  });

  it('labels a billion', () => {
    expect(tickLabel(10_000_000)).toBe('$1,000,000,000');
  });
});
