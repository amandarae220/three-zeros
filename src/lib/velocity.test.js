import { describe, it, expect } from 'vitest';
import { createSpeedTracker } from './velocity.js';

describe('createSpeedTracker', () => {
  it('reports zero before anything is recorded', () => {
    expect(createSpeedTracker().speed(0)).toBe(0);
  });

  it('reports pixels per second over the window', () => {
    const t = createSpeedTracker(500);
    t.record(100, 0);
    t.record(100, 100);
    t.record(100, 200);
    // 300px over 200ms.
    expect(t.speed(200)).toBeCloseTo(1500, 0);
  });

  it('drops samples older than the window', () => {
    const t = createSpeedTracker(500);
    t.record(10_000, 0);
    t.record(100, 900);
    t.record(100, 1000);
    // The 10,000px sample is outside the 500ms window and must not count.
    expect(t.speed(1000)).toBeLessThan(3000);
  });

  it('decays to zero once the reader stops', () => {
    const t = createSpeedTracker(500);
    t.record(1000, 0);
    expect(t.speed(2000)).toBe(0);
  });

  it('treats direction as speed, not velocity', () => {
    const t = createSpeedTracker(500);
    t.record(-300, 0);
    t.record(-300, 200);
    expect(t.speed(200)).toBeGreaterThan(0);
  });

  it('resets', () => {
    const t = createSpeedTracker(500);
    t.record(1000, 0);
    t.reset();
    expect(t.speed(0)).toBe(0);
  });
});
