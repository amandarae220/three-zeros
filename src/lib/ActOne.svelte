<script>
  import { humanDuration } from './time.js';
  import { durations } from '../data/durations.js';

  /** The figure is never typed. It comes from the module the tests pin. */
  const rungs = durations.map((entry) => ({
    ...entry,
    duration: humanDuration(entry.seconds)
  }));
</script>

<section id="act-one" class="act act-one" aria-labelledby="act-one-heading">
  <header>
    <h2 id="act-one-heading">Act I — Seconds</h2>
    <p class="prompt">
      You already know a billion is bigger. Here is the same three words in a unit your body
      has intuitions about.
    </p>
  </header>

  <ol class="rungs">
    {#each rungs as rung (rung.seconds)}
      <li>
        <p class="label">{rung.label}</p>
        <p class="figure">{rung.duration}</p>
        <p class="anchor">{rung.anchor}</p>
        {#if rung.claim}
          <p class="claim">
            {rung.claim}
            <a
              href={rung.source}
              rel="noreferrer"
              aria-label="Source for {rung.label}, as of {rung.asOf}"
            >
              Source · as of {rung.asOf}
            </a>
          </p>
        {/if}
      </li>
    {/each}
  </ol>

  <p class="close">
    Three words that arrive like first, second, third. Each one is a thousand of the last. Act
    II is the second step, at an honest rate, and you are not going to finish it.
  </p>
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

  .rungs {
    margin: 0 0 2rem;
    padding: 0;
    list-style: none;
    border-top: 1px solid var(--hairline);
  }

  .rungs li {
    padding: 1.25rem 0;
    border-bottom: 1px solid var(--hairline);
  }

  .label {
    margin: 0;
    font-size: 0.8125rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--text-muted);
  }

  .figure {
    margin: 0.25rem 0 0.5rem;
    font-size: clamp(1.5rem, 4vw, 2.25rem);
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.02em;
  }

  .anchor {
    margin: 0;
    font-size: 1rem;
    line-height: 1.5;
    color: var(--text-secondary);
  }

  .claim {
    margin: 0.5rem 0 0;
    font-size: 0.8125rem;
    line-height: 1.5;
    color: var(--text-muted);
  }

  .claim a {
    display: block;
    margin-top: 0.125rem;
    color: var(--text-muted);
  }

  .close {
    margin: 0;
    line-height: 1.55;
    color: var(--text-secondary);
  }
</style>
