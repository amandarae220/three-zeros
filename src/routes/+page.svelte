<script>
  import EstimateLine from '$lib/EstimateLine.svelte';
  import ActOne from '$lib/ActOne.svelte';
  import ActTwo from '$lib/ActTwo.svelte';
  import ActThree from '$lib/ActThree.svelte';
  import ActFour from '$lib/ActFour.svelte';
  import Coda from '$lib/Coda.svelte';
  import { timeline } from '$lib/../data/timeline.js';

  // Held at page level — Act IV calls back to it.
  let readerGuess = $state(null);

  /** The piece is dated at its last reading. Stated here and again in the coda. */
  const asOf = timeline[timeline.length - 1].asOf;
</script>

<svelte:head>
  <title>Three Zeros</title>
  <meta
    name="description"
    content="A million, a billion, a trillion. We read them as a count. They are not."
  />
</svelte:head>

<main>
  <!-- The document's only h1. Every act opens at h2 beneath it, and the coda's
       parts at h3, so the outline has a top and no gaps. -->
  <header class="masthead">
    <h1>Three Zeros</h1>
    <p class="standfirst">
      A million, a billion, a trillion. We read them as a count — first, second, third. Each
      one is a thousand of the last, and nobody can picture the gap.
    </p>
    <p class="dateline">
      The first trillionaire, and the fact that he isn't one anymore. Figures as of {asOf}.
    </p>
  </header>

  <EstimateLine onCommit={(g) => (readerGuess = g)} />
  <ActOne />
  <ActTwo />
  <ActThree />
  <ActFour {readerGuess} />
  <Coda />
</main>

<style>
  /* The piece's one palette. Every act reads these; no act redeclares them. */
  :global(:root) {
    color-scheme: light;
    --surface-1: #f9f9f7;
    --text-primary: #0b0b0b;
    --text-secondary: #52514e;
    --text-muted: #898781;
    --rail: #c3c2b7;
    --hairline: rgba(11, 11, 11, 0.1);
    --guess: #eb6834;
    --truth: #2a78d6;
  }

  @media (prefers-color-scheme: dark) {
    :global(:root:where(:not([data-theme='light']))) {
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

  :global(:root[data-theme='dark']) {
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

  :global(body) {
    margin: 0;
    background: var(--surface-1);
  }

  .masthead {
    max-width: 46rem;
    margin: 0 auto;
    padding: 5rem 1.25rem 1rem;
    font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
    color: var(--text-primary);
  }

  h1 {
    font-size: clamp(2.5rem, 8vw, 4.5rem);
    line-height: 1.02;
    letter-spacing: -0.04em;
    margin: 0 0 1rem;
  }

  .standfirst {
    max-width: 34rem;
    margin: 0 0 1rem;
    font-size: clamp(1.0625rem, 2.5vw, 1.25rem);
    line-height: 1.5;
    color: var(--text-secondary);
  }

  .dateline {
    margin: 0;
    font-size: 0.8125rem;
    line-height: 1.5;
    color: var(--text-muted);
  }
</style>
