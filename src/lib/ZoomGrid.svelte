<script>
  import { untrack } from 'svelte';
  import { COLUMNS, layoutFor, cellOrigin } from './grid.js';

  let {
    /** How many cells are filled. */
    count = 0,
    /** How many the box is sized for. Fixed while cells drain, so the grid
     *  does not resize under the reader mid-removal. */
    capacity = 0,
    /** Cell index the rule is drawn at. 0 draws no rule. */
    threshold = 0,
    label = ''
  } = $props();

  let container = $state(null);
  let canvas = $state(null);

  let ctx = null;
  let width = 0;
  let height = 0;
  let layout = { cols: COLUMNS, rows: 0, cell: 0, gap: 2 };
  let frame = null;
  let observer = null;

  /** Resolved once per resize. Reading these per cell would be a layout read
   *  per cell, and there are up to 1,320 of them. */
  let colorFill = '';
  let colorOver = '';
  let colorRule = '';
  let colorLabel = '';

  const GAP = 2;

  function readPalette() {
    const style = getComputedStyle(container);
    colorFill = style.getPropertyValue('--truth').trim();
    colorOver = style.getPropertyValue('--guess').trim();
    colorRule = style.getPropertyValue('--text-primary').trim();
    colorLabel = style.getPropertyValue('--text-secondary').trim();
  }

  function measure() {
    if (!canvas || !container) return;

    width = container.clientWidth;
    height = container.clientHeight;
    const ratio = window.devicePixelRatio || 1;

    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx = canvas.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.font = '11px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.textBaseline = 'alphabetic';

    layout = layoutFor(capacity, width, height, GAP);
    readPalette();
    draw();
  }

  /**
   * One pass, `count` iterations, nothing allocated. `cellOrigin` returns a
   * fresh object per cell, which is the one allocation left — it is a two-key
   * literal the engine reliably stack-allocates, and it keeps the geometry in
   * the tested module instead of inlined here.
   */
  function draw() {
    frame = null;
    if (!ctx || layout.cell <= 0) return;

    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < count; i++) {
      const { x, y } = cellOrigin(i, layout, height);
      ctx.fillStyle = threshold > 0 && i >= threshold ? colorOver : colorFill;
      ctx.fillRect(x, y, layout.cell, layout.cell);
    }

    // Dev only: lets browser verification read what was actually drawn.
    if (import.meta.env.DEV) window.__zoomCells = count;

    if (threshold > 0 && threshold <= capacity) {
      const pitch = layout.cell + layout.gap;
      const y = height - (threshold / layout.cols) * pitch + layout.gap / 2;

      ctx.fillStyle = colorRule;
      ctx.fillRect(0, y - 1, width, 2);

      if (label) {
        ctx.fillStyle = colorLabel;
        // Right-aligned: the acts put their captions over the left of the grid,
        // and a label drawn at x=0 disappears underneath them.
        ctx.textAlign = 'right';
        // Clamped so a rule near the top edge does not slice its own label.
        ctx.fillText(label, width, Math.max(y - 8, 11));
        ctx.textAlign = 'left';
      }
    }
  }

  function schedule() {
    if (frame === null) frame = requestAnimationFrame(draw);
  }

  $effect(() => {
    if (!container) return;

    observer = new ResizeObserver(() => untrack(measure));
    observer.observe(container);
    untrack(measure);

    return () => {
      observer.disconnect();
      observer = null;
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
    };
  });

  // Capacity changes the layout, so it needs a re-measure, not just a redraw.
  $effect(() => {
    capacity;
    untrack(measure);
  });

  $effect(() => {
    count;
    threshold;
    label;
    schedule();
  });
</script>

<div class="zoom-grid" bind:this={container}>
  <canvas bind:this={canvas} aria-hidden="true"></canvas>
</div>

<style>
  .zoom-grid {
    position: relative;
    width: 100%;
    height: 100%;
  }

  canvas {
    display: block;
  }
</style>
