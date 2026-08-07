<script>
  import { ACT_ZERO, formatDollars, formatShort } from './scaleEngine.js';
  import { guessError } from './actZero.js';

  let { onCommit } = $props();

  let track = $state(null);
  let guess = $state(0);
  /**
   * No marker until the reader places one. A pre-placed marker at the midpoint
   * would suggest the very answer this act is measuring — the reveal has to
   * observe the misconception, not manufacture it.
   */
  let placed = $state(false);
  let committed = $state(false);
  let dragging = $state(false);
  let revealed = $state(false);

  const result = $derived(guessError(guess));

  /** Percent, rounded for display. The raw fraction stays full precision. */
  const guessPercent = $derived(Math.round(guess * 1000) / 10);

  /** Keeps edge labels from overflowing the track. */
  function edgeClass(fraction) {
    if (fraction < 0.12) return 'at-start';
    if (fraction > 0.88) return 'at-end';
    return '';
  }

  function fractionFromEvent(event) {
    if (!track) return guess;
    const rect = track.getBoundingClientRect();
    const raw = (event.clientX - rect.left) / rect.width;
    return Math.min(1, Math.max(0, raw));
  }

  function startDrag(event) {
    if (committed) return;
    dragging = true;
    placed = true;
    track.setPointerCapture(event.pointerId);
    guess = fractionFromEvent(event);
  }

  function moveDrag(event) {
    if (!dragging || committed) return;
    guess = fractionFromEvent(event);
  }

  function endDrag(event) {
    if (!dragging) return;
    dragging = false;
    if (track.hasPointerCapture(event.pointerId)) {
      track.releasePointerCapture(event.pointerId);
    }
  }

  function nudge(delta) {
    guess = Math.min(1, Math.max(0, guess + delta));
  }

  function onKeydown(event) {
    if (committed) return;
    const step = event.shiftKey ? 0.1 : 0.01;
    const arrow = ['ArrowRight', 'ArrowUp', 'ArrowLeft', 'ArrowDown'].includes(event.key);

    // First keypress places the marker at the left endpoint rather than the
    // middle, for the same reason the pointer path starts empty.
    if (arrow && !placed) {
      placed = true;
      guess = 0;
      event.preventDefault();
      return;
    }

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        nudge(step);
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        nudge(-step);
        break;
      case 'Home':
        placed = true;
        guess = 0;
        break;
      case 'End':
        placed = true;
        guess = 1;
        break;
      case 'Enter':
      case ' ':
        if (placed) commit();
        break;
      default:
        return;
    }
    event.preventDefault();
  }

  function commit() {
    if (committed || !placed) return;
    committed = true;
    onCommit?.(guess);
    // Let the truth marker mount at the guess position, then transition it.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        revealed = true;
      });
    });
  }

  function reset() {
    committed = false;
    revealed = false;
    placed = false;
    guess = 0;
  }
</script>

<section class="act" aria-labelledby="act-zero-heading">
  <h2 id="act-zero-heading">Where does a billion go?</h2>

  <p class="prompt">
    This line runs from a million to a trillion. Click anywhere on it to mark
    where you think a billion belongs.
  </p>

  <div class="chart">
    <div class="endpoints" aria-hidden="true">
      <span class="endpoint">
        <span class="endpoint-name">a million</span>
        <span class="endpoint-digits">{formatDollars(ACT_ZERO.min)}</span>
      </span>
      <span class="endpoint endpoint-right">
        <span class="endpoint-name">a trillion</span>
        <span class="endpoint-digits">{formatDollars(ACT_ZERO.max)}</span>
      </span>
    </div>

    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div
      class="track"
      class:committed
      bind:this={track}
      role="slider"
      tabindex={committed ? -1 : 0}
      aria-valuemin="0"
      aria-valuemax="100"
      aria-valuenow={placed ? guessPercent : 0}
      aria-valuetext={placed
        ? `${guessPercent}% along — ${formatShort(result.guessedDollars)}`
        : 'No marker placed. Press an arrow key to place one.'}
      aria-label="Where a billion belongs between a million and a trillion"
      aria-disabled={committed}
      onpointerdown={startDrag}
      onpointermove={moveDrag}
      onpointerup={endDrag}
      onpointercancel={endDrag}
      onkeydown={onKeydown}
    >
      <div class="rail"></div>

      {#if committed}
        <div
          class="span"
          style="left: {Math.min(guess, result.actualFraction) * 100}%;
                 width: {revealed ? result.travel * 100 : 0}%"
        ></div>
      {/if}

      {#if placed}
        <div
          class="marker marker-guess {edgeClass(guess)}"
          style="left: {guess * 100}%"
        >
          <span class="marker-dot"></span>
          <span class="marker-label">{committed ? 'your guess' : 'your mark'}</span>
        </div>
      {:else}
        <p class="track-hint" aria-hidden="true">click anywhere on this line</p>
      {/if}

      {#if committed}
        <div
          class="marker marker-truth {edgeClass(revealed ? result.actualFraction : guess)}"
          style="left: {(revealed ? result.actualFraction : guess) * 100}%"
        >
          <span class="marker-dot"></span>
          <span class="marker-label">a billion</span>
        </div>
      {/if}
    </div>
  </div>

  {#if !committed}
    <button class="commit" onclick={commit} disabled={!placed}>Lock it in</button>
  {/if}

  <div class="reveal" aria-live="polite">
    {#if committed}
      <p class="reveal-lead">
        You pointed at <strong>{formatShort(result.guessedDollars)}</strong>. A billion
        is {Math.round(result.timesTooLarge)} times less than that.
      </p>
      <p>
        It sits {result.actualFraction * 100 < 0.1
          ? 'a tenth of a percent'
          : `${(result.actualFraction * 100).toFixed(1)}%`} of the way along — close
        enough to the left edge that on a line this wide, it lands under a single
        pixel. Your marker travelled {Math.round(result.travel * 100)}% of the line
        to get to the truth.
      </p>
      <p>
        Nearly everyone does this. Thousand, million, billion, trillion arrive like
        counting — first, second, third, fourth. Each one is a thousand times the
        last.
      </p>
      <p class="footnote">
        Measured in <a
          href="https://onlinelibrary.wiley.com/doi/full/10.1111/cogs.12028"
          rel="noreferrer">Landy, Silbert &amp; Goldin, <cite>Estimating Large Numbers</cite></a
        > (Cognitive Science, 2013): people place these values as though the number
        words were a uniformly spaced count list.
      </p>
      <button class="again" onclick={reset}>Try it again</button>
    {/if}
  </div>
</section>

<style>
  .act {
    color-scheme: light;
    --surface-1: #f9f9f7;
    --text-primary: #0b0b0b;
    --text-secondary: #52514e;
    --text-muted: #898781;
    --rail: #c3c2b7;
    --hairline: rgba(11, 11, 11, 0.1);
    --guess: #eb6834;
    --truth: #2a78d6;

    max-width: 46rem;
    margin: 0 auto;
    padding: 3rem 1.25rem 4rem;
    font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
    color: var(--text-primary);
  }

  @media (prefers-color-scheme: dark) {
    :root:where(:not([data-theme='light'])) .act {
      color-scheme: dark;
      --surface-1: #0d0d0d;
      --text-primary: #ffffff;
      --text-secondary: #c3c2b7;
      --text-muted: #898781;
      --rail: #383835;
      --hairline: rgba(255, 255, 255, 0.1);
      --guess: #d95926;
      --truth: #3987e5;
    }
  }

  :root[data-theme='dark'] .act {
    color-scheme: dark;
    --surface-1: #0d0d0d;
    --text-primary: #ffffff;
    --text-secondary: #c3c2b7;
    --text-muted: #898781;
    --rail: #383835;
    --hairline: rgba(255, 255, 255, 0.1);
    --guess: #d95926;
    --truth: #3987e5;
  }

  h2 {
    font-size: clamp(1.5rem, 4vw, 2rem);
    line-height: 1.15;
    margin: 0 0 0.75rem;
    letter-spacing: -0.02em;
  }

  .prompt {
    color: var(--text-secondary);
    font-size: 1.05rem;
    line-height: 1.5;
    margin: 0 0 3.5rem;
    max-width: 34rem;
  }

  .chart {
    margin-bottom: 2rem;
  }

  .endpoints {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 0.75rem;
  }

  .endpoint {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    font-size: 0.8125rem;
  }

  .endpoint-right {
    text-align: right;
  }

  .endpoint-name {
    color: var(--text-secondary);
  }

  .endpoint-digits {
    color: var(--text-muted);
    font-variant-numeric: tabular-nums;
    font-size: 0.75rem;
    white-space: nowrap;
  }

  .track {
    position: relative;
    height: 4.5rem;
    cursor: grab;
    touch-action: none;
    border-radius: 4px;
  }

  .track.committed {
    cursor: default;
  }

  .track:focus-visible {
    outline: 2px solid var(--truth);
    outline-offset: 6px;
  }

  .rail {
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 2px;
    margin-top: -1px;
    background: var(--rail);
    border-radius: 1px;
  }

  .span {
    position: absolute;
    top: 50%;
    height: 2px;
    margin-top: -1px;
    background: var(--guess);
    opacity: 0.45;
    transition: width 900ms cubic-bezier(0.22, 1, 0.36, 1);
  }

  .marker {
    position: absolute;
    top: 50%;
    width: 0;
  }

  .marker-dot {
    position: absolute;
    left: 0;
    top: 0;
    width: 14px;
    height: 14px;
    margin: -7px 0 0 -7px;
    border-radius: 50%;
    box-shadow: 0 0 0 2px var(--surface-1);
  }

  .marker-label {
    position: absolute;
    left: 0;
    transform: translateX(-50%);
    white-space: nowrap;
    font-size: 0.75rem;
    color: var(--text-secondary);
  }

  /* Near the ends the centered label would run off the track. */
  .marker.at-start .marker-label {
    transform: translateX(-7px);
  }

  .marker.at-end .marker-label {
    transform: translateX(-100%) translateX(7px);
  }

  .marker-guess .marker-dot {
    background: var(--guess);
  }

  .marker-guess .marker-label {
    top: 14px;
  }

  .marker-truth .marker-dot {
    background: var(--truth);
  }

  .marker-truth {
    transition: left 900ms cubic-bezier(0.22, 1, 0.36, 1);
  }

  .marker-truth .marker-label {
    bottom: 14px;
    color: var(--truth);
    font-weight: 600;
  }

  .track-hint {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, 14px);
    margin: 0;
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  button {
    font: inherit;
    font-size: 0.9375rem;
    padding: 0.55rem 1.1rem;
    border-radius: 6px;
    border: 1px solid var(--hairline);
    background: transparent;
    color: var(--text-primary);
    cursor: pointer;
  }

  button:hover:not(:disabled) {
    border-color: var(--text-muted);
  }

  button:disabled {
    color: var(--text-muted);
    cursor: not-allowed;
    opacity: 0.6;
  }

  button:focus-visible {
    outline: 2px solid var(--truth);
    outline-offset: 2px;
  }

  .reveal {
    margin-top: 2rem;
    max-width: 34rem;
  }

  .reveal p {
    color: var(--text-secondary);
    line-height: 1.55;
    margin: 0 0 1rem;
  }

  .reveal-lead {
    color: var(--text-primary) !important;
    font-size: 1.125rem;
  }

  .reveal strong {
    font-weight: 600;
  }

  .footnote {
    font-size: 0.8125rem;
    color: var(--text-muted) !important;
    margin-bottom: 1.5rem !important;
  }

  .footnote a {
    color: inherit;
  }

  @media (prefers-reduced-motion: reduce) {
    .span,
    .marker-truth {
      transition: none;
    }
  }

  @media (max-width: 32rem) {
    .endpoint-digits {
      font-size: 0.6875rem;
    }
  }
</style>
