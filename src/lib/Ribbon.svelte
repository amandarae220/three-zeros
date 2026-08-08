<script>
  import { untrack } from 'svelte';
  import {
    MINOR_TICK_PX,
    MAJOR_TICK_PX,
    firstTickAtOrAfter,
    isMajor,
    tickLabel
  } from './ribbon.js';

  let { position = 0, height = 0 } = $props();

  let container = $state(null);
  let canvas = $state(null);

  let ctx = null;
  let width = 0;
  let frame = null;
  let observer = null;

  /**
   * Resolved once per resize, never per frame. The draw loop reads these as
   * plain strings — getComputedStyle inside the loop would be a layout read
   * per tick.
   */
  let colorMinor = '';
  let colorMajor = '';
  let colorLabel = '';

  const MINOR_LEN = 12;
  const MAJOR_LEN = 32;
  const LABEL_X = 42;

  function readPalette() {
    const style = getComputedStyle(container);
    colorMinor = style.getPropertyValue('--rail').trim();
    colorMajor = style.getPropertyValue('--text-secondary').trim();
    colorLabel = style.getPropertyValue('--text-muted').trim();
  }

  /**
   * Sizes the backing store to the device pixel ratio and scales the context
   * once. Every later draw works in CSS pixels.
   */
  function measure() {
    if (!canvas || !container) return;

    width = container.clientWidth;
    const ratio = window.devicePixelRatio || 1;

    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx = canvas.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.font = '11px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.textBaseline = 'alphabetic';

    readPalette();
    draw();
  }

  /**
   * Draws only the ticks inside [position, position + height] — at most
   * height / MINOR_TICK_PX + 1 iterations, the same count at $1M as at $1T.
   * No allocation here: no map, no array, no closure per tick.
   */
  function draw() {
    frame = null;
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    const end = position + height;
    let tick = firstTickAtOrAfter(position, MINOR_TICK_PX);

    while (tick <= end) {
      const y = tick - position;
      const major = isMajor(tick);

      ctx.fillStyle = major ? colorMajor : colorMinor;
      ctx.fillRect(0, y, major ? MAJOR_LEN : MINOR_LEN, major ? 2 : 1);

      if (major) {
        ctx.fillStyle = colorLabel;
        ctx.fillText(tickLabel(tick), LABEL_X, y + 4);
      }

      tick += MINOR_TICK_PX;
    }
  }

  /** Many input events, at most one draw per frame. */
  function schedule() {
    if (frame === null) frame = requestAnimationFrame(draw);
  }

  $effect(() => {
    if (!container) return;

    // untrack: this effect owns the observer's lifetime and must not re-subscribe
    // when a prop measure() happens to read changes.
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

  // A height change resizes the backing store; a redraw alone would stretch it.
  $effect(() => {
    height;
    untrack(measure);
  });

  $effect(() => {
    position;
    schedule();
  });
</script>

<div class="ribbon" bind:this={container}>
  <canvas bind:this={canvas} aria-hidden="true"></canvas>
</div>

<style>
  .ribbon {
    position: relative;
    width: 100%;
    height: 100%;
  }

  canvas {
    display: block;
  }
</style>
