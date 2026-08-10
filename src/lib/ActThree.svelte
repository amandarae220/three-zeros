<script>
  import ZoomGrid from './ZoomGrid.svelte';
  import {
    SQUARE_DOLLARS,
    CELL_DOLLARS,
    TRILLION_CELLS,
    cellsFor
  } from './grid.js';
  import { timeline } from '../data/timeline.js';
  import {
    TRILLION,
    positionOf,
    formatDollars,
    formatShort,
    secondsToReach,
    BRISK_PX_PER_SECOND,
    formatDuration
  } from './scaleEngine.js';

  /** Derived, not looked up by date — the arc is whatever the data says it is. */
  const peak = timeline.reduce((highest, entry) =>
    entry.dollars > highest.dollars ? entry : highest
  );
  const closing = timeline[timeline.length - 1];

  const peakCells = cellsFor(peak.dollars, CELL_DOLLARS);
  const closingCells = cellsFor(closing.dollars, CELL_DOLLARS);

  /** What Act II charged the reader to cross a single billion. */
  const billionCrossing = formatDuration(
    secondsToReach(positionOf(CELL_DOLLARS), BRISK_PX_PER_SECOND)
  );

  /**
   * Steps 1 through 3 hold capacity at a thousand so the cells never resize.
   * The whole argument of step 3 is that the grid did not change — only what
   * one square is worth did.
   */
  const STEPS = [
    { count: 1, capacity: TRILLION_CELLS, threshold: 0, label: '' },
    { count: TRILLION_CELLS, capacity: TRILLION_CELLS, threshold: 0, label: '' },
    { count: TRILLION_CELLS, capacity: TRILLION_CELLS, threshold: 0, label: '' },
    {
      count: peakCells,
      capacity: peakCells,
      threshold: TRILLION_CELLS,
      label: formatShort(TRILLION)
    },
    // Capacity stays at the peak so the emptied cells read as absence rather
    // than as a smaller grid. The gap is the point.
    {
      count: closingCells,
      capacity: peakCells,
      threshold: TRILLION_CELLS,
      label: formatShort(TRILLION)
    }
  ];

  let step = $state(0);
  let markers = $state([]);

  const current = $derived(STEPS[step]);

  /**
   * A sticky stage that swaps its contents as the reader scrolls is motion
   * this query exists to suppress. The static path makes the same argument as
   * a table: what a square is worth, what a screen is worth, and the arc.
   */
  let reducedMotion = $state(false);

  $effect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotion = query.matches;

    const onChange = (event) => (reducedMotion = event.matches);
    query.addEventListener('change', onChange);

    return () => query.removeEventListener('change', onChange);
  });

  $effect(() => {
    if (reducedMotion) return;

    const elements = markers.filter(Boolean);
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) step = Number(entry.target.dataset.step);
        }
      },
      { rootMargin: '-50% 0px -50% 0px' }
    );

    for (const element of elements) observer.observe(element);
    return () => observer.disconnect();
  });
</script>

<!-- tabindex="-1" so Act II's skip link moves focus here, not just the viewport. -->
<section
  id="act-three"
  class="act act-three"
  tabindex="-1"
  aria-labelledby="act-three-heading"
>
  <header>
    <h2 id="act-three-heading">Act III — Zoom Out</h2>
    <p class="prompt">
      The only place in this piece where a trillion fits on one screen.
      {#if !reducedMotion}Keep scrolling.{/if}
    </p>
  </header>

  {#if reducedMotion}
    <div class="static">
      <p>
        This act is normally a grid that redraws as you scroll. Each step, as a figure:
      </p>

      <table>
        <caption class="sr-only">What each square and each screen is worth</caption>
        <thead>
          <tr>
            <th scope="col">Unit</th>
            <th scope="col">Made of</th>
            <th scope="col">Worth</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">One square</th>
            <td>—</td>
            <td>{formatDollars(SQUARE_DOLLARS)}</td>
          </tr>
          <tr>
            <th scope="row">One screen</th>
            <td>{TRILLION_CELLS.toLocaleString('en-US')} squares</td>
            <td>{formatDollars(CELL_DOLLARS)}</td>
          </tr>
          <tr>
            <th scope="row">A trillion</th>
            <td>{TRILLION_CELLS.toLocaleString('en-US')} screens</td>
            <td>{formatDollars(TRILLION)}</td>
          </tr>
        </tbody>
      </table>

      <p>
        Relabelling is the whole act. The same thousand squares are a billion dollars when each
        one is {formatDollars(SQUARE_DOLLARS)}, and a trillion when each one is
        {formatDollars(CELL_DOLLARS)}. Nothing about the grid changes.
      </p>

      <p>
        Act II charged you about {billionCrossing} to cross a single billion at a determined
        scroll. This act fits a thousand of them on one screen.
      </p>

      <table>
        <caption class="sr-only">The arc, as squares against the trillion line</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Figure</th>
            <th scope="col">Squares</th>
            <th scope="col">Source</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">{peak.date}</th>
            <td>{formatDollars(peak.dollars)}</td>
            <td>
              {peakCells.toLocaleString('en-US')} — {peakCells - TRILLION_CELLS} above the line
            </td>
            <td>
              <a
                href={peak.source}
                rel="noreferrer"
                aria-label="Source for the {peak.date} peak figure, as of {peak.asOf}"
              >Source</a>
              <span class="as-of">as of {peak.asOf}</span>
            </td>
          </tr>
          <tr>
            <th scope="row">{closing.date}</th>
            <td>{formatDollars(closing.dollars)}</td>
            <td>{closingCells} — below the line</td>
            <td>
              <a
                href={closing.source}
                rel="noreferrer"
                aria-label="Source for the {closing.date} figure, as of {closing.asOf}"
              >Source</a>
              <span class="as-of">as of {closing.asOf}</span>
            </td>
          </tr>
        </tbody>
      </table>

      <p>
        The difference is {peakCells - closingCells} squares — {formatShort(
          peak.dollars - closing.dollars
        )}, in seven weeks.
      </p>

      {#if peak.conflict}
        <p class="conflict">
          {peak.conflict.note}
          <a
            href={peak.conflict.source}
            rel="noreferrer"
            aria-label="Competing source for the {peak.date} peak, reporting {formatShort(
              peak.conflict.figure
            )}"
          >Competing figure: {formatShort(peak.conflict.figure)}</a>
        </p>
      {/if}
    </div>
  {:else}
  <div class="scrolly">
    <div class="stage">
      <ZoomGrid
        count={current.count}
        capacity={current.capacity}
        threshold={current.threshold}
        label={current.label}
        debugName="three"
      />
    </div>

    <div class="steps">
      <!-- Captions are real DOM text and carry the act on their own; the
           canvas beside them is aria-hidden decoration. -->
      <div class="step" data-step="0" bind:this={markers[0]}>
        <div class="caption">
          <p class="lede">One square is {formatDollars(SQUARE_DOLLARS)}.</p>
          <p>Not a symbol for a million dollars. A million dollars.</p>
        </div>
      </div>

      <div class="step" data-step="1" bind:this={markers[1]}>
        <div class="caption">
          <p class="lede">A thousand squares is {formatDollars(CELL_DOLLARS)}.</p>
          <p>
            The whole screen is a billion dollars, visible at once. Act II charged you about
            {billionCrossing} to cross this much at a determined scroll.
          </p>
        </div>
      </div>

      <div class="step" data-step="2" bind:this={markers[2]}>
        <div class="caption">
          <p class="lede">Now each square is {formatDollars(CELL_DOLLARS)}.</p>
          <p>
            Nothing moved. Not one square changed size or position. The screen is now
            {formatDollars(TRILLION)} — and that is the entire distance you could not scroll.
          </p>
        </div>
      </div>

      <div class="step" data-step="3" bind:this={markers[3]}>
        <div class="caption">
          <p class="lede">This is the arc, as area.</p>
          <p>
            The line is a trillion dollars. On {peak.date}, {formatShort(peak.dollars)} —
            {peakCells - TRILLION_CELLS} squares stood above it.
          </p>
          <p class="figure">
            {formatDollars(peak.dollars)}
            <a
              href={peak.source}
              rel="noreferrer"
              aria-label="Source for the {peak.date} peak figure, as of {peak.asOf}"
            >Source · as of {peak.asOf}</a>
          </p>
          {#if peak.conflict}
            <p class="conflict">
              {peak.conflict.note}
              <a
            href={peak.conflict.source}
            rel="noreferrer"
            aria-label="Competing source for the {peak.date} peak, reporting {formatShort(
              peak.conflict.figure
            )}"
          >Competing figure: {formatShort(peak.conflict.figure)}</a>
            </p>
          {/if}
        </div>
      </div>

      <div class="step" data-step="4" bind:this={markers[4]}>
        <div class="caption">
          <p class="lede">{closingCells} squares.</p>
          <p>
            {closing.date}. The empty space above is what left — {peakCells - closingCells}
            squares, {formatShort(peak.dollars - closing.dollars)}, gone in seven weeks.
          </p>
          <p class="figure">
            {formatDollars(closing.dollars)}
            <a
              href={closing.source}
              rel="noreferrer"
              aria-label="Source for the {closing.date} figure, as of {closing.asOf}"
            >Source · as of {closing.asOf}</a>
          </p>
          <p>That gap is the first thing in this piece you can see all at once.</p>
        </div>
      </div>
    </div>
  </div>
  {/if}
</section>

<style>
  .act {
    max-width: 46rem;
    margin: 0 auto;
    padding: 3rem 1.25rem 4rem;
    font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
    color: var(--text-primary);
  }

  h2 {
    font-size: clamp(1.5rem, 4vw, 2rem);
    line-height: 1.15;
    margin: 0 0 0.75rem;
    letter-spacing: -0.02em;
  }

  .prompt {
    color: var(--text-secondary);
    margin: 0 0 2rem;
    line-height: 1.5;
  }

  /* Grid overlay rather than negative margins: the stage and the steps occupy
     the same cell, so the stage sticks for exactly as long as the steps run. */
  .scrolly {
    display: grid;
    grid-template-columns: 1fr;
  }

  .stage,
  .steps {
    grid-area: 1 / 1;
    /* Grid items default to an auto minimum the canvas would otherwise set. */
    min-width: 0;
  }

  .stage {
    position: sticky;
    top: 0;
    height: 100vh;
    padding: 3rem 0;
    box-sizing: border-box;
  }

  .steps {
    position: relative;
    pointer-events: none;
  }

  .step {
    min-height: 100vh;
    display: flex;
    align-items: center;
  }

  .caption {
    pointer-events: auto;
    max-width: 24rem;
    padding: 1rem 1.125rem;
    background: var(--surface-1);
    border: 1px solid var(--hairline);
  }

  .caption p {
    margin: 0 0 0.625rem;
    font-size: 0.875rem;
    line-height: 1.5;
    color: var(--text-secondary);
  }

  .caption p:last-child {
    margin-bottom: 0;
  }

  .lede {
    font-size: 1.0625rem !important;
    color: var(--text-primary) !important;
    font-variant-numeric: tabular-nums;
  }

  .figure {
    font-variant-numeric: tabular-nums;
    color: var(--text-primary) !important;
  }

  .figure a,
  .conflict a {
    display: block;
    margin-top: 0.125rem;
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .conflict {
    font-size: 0.8125rem !important;
    color: var(--text-muted) !important;
  }

  .static p {
    line-height: 1.55;
    color: var(--text-secondary);
    margin: 0 0 1.25rem;
  }

  .static .conflict {
    font-size: 0.8125rem;
    color: var(--text-muted);
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 0 0 2rem;
    font-size: 0.875rem;
  }

  th,
  td {
    text-align: left;
    vertical-align: top;
    padding: 0.6rem 0.75rem 0.6rem 0;
    border-bottom: 1px solid var(--hairline);
  }

  thead th {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--text-muted);
  }

  tbody th {
    font-weight: 500;
    color: var(--text-primary);
  }

  tbody td {
    font-variant-numeric: tabular-nums;
    color: var(--text-secondary);
  }

  .as-of {
    display: block;
    font-size: 0.75rem;
    color: var(--text-muted);
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
