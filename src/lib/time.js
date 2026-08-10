export const SECONDS_PER_DAY = 86_400;

/**
 * A Julian year — 365.25 days. This is the convention under which a billion
 * seconds is 31.7 years and a trillion is 31,688. A 365-day year gives
 * visibly different figures and Act I's numbers stop matching the sources.
 */
export const SECONDS_PER_YEAR = 31_557_600;

const UNITS = [
  { seconds: SECONDS_PER_YEAR, name: 'year' },
  { seconds: SECONDS_PER_DAY, name: 'day' },
  { seconds: 3600, name: 'hour' },
  { seconds: 60, name: 'minute' },
  { seconds: 1, name: 'second' }
];

const GROUPED = new Intl.NumberFormat('en-US');

/**
 * The largest unit the duration fills, to one decimal below 100 and whole
 * numbers above it. Precision past that would be false — these are arguments
 * about scale, not measurements.
 */
export function humanDuration(seconds) {
  const unit = UNITS.find((u) => seconds >= u.seconds) ?? UNITS[UNITS.length - 1];
  const value = seconds / unit.seconds;
  const rounded = value < 100 ? Math.round(value * 10) / 10 : Math.round(value);
  return `${GROUPED.format(rounded)} ${unit.name}${rounded === 1 ? '' : 's'}`;
}
