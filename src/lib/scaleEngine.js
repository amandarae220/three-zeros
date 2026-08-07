/** Dollars represented by one vertical pixel of the Act II ribbon. */
export const DOLLARS_PER_PIXEL = 100;

/**
 * Where the ribbon ends. A threshold, not an estimate — which is why it is
 * safe to hardcode. Net worth figures get revised; "the first person on record
 * to cross a trillion dollars" does not. Every act in the piece ends here.
 */
export const TRILLION = 1_000_000_000_000;

/** Convert a dollar amount to its pixel offset on the ribbon. */
export function positionOf(dollars) {
  return dollars / DOLLARS_PER_PIXEL;
}

/** Convert a pixel offset on the ribbon back to dollars. */
export function dollarsAt(position) {
  return position * DOLLARS_PER_PIXEL;
}

/** Act 0's line: guess where a billion falls between a million and a trillion. */
export const ACT_ZERO = { min: 1e6, max: 1e12, target: 1e9 };

/**
 * Where `value` sits on a linear scale from `min` to `max`, as 0..1.
 * Clamped, because Act 0 lets the reader drag past either end.
 */
export function linearFraction(value, min, max) {
  const fraction = (value - min) / (max - min);
  if (fraction < 0) return 0;
  if (fraction > 1) return 1;
  return fraction;
}

const GROUPED = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

const SCALES = [
  { threshold: 1e12, divisor: 1e12, name: 'trillion' },
  { threshold: 1e9, divisor: 1e9, name: 'billion' },
  { threshold: 1e6, divisor: 1e6, name: 'million' }
];

/** Every digit, comma-grouped. The zeros are the argument. */
export function formatDollars(n) {
  return `$${GROUPED.format(Math.round(n))}`;
}

/** Short form for cramped labels and screen-reader text. */
export function formatShort(n) {
  const scale = SCALES.find((s) => n >= s.threshold);
  if (!scale) return formatDollars(n);
  const rounded = Math.round((n / scale.divisor) * 100) / 100;
  return `$${rounded} ${scale.name}`;
}

const UNITS = [
  { seconds: 86_400, name: 'day' },
  { seconds: 3_600, name: 'hour' },
  { seconds: 60, name: 'minute' },
  { seconds: 1, name: 'second' }
];

/** How long the rest of the ribbon takes at the reader's current speed. */
export function secondsToComplete(position, pxPerSecond) {
  const remaining = positionOf(TRILLION) - position;
  if (remaining <= 0) return 0;
  if (pxPerSecond <= 0) return Infinity;
  return remaining / pxPerSecond;
}

/** Coarse duration — one unit only. Precision here would be false comfort. */
export function formatDuration(seconds) {
  if (!Number.isFinite(seconds)) return 'never';
  const unit = UNITS.find((u) => seconds >= u.seconds) ?? UNITS[UNITS.length - 1];
  const count = Math.round(seconds / unit.seconds);
  return `${count} ${unit.name}${count === 1 ? '' : 's'}`;
}
