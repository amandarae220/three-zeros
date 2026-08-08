import { TRILLION, positionOf, formatShort } from './scaleEngine.js';

/** Always-visible escape hatches. The reader is never trapped in the ribbon. */
export const JUMPS = [1e6, 1e9, TRILLION].map((dollars) => ({
  dollars,
  label: formatShort(dollars),
  position: positionOf(dollars)
}));

const MAX_POSITION = positionOf(TRILLION);

export function clampPosition(position) {
  if (position < 0) return 0;
  if (position > MAX_POSITION) return MAX_POSITION;
  return position;
}

/** PageUp/PageDown move just under a viewport, keeping a line of overlap. */
export function pageDelta(viewportPx, direction) {
  return Math.round(viewportPx * 0.9) * direction;
}
