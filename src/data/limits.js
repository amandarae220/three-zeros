/**
 * The governing constraint, as measured rather than as specified. No standard
 * defines a maximum element height; these are empirical limits browsers
 * impose, reported by the virtual-scrolling libraries that keep running into
 * them.
 *
 * The design spec quotes roughly 17,895,697px for Firefox. That figure is an
 * older Firefox limit and no longer holds — current Firefox sits alongside
 * Chrome at about 33.5 million. Corrected here, since the whole argument for
 * Act II's architecture rests on this number.
 *
 * Safari is widely described as lower, but no figure survived checking, so it
 * is not quoted. Sourcing rule 2: cut, do not estimate.
 */
export const elementHeightLimits = [
  {
    browser: 'Chrome',
    pixels: 33_554_428,
    source: 'https://github.com/TanStack/virtual/issues/616',
    asOf: '2026-08-09'
  },
  {
    browser: 'Firefox',
    pixels: 33_554_400,
    source: 'https://github.com/TanStack/virtual/issues/616',
    asOf: '2026-08-09'
  }
];

/** The lowest ceiling the piece has to clear. */
export const LOWEST_CEILING = Math.min(...elementHeightLimits.map((l) => l.pixels));
