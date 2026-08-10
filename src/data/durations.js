/**
 * Act I retires the "I already know a billion is bigger" objection using time,
 * where intuition already exists. Three divisions and three anchors.
 *
 * `claim` marks an anchor that asserts something about the world rather than
 * restating the arithmetic. Those carry a source; the arithmetic does not.
 *
 * One anchor was cut here under sourcing rule 2. A billion seconds is often
 * glossed as "a working life," but BLS stopped publishing work-life
 * expectancy — the last such report rests on 1977 labour-force patterns — so
 * there is no current figure to cite. Life expectancy is published annually
 * and is used instead.
 */
export const durations = [
  {
    seconds: 1e6,
    label: 'A million seconds',
    anchor:
      'A week and a half. It has passed since roughly the last time you read the word "million" without stopping.'
  },
  {
    seconds: 1e9,
    label: 'A billion seconds',
    anchor: 'Two-fifths of a life.',
    claim: 'US life expectancy at birth was 79.0 years in 2024.',
    source: 'https://www.cdc.gov/nchs/fastats/life-expectancy.htm',
    asOf: '2024-12-31'
  },
  {
    seconds: 1e12,
    label: 'A trillion seconds',
    anchor: 'Before farming. Before writing. Before anything you would recognize as a society.',
    claim:
      'Agriculture took root about 12,000 years ago. A trillion seconds is more than twice as long again.',
    source: 'https://education.nationalgeographic.org/resource/development-agriculture/',
    asOf: '2022-10-19'
  }
];
