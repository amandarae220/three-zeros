<script>
  import EstimateLine from '$lib/EstimateLine.svelte';
  import ActTwo from '$lib/ActTwo.svelte';
  import ActThree from '$lib/ActThree.svelte';

  // Held at page level — Act IV calls back to it.
  let readerGuess = $state(null);
</script>

<svelte:head>
  <title>Three Zeros</title>
  <meta
    name="description"
    content="A million, a billion, a trillion. We read them as a count. They are not."
  />
</svelte:head>

<main>
  <EstimateLine onCommit={(g) => (readerGuess = g)} />
  <ActTwo />
  <ActThree />
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
</style>
