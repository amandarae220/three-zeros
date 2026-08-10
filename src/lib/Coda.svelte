<script>
  import { referents } from '../data/referents.js';
  import { timeline, julyLoss } from '../data/timeline.js';
  import { formatDollars } from './scaleEngine.js';

  /** The piece is dated at its last reading and does not follow the subject further. */
  const asOf = timeline[timeline.length - 1].asOf;

  /**
   * July's loss is not a point-in-time net worth, so it sits in the arc as its
   * own row rather than pretending to be a balance.
   */
  const arc = [
    ...timeline.map((entry) => ({ ...entry, kind: 'balance' })),
    { ...julyLoss, date: julyLoss.asOf, event: julyLoss.note, kind: 'change' }
  ].sort((a, b) => a.date.localeCompare(b.date));
</script>

<section id="coda" class="act coda" aria-labelledby="coda-heading">
  <header>
    <h2 id="coda-heading">Coda — the sources</h2>
    <p class="as-of-line">
      Every figure on this page is point-in-time. The piece reads as of <strong>{asOf}</strong>
      and does not follow the subject past it.
    </p>
  </header>

  <h3 id="coda-referents">The ladder</h3>
  <!-- Scrollable region rather than wrapping the figures: breaking
       "$1,320,000,000,000" across lines would damage the one thing the piece
       is about. tabindex makes the region reachable without a pointer. -->
  <div class="scroller" role="region" aria-labelledby="coda-referents" tabindex="0">
  <table>
    <caption class="sr-only">
      Recognizable sums, ascending, each with its source and as-of date
    </caption>
    <thead>
      <tr>
        <th scope="col">Sum</th>
        <th scope="col">Amount</th>
        <th scope="col">Source</th>
      </tr>
    </thead>
    <tbody>
      {#each referents as referent (referent.dollars)}
        <tr>
          <th scope="row">
            {referent.label}
            <span class="note">{referent.note}</span>
          </th>
          <td>{formatDollars(referent.dollars)}</td>
          <td>
            <a
              href={referent.source}
              rel="noreferrer"
              aria-label="Source for {referent.label}, as of {referent.asOf}"
            >
              Source
            </a>
            <span class="stamp">as of {referent.asOf}</span>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
  </div>

  <h3 id="coda-arc">The arc</h3>
  <div class="scroller" role="region" aria-labelledby="coda-arc" tabindex="0">
  <table>
    <caption class="sr-only">
      The subject's net worth over seven weeks, with the figures outlets disagree on
    </caption>
    <thead>
      <tr>
        <th scope="col">Date</th>
        <th scope="col">What happened</th>
        <th scope="col">Figure</th>
        <th scope="col">Source</th>
      </tr>
    </thead>
    <tbody>
      {#each arc as entry (entry.date + entry.kind)}
        <tr>
          <th scope="row">{entry.date}</th>
          <td>{entry.event}</td>
          <td class="figure">
            {entry.kind === 'change' ? '−' : ''}{formatDollars(entry.dollars)}
            {#if entry.conflict}
              <span class="conflict">
                Disputed: {formatDollars(entry.conflict.figure)}. {entry.conflict.note}
                <a
                  href={entry.conflict.source}
                  rel="noreferrer"
                  aria-label="Source for the disputed {entry.date} figure"
                >
                  Competing source
                </a>
              </span>
            {/if}
          </td>
          <td>
            <a
              href={entry.source}
              rel="noreferrer"
              aria-label="Source for the {entry.date} figure, as of {entry.asOf}"
            >
              Source
            </a>
            <span class="stamp">as of {entry.asOf}</span>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
  </div>
</section>

<style>
  .act {
    max-width: 46rem;
    margin: 0 auto;
    padding: 3rem 1.25rem 5rem;
    font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
    color: var(--text-primary);
  }

  h2 {
    font-size: clamp(1.5rem, 4vw, 2rem);
    line-height: 1.15;
    margin: 0 0 0.75rem;
    letter-spacing: -0.02em;
  }

  h3 {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--text-muted);
    margin: 2rem 0 0.75rem;
  }

  .as-of-line {
    margin: 0 0 1rem;
    line-height: 1.55;
    color: var(--text-secondary);
  }

  .as-of-line strong {
    color: var(--text-primary);
    font-variant-numeric: tabular-nums;
  }

  .scroller {
    overflow-x: auto;
  }

  .scroller:focus-visible {
    outline: 2px solid var(--truth);
    outline-offset: 2px;
  }

  table {
    width: 100%;
    min-width: 30rem;
    border-collapse: collapse;
    font-size: 0.875rem;
  }

  th,
  td {
    text-align: left;
    vertical-align: top;
    padding: 0.7rem 0.75rem 0.7rem 0;
    border-bottom: 1px solid var(--hairline);
  }

  thead th {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--text-muted);
    border-bottom-color: var(--rail);
  }

  tbody th {
    font-weight: 500;
    color: var(--text-primary);
  }

  td {
    color: var(--text-secondary);
    line-height: 1.45;
  }

  .figure {
    font-variant-numeric: tabular-nums;
    color: var(--text-primary);
    white-space: nowrap;
  }

  .note {
    display: block;
    margin-top: 0.2rem;
    font-weight: 400;
    font-size: 0.8125rem;
    line-height: 1.45;
    color: var(--text-secondary);
  }

  .conflict {
    display: block;
    margin-top: 0.35rem;
    font-size: 0.75rem;
    line-height: 1.45;
    color: var(--text-muted);
    white-space: normal;
  }

  .stamp {
    display: block;
    font-size: 0.75rem;
    color: var(--text-muted);
    white-space: nowrap;
  }

  a {
    color: var(--truth);
  }

  a:focus-visible {
    outline: 2px solid var(--truth);
    outline-offset: 2px;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
    border: 0;
  }
</style>
