<script>
  import ZoomGrid from './ZoomGrid.svelte';
  import {
    CELL_DOLLARS,
    TRILLION_CELLS,
    REMOVAL_MS,
    cellsFor,
    cellsRemainingAt
  } from './grid.js';
  import { timeline, julyLoss } from '../data/timeline.js';
  import { guessToDollars } from './actZero.js';
  import { TRILLION, formatDollars, formatShort } from './scaleEngine.js';

  let { readerGuess = null } = $props();

  /** ISO dates compare as strings, so this needs no date parsing. */
  const JULY = '2026-07';

  const peak = timeline.reduce((highest, entry) =>
    entry.dollars > highest.dollars ? entry : highest
  );
  const preJuly = timeline.filter((entry) => entry.date < JULY).at(-1);
  const closing = timeline[timeline.length - 1];

  const peakCells = cellsFor(peak.dollars, CELL_DOLLARS);
  const fromCells = cellsFor(preJuly.dollars, CELL_DOLLARS);
  const lostCells = cellsFor(julyLoss.dollars, CELL_DOLLARS);
  const toCells = fromCells - lostCells;

  /**
   * What the reader claimed a billion was, back in Act 0. Null when they
   * skipped the act — the callback is then simply absent, not stubbed.
   */
  const guessedDollars = $derived(readerGuess === null ? null : guessToDollars(readerGuess));

  /** Kept to one decimal below 10 — "2× " and "2.4× " both need to be true. */
  const lossVersusGuess = $derived.by(() => {
    if (guessedDollars === null || guessedDollars <= 0) return null;
    const ratio = julyLoss.dollars / guessedDollars;
    return ratio < 10 ? Math.round(ratio * 10) / 10 : Math.round(ratio);
  });

  let stage = $state(null);
  let startedAt = $state(null);
  let elapsed = $state(0);
  let frame = null;

  const remaining = $derived(
    startedAt === null ? fromCells : cellsRemainingAt(elapsed, fromCells, toCells, REMOVAL_MS)
  );
  const done = $derived(startedAt !== null && elapsed >= REMOVAL_MS);

  let announcement = $state('');

  function tick(now) {
    elapsed = now - startedAt;
    if (elapsed < REMOVAL_MS) {
      frame = requestAnimationFrame(tick);
    } else {
      frame = null;
      elapsed = REMOVAL_MS;
      announcement = `${formatShort(julyLoss.dollars)} gone. ${toCells} squares left standing.`;
    }
  }

  function begin() {
    if (startedAt !== null) return;
    startedAt = performance.now();
    elapsed = 0;
    announcement = `Applying July. ${formatShort(julyLoss.dollars)} is about to leave.`;
    frame = requestAnimationFrame(tick);
  }

  /**
   * A quantity draining in front of the reader is exactly the motion this
   * query suppresses. The static path states the same subtraction in prose —
   * the end state, not a degraded animation.
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
    if (reducedMotion || !stage) return;

    // Runs once. Re-entering the act does not replay the loss.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            begin();
            observer.disconnect();
          }
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(stage);

    return () => {
      observer.disconnect();
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
    };
  });
</script>

<section id="act-four" class="act act-four" aria-labelledby="act-four-heading">
  <header>
    <h2 id="act-four-heading">Act IV — What Evaporated</h2>
    <p class="prompt">
      Back to {preJuly.date}, when he was above the line again — {fromCells} squares. Then July
      happens.
    </p>
  </header>

  {#if reducedMotion}
    <div class="static">
      <p class="lede-static">{lostCells} squares, gone in thirty-one days.</p>
      <p>
        On {preJuly.date} he was above the line again at {fromCells} squares. July removed
        {lostCells} of them. Every one is a billion dollars — the distance Act II charged you
        the better part of an hour to cross once. This is that distance, {lostCells} times
        over, leaving in a month.
      </p>
      {#if guessedDollars !== null}
        <p class="callback-static">
          {#if guessedDollars < julyLoss.dollars}
            In Act 0 you put a billion at {formatShort(guessedDollars)}. What left in July is
            {lossVersusGuess}× that.
          {:else}
            In Act 0 you put a billion at {formatShort(guessedDollars)} — more than the
            {formatShort(julyLoss.dollars)} that vanished in July. Your guess at a single
            billion was larger than an entire month's collapse.
          {/if}
        </p>
      {/if}
    </div>
  {:else}
  <div class="stage" bind:this={stage}>
    <ZoomGrid
      count={remaining}
      capacity={peakCells}
      threshold={TRILLION_CELLS}
      label={formatShort(TRILLION)}
      debugName="four"
    />

    <div class="readout">
      <p class="amount">{formatDollars(remaining * CELL_DOLLARS)}</p>
      <p class="meta">{remaining} squares</p>
    </div>

    {#if done}
      <div class="verdict">
        <p class="lede">{lostCells} squares, gone in thirty-one days.</p>
        <p>
          Every one of them is a billion dollars — the distance Act II charged you the better
          part of an hour to cross once. This is that distance, {lostCells} times over, leaving
          in a month.
        </p>
        {#if guessedDollars !== null}
          <p class="callback">
            {#if guessedDollars < julyLoss.dollars}
              In Act 0 you put a billion at {formatShort(guessedDollars)}. What left in July is
              {lossVersusGuess}× that — a number you had already stretched to, gone in a month
              without anyone able to picture it going.
            {:else}
              In Act 0 you put a billion at {formatShort(guessedDollars)} — more than the
              {formatShort(julyLoss.dollars)} that vanished in July. Your guess at a single
              billion was larger than an entire month's collapse.
            {/if}
          </p>
        {/if}
      </div>
    {/if}
  </div>
  {/if}

  <p class="sr-only" role="status" aria-live="polite">{announcement}</p>

  <div class="ledger">
    <h3>The figures</h3>
    <dl>
      <div>
        <dt>{preJuly.date}</dt>
        <dd>
          {formatDollars(preJuly.dollars)}
          <a href={preJuly.source} rel="noreferrer">Source · as of {preJuly.asOf}</a>
        </dd>
      </div>
      <div>
        <dt>{julyLoss.label}</dt>
        <dd>
          −{formatDollars(julyLoss.dollars)}
          <span class="note">{julyLoss.note}</span>
          <a href={julyLoss.source} rel="noreferrer">Source · as of {julyLoss.asOf}</a>
        </dd>
      </div>
      <div>
        <dt>{closing.date}</dt>
        <dd>
          {formatDollars(closing.dollars)}
          <a href={closing.source} rel="noreferrer">Source · as of {closing.asOf}</a>
        </dd>
      </div>
    </dl>

    <!-- Editorial rule 2: where the sources do not reconcile, say so rather
         than animating to the tidier number. -->
    <p class="reconcile">
      These do not subtract. {formatDollars(preJuly.dollars)} less
      {formatShort(julyLoss.dollars)} is {formatDollars(toCells * CELL_DOLLARS)}, but the
      recorded figure on {closing.date} is {formatDollars(closing.dollars)}. The
      {formatShort(julyLoss.dollars)} is a record single-month fall; other days inside the
      window moved the other way. What the grid shows is the size of the loss, not a running
      balance.
    </p>
  </div>
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

  .stage {
    position: relative;
    height: 80vh;
    min-height: 26rem;
  }

  .readout {
    position: absolute;
    top: 0;
    right: 0;
    text-align: right;
    pointer-events: none;
  }

  .amount {
    margin: 0;
    font-size: clamp(1.25rem, 3vw, 1.75rem);
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.02em;
  }

  .meta {
    margin: 0.25rem 0 0;
    font-size: 0.8125rem;
    font-variant-numeric: tabular-nums;
    color: var(--text-secondary);
  }

  .verdict {
    position: absolute;
    left: 0;
    bottom: 0;
    max-width: 24rem;
    padding: 1rem 1.125rem;
    background: var(--surface-1);
    border: 1px solid var(--hairline);
  }

  .verdict p {
    margin: 0 0 0.625rem;
    font-size: 0.875rem;
    line-height: 1.5;
    color: var(--text-secondary);
  }

  .verdict p:last-child {
    margin-bottom: 0;
  }

  .lede {
    font-size: 1.0625rem !important;
    color: var(--text-primary) !important;
    font-variant-numeric: tabular-nums;
  }

  .callback {
    color: var(--guess) !important;
  }

  .static p {
    line-height: 1.55;
    color: var(--text-secondary);
    margin: 0 0 1.25rem;
  }

  .lede-static {
    font-size: 1.0625rem;
    color: var(--text-primary) !important;
    font-variant-numeric: tabular-nums;
  }

  .callback-static {
    color: var(--guess) !important;
  }

  .ledger {
    margin-top: 2.5rem;
  }

  h3 {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--text-muted);
    margin: 0 0 0.75rem;
  }

  dl {
    margin: 0 0 1.25rem;
    border-top: 1px solid var(--hairline);
  }

  dl div {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem 1.5rem;
    padding: 0.75rem 0;
    border-bottom: 1px solid var(--hairline);
  }

  dt {
    flex: 0 0 8rem;
    font-size: 0.875rem;
    color: var(--text-secondary);
  }

  dd {
    flex: 1 1 14rem;
    margin: 0;
    font-size: 0.9375rem;
    font-variant-numeric: tabular-nums;
  }

  .note {
    display: block;
    margin-top: 0.2rem;
    font-size: 0.8125rem;
    line-height: 1.45;
    color: var(--text-secondary);
  }

  dd a {
    display: block;
    margin-top: 0.125rem;
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .reconcile {
    margin: 0;
    font-size: 0.8125rem;
    line-height: 1.55;
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
