import { describe, it, expect } from 'vitest';
import { guessToDollars, guessError } from './actZero.js';

describe('guessToDollars', () => {
  it('reads the left end as a million', () => {
    expect(guessToDollars(0)).toBe(1e6);
  });

  it('reads the right end as a trillion', () => {
    expect(guessToDollars(1)).toBe(1e12);
  });

  it('reads the midpoint as about half a trillion', () => {
    expect(guessToDollars(0.5)).toBeCloseTo(500_000_500_000, 0);
  });
});

describe('guessError', () => {
  it('reports how many times too large a midpoint guess is', () => {
    // Half a trillion guessed, one billion actual.
    expect(guessError(0.5).timesTooLarge).toBeCloseTo(500, 0);
  });

  it('reports no error for a perfect guess', () => {
    const perfect = 0.000999000999000999;
    expect(guessError(perfect).timesTooLarge).toBeCloseTo(1, 2);
  });

  it('reports the true fraction for the reveal', () => {
    expect(guessError(0.5).actualFraction).toBeCloseTo(0.000999, 6);
  });

  it('handles a guess at the far left without dividing by zero', () => {
    expect(Number.isFinite(guessError(0).timesTooLarge)).toBe(true);
  });

  it('reports the distance the marker travels on the reveal', () => {
    expect(guessError(0.5).travel).toBeCloseTo(0.499001, 5);
  });

  it('reports no travel for a perfect guess', () => {
    expect(guessError(0.000999000999000999).travel).toBeCloseTo(0, 5);
  });
});
