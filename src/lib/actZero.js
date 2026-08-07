import { ACT_ZERO, linearFraction } from './scaleEngine.js';

/** What dollar amount the reader's marker position claims a billion is. */
export function guessToDollars(fraction) {
  return ACT_ZERO.min + fraction * (ACT_ZERO.max - ACT_ZERO.min);
}

/**
 * The size of the misconception, for the reveal.
 * `timesTooLarge` is the headline: a midpoint guess overshoots by ~500x.
 * `travel` is how far the marker slides when the truth arrives — the
 * reduced-motion path states it in words instead of animating it.
 */
export function guessError(fraction) {
  const guessed = guessToDollars(fraction);
  const actualFraction = linearFraction(ACT_ZERO.target, ACT_ZERO.min, ACT_ZERO.max);
  return {
    guessedDollars: guessed,
    actualFraction,
    timesTooLarge: guessed / ACT_ZERO.target,
    travel: Math.abs(fraction - actualFraction)
  };
}
