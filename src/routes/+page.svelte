<script>
  import EstimateLine from '$lib/EstimateLine.svelte';

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
</main>

<style>
  :global(body) {
    margin: 0;
    background: #f9f9f7;
  }

  @media (prefers-color-scheme: dark) {
    :global(body) {
      background: #0d0d0d;
    }
  }
</style>
