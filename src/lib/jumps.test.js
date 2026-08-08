import { describe, it, expect } from 'vitest';
import { JUMPS, clampPosition, pageDelta } from './jumps.js';
import { TRILLION, positionOf } from './scaleEngine.js';

describe('JUMPS', () => {
  it('offers a million, a billion, and the peak', () => {
    expect(JUMPS.map((j) => j.dollars)).toEqual([1e6, 1e9, TRILLION]);
  });

  it('gives each jump a resolved pixel position', () => {
    for (const jump of JUMPS) {
      expect(jump.position).toBe(positionOf(jump.dollars));
    }
  });

  it('labels each jump in words', () => {
    expect(JUMPS[1].label).toBe('$1 billion');
  });

  it('runs ascending', () => {
    const positions = JUMPS.map((j) => j.position);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });
});

describe('clampPosition', () => {
  it('holds at the origin', () => {
    expect(clampPosition(-500)).toBe(0);
  });

  it('holds at the end', () => {
    expect(clampPosition(99e12)).toBe(positionOf(TRILLION));
  });

  it('passes through the middle', () => {
    expect(clampPosition(12_345)).toBe(12_345);
  });
});

describe('pageDelta', () => {
  it('pages down by just under a viewport', () => {
    expect(pageDelta(1000, 1)).toBe(900);
  });

  it('pages up by the same amount', () => {
    expect(pageDelta(1000, -1)).toBe(-900);
  });
});
