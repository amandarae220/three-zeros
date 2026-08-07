/**
 * The ladder of recognizable human sums. Every one of these is passed
 * within the first thousandth of Act II, which is the point.
 *
 * Ascending. All below $1B by design. Two candidates from the spec were
 * cut here under sourcing rule 2 — cut, don't estimate:
 *
 *   - A new fire engine. No federal or trade-association body publishes a
 *     single figure; trade press gives a $700k–$1.2M range with no median.
 *   - A commercial narrow-body airliner. Boeing and Airbus stopped
 *     publishing list prices in 2018, and real sale prices run 40–60%
 *     below the archived ones.
 */
export const referents = [
  {
    dollars: 16_280,
    label: 'One year of public school, one student',
    note: 'Current expenditure per pupil, US public elementary and secondary schools.',
    source: 'https://nces.ed.gov/fastfacts/display.asp?id=66',
    asOf: '2021-06-30'
  },
  {
    dollars: 83_730,
    label: 'Median US household income, one year',
    note: 'Real median household income, 2024. Not statistically different from 2023.',
    source: 'https://www.census.gov/library/publications/2025/demo/p60-286.html',
    asOf: '2024-12-31'
  },
  {
    dollars: 440_600,
    label: 'The median American home',
    note: 'Median existing-home sale price, June 2026. An all-time high.',
    source:
      'https://www.nar.realtor/newsroom/nar-existing-home-sales-report-shows-2-4-decrease-in-june',
    asOf: '2026-06-30'
  },
  {
    dollars: 1_600_000,
    label: 'An entire working life',
    note: 'Median lifetime earnings, full-time full-year worker with a high school diploma.',
    source: 'https://cew.georgetown.edu/cew-reports/collegepayoff2021/',
    asOf: '2021-10-01'
  }
];
