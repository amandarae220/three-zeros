<script>
  import VirtualScroll from './VirtualScroll.svelte';
  import Ribbon from './Ribbon.svelte';
  import { JUMPS } from './jumps.js';
  import { referents } from '../data/referents.js';
  import {
    TRILLION,
    positionOf,
    dollarsAt,
    formatDollars,
    formatShort,
    secondsToComplete,
    formatDuration
  } from './scaleEngine.js';

  const MAX = positionOf(TRILLION);

  /** Past this, the readout has earned the line about not finishing. */
  const A_DAY = 86_400;

  /** A screen reader must not be flooded by a fast scroll. */
  const ANNOUNCE_MS = 800;

  const ladder = referents.map((r) => ({ ...r, position: positionOf(r.dollars) }));

  let position = $state(0);
  let speed = $state(0);
  let height = $state(0);

  /**
   * Standing still is not an estimate of "never" — it is the absence of one.
   * The readout holds the last real figure rather than flashing.
   */
  let heldDuration = $state(null);
  let futilityEarned = $state(false);

  const amount = $derived(formatDollars(dollarsAt(position)));
  const fraction = $derived(position / MAX);

  const secondsLeft = $derived(secondsToComplete(position, speed));

  const crossed = $derived(ladder.filter((r) => position >= r.position));
  const current = $derived(crossed.length ? crossed[crossed.length - 1] : null);
  const ladderCleared = $derived(crossed.length === ladder.length);

  $effect(() => {
    if (Number.isFinite(secondsLeft) && secondsLeft > 0) {
      heldDuration = formatDuration(secondsLeft);
      if (secondsLeft > A_DAY) futilityEarned = true;
    }
  });

  /**
   * The share of the ribbon covered. Computed, never written down — every
   * figure on the ladder sits inside the first millionth, and a hardcoded
   * percentage would be wrong the moment a referent changed.
   */
  function formatFraction(value) {
    const percent = value * 100;
    if (percent === 0) return '0%';
    return `${Number(percent.toPrecision(2))}%`;
  }

  let announcement = $state('');
  let lastAnnouncedAt = 0;
  let pending = null;
  let announceTimer = null;

  function announce(message) {
    const now = performance.now();
    const elapsed = now - lastAnnouncedAt;

    if (elapsed >= ANNOUNCE_MS) {
      announcement = message;
      lastAnnouncedAt = now;
      return;
    }

    pending = message;
    if (announceTimer !== null) return;

    announceTimer = setTimeout(() => {
      announceTimer = null;
      if (pending === null) return;
      announcement = pending;
      pending = null;
      lastAnnouncedAt = performance.now();
    }, ANNOUNCE_MS - elapsed);
  }

  let announcedCount = 0;

  $effect(() => {
    if (crossed.length === announcedCount) return;
    announcedCount = crossed.length;
    if (current) announce(`Passed ${current.label}, ${formatShort(current.dollars)}.`);
  });

  $effect(() => {
    return () => {
      if (announceTimer !== null) clearTimeout(announceTimer);
    };
  });

  function jumpTo(target) {
    position = target;
  }
</script>

<section class="act" aria-labelledby="act-two-heading">
  <header>
    <h2 id="act-two-heading">Act II — The Scroll</h2>
    <p class="prompt">
      One hundred dollars per pixel. The ribbon runs to a trillion. It is honest all the way
      down, which is the problem.
    </p>
  </header>

  <div class="stage" bind:clientHeight={height}>
    <VirtualScroll bind:position bind:speed {height}>
      <Ribbon {position} {height} />
    </VirtualScroll>

    <div class="readout">
      <p class="amount">{amount}</p>
      <p class="meta">
        {formatFraction(fraction)} of the way
        {#if heldDuration}
          · at this speed, {heldDuration} to go
        {/if}
      </p>
      {#if futilityEarned}
        <p class="futility">You are not expected to finish this.</p>
      {/if}
    </div>

    {#if current}
      <aside class="card">
        <p class="card-label">{current.label}</p>
        <p class="card-amount">{formatDollars(current.dollars)}</p>
        <p class="card-note">{current.note}</p>
        <a class="card-source" href={current.source} rel="noreferrer">Source · as of {current.asOf}</a>
      </aside>
    {/if}

    {#if ladderCleared}
      <p class="cleared">
        That was every sum on the ladder. You are {formatFraction(fraction)} of the way.
      </p>
    {/if}
  </div>

  <div class="controls">
    <p class="controls-label" id="jump-label">Jump ahead</p>
    <ul class="jumps" aria-labelledby="jump-label">
      {#each JUMPS as jump (jump.dollars)}
        <li>
          <button type="button" onclick={() => jumpTo(jump.position)}>{jump.label}</button>
        </li>
      {/each}
    </ul>
    <a class="skip" href="#act-three">Skip to Act III</a>
  </div>

  <p class="sr-only" role="status" aria-live="polite">{announcement}</p>

  <!-- The canvas is decoration. This is the content. -->
  <ol class="sr-only">
    {#each ladder as referent (referent.dollars)}
      <li>
        {referent.label}: {formatDollars(referent.dollars)}. {referent.note}
        <a href={referent.source} rel="noreferrer">Source, as of {referent.asOf}</a>
      </li>
    {/each}
  </ol>
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
    height: 70vh;
    min-height: 24rem;
    border-top: 1px solid var(--hairline);
    border-bottom: 1px solid var(--hairline);
    overflow: hidden;
  }

  .readout {
    position: absolute;
    top: 1rem;
    right: 1rem;
    text-align: right;
    pointer-events: none;
  }

  .amount {
    margin: 0;
    font-size: clamp(1.25rem, 3vw, 1.75rem);
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.02em;
  }

  .meta,
  .futility {
    margin: 0.25rem 0 0;
    font-size: 0.8125rem;
    color: var(--text-secondary);
  }

  .futility {
    color: var(--guess);
  }

  .card {
    position: absolute;
    left: 1rem;
    bottom: 1rem;
    max-width: 22rem;
    padding: 0.875rem 1rem;
    border: 1px solid var(--hairline);
    background: var(--surface-1);
  }

  .card-label {
    margin: 0;
    font-size: 0.875rem;
    color: var(--text-secondary);
  }

  .card-amount {
    margin: 0.125rem 0 0.5rem;
    font-size: 1.125rem;
    font-variant-numeric: tabular-nums;
  }

  .card-note {
    margin: 0 0 0.5rem;
    font-size: 0.8125rem;
    line-height: 1.45;
    color: var(--text-secondary);
  }

  .card-source {
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .cleared {
    position: absolute;
    left: 1rem;
    top: 1rem;
    max-width: 20rem;
    margin: 0;
    font-size: 0.875rem;
    line-height: 1.45;
    color: var(--text-secondary);
  }

  .controls {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
    margin-top: 1.25rem;
  }

  .controls-label {
    margin: 0;
    font-size: 0.8125rem;
    color: var(--text-muted);
  }

  .jumps {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  button {
    padding: 0.4rem 0.75rem;
    border: 1px solid var(--hairline);
    background: var(--surface-1);
    color: var(--text-primary);
    font: inherit;
    font-size: 0.8125rem;
    cursor: pointer;
  }

  button:hover {
    border-color: var(--rail);
  }

  button:focus-visible,
  .skip:focus-visible {
    outline: 2px solid var(--truth);
    outline-offset: 2px;
  }

  .skip {
    margin-left: auto;
    font-size: 0.8125rem;
    color: var(--truth);
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
