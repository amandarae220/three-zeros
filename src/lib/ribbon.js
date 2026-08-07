import { dollarsAt, formatDollars } from './scaleEngine.js';

/** A tick every $5,000. */
export const MINOR_TICK_PX = 50;

/** A labelled tick every $50,000. */
export const MAJOR_TICK_PX = 500;

/**
 * The first tick at or after `position`. One modulo, no walking — this is
 * what keeps rendering O(viewport) nine billion pixels in.
 */
export function firstTickAtOrAfter(position, spacing) {
  const remainder = position % spacing;
  return remainder === 0 ? position : position + (spacing - remainder);
}

export function isMajor(tickPosition) {
  return tickPosition % MAJOR_TICK_PX === 0;
}

export function tickLabel(tickPosition) {
  return formatDollars(dollarsAt(tickPosition));
}
