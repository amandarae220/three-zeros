/**
 * The arc. Point-in-time figures, each labelled with the date it was true.
 * Live updating is out of scope — the arc is the subject, not the ticker.
 *
 * Net worth estimates are exactly that. Where outlets disagree, the entry
 * carries a `conflict` and the page shows both rather than picking one.
 */
export const timeline = [
  {
    date: '2026-06-12',
    event:
      'SpaceX begins trading on the Nasdaq at $135 a share. Musk becomes the first person on record worth a trillion dollars.',
    dollars: 1_100_000_000_000,
    source: 'https://www.cnbc.com/2026/06/12/elon-musk-trillionaire-spacex.html',
    asOf: '2026-06-12'
  },
  {
    date: '2026-06-16',
    event: 'SpaceX closes at $211.39, its high. The peak.',
    dollars: 1_320_000_000_000,
    source:
      'https://www.forbes.com/sites/mattdurot/2026/06/24/elon-musk-is-no-longer-a-trillionaire/',
    asOf: '2026-06-16',
    conflict: {
      figure: 1_450_000_000_000,
      note: 'Some outlets report an intraday peak of about $1.45 trillion. This piece uses the closing-price figure throughout.',
      source:
        'https://fortune.com/2026/06/23/spacex-share-fluctuation-elon-musk-net-worth-trillionaire/'
    }
  },
  {
    date: '2026-06-24',
    event: 'SpaceX falls. He drops below a trillion, twelve days after crossing it.',
    dollars: 962_000_000_000,
    source:
      'https://fortune.com/2026/06/24/elon-musk-no-longer-trillionaire-spacex-valuation/',
    asOf: '2026-06-24'
  },
  {
    date: '2026-06-29',
    event: 'SpaceX and Tesla rally, adding more than $60 billion in a day. He crosses back over, briefly.',
    dollars: 1_000_000_000_000,
    source:
      'https://www.forbes.com/sites/tylerroush/2026/06/29/musk-is-a-trillionaire-again-spacex-and-tesla-boost-net-worth-by-50-billion/',
    asOf: '2026-06-29'
  },
  {
    date: '2026-07-27',
    event: 'The SpaceX rout extends. His wealth sinks below $700 billion.',
    dollars: 700_000_000_000,
    source:
      'https://www.forbes.com/sites/tylerroush/2026/07/27/elon-musks-wealth-sinks-below-700-billion-as-spacex-rout-extends/',
    asOf: '2026-07-27'
  },
  {
    date: '2026-08-04',
    event:
      'Seven weeks after the IPO, he is worth less than three-quarters of a trillion. The piece is dated here and does not follow him further.',
    dollars: 725_900_000_000,
    source:
      'https://www.forbes.com/sites/forbeswealthteam/article/the-top-ten-richest-people-in-the-world/',
    asOf: '2026-08-04',
    conflict: {
      figure: 690_000_000_000,
      note: 'Estimates in the final week of July ranged from roughly $684 to $690 billion depending on the outlet and the hour. All are point-in-time.',
      source:
        'https://financefeeds.com/elon-musk-net-worth-709-billion-600b-crash-crypto-stake/'
    }
  }
];

/**
 * July's loss, held separately because Act IV subtracts it from the grid.
 * Larger than the entire fortune of any other living person.
 */
export const julyLoss = {
  dollars: 363_000_000_000,
  label: 'Lost in July 2026',
  note: 'More than the entire net worth of any other person alive.',
  source:
    'https://www.forbes.com/sites/forbeswealthteam/article/the-top-ten-richest-people-in-the-world/',
  asOf: '2026-07-31'
};
