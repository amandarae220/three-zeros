<script>
  import { clampPosition, pageDelta } from './jumps.js';
  import { createSpeedTracker } from './velocity.js';
  import { MINOR_TICK_PX } from './ribbon.js';
  import { TRILLION, positionOf, dollarsAt, formatShort } from './scaleEngine.js';

  let {
    position = $bindable(0),
    speed = $bindable(0),
    height = 0,
    children
  } = $props();

  const MAX = positionOf(TRILLION);

  /** Wheel lines and pages carry no pixel value of their own. */
  const LINE_HEIGHT = 16;

  /** Per-frame momentum decay, and the speed below which coasting stops. */
  const DECAY = 0.95;
  const MOMENTUM_FLOOR = 1;

  const tracker = createSpeedTracker();

  let container = $state(null);
  let dragging = $state(false);

  let lastY = 0;
  let velocity = 0;
  let momentumFrame = null;

  function now() {
    return performance.now();
  }

  /** The one place position changes. Every path feeds the speed tracker. */
  function applyDelta(delta) {
    const next = clampPosition(position + delta);
    const applied = next - position;
    position = next;
    tracker.record(applied, now());
    speed = tracker.speed(now());
  }

  function normalizeWheel(event) {
    if (event.deltaMode === 1) return event.deltaY * LINE_HEIGHT;
    if (event.deltaMode === 2) return event.deltaY * height;
    return event.deltaY;
  }

  /**
   * Capturing the wheel is what lets the ribbon outrun the document, but held
   * at either end the reader must get the page back — otherwise the act is a
   * roach motel with no way out but the skip link.
   */
  function onWheel(event) {
    const delta = normalizeWheel(event);
    const next = clampPosition(position + delta);

    if (next === position) return;

    event.preventDefault();
    applyDelta(next - position);
  }

  function stopMomentum() {
    if (momentumFrame !== null) cancelAnimationFrame(momentumFrame);
    momentumFrame = null;
    velocity = 0;
  }

  function coast() {
    velocity *= DECAY;

    if (Math.abs(velocity) < MOMENTUM_FLOOR) {
      stopMomentum();
      speed = tracker.speed(now());
      return;
    }

    const before = position;
    applyDelta(velocity);

    // Ran into an end — no point coasting against the clamp.
    if (position === before) {
      stopMomentum();
      return;
    }

    momentumFrame = requestAnimationFrame(coast);
  }

  function onPointerDown(event) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    stopMomentum();
    tracker.reset();
    dragging = true;
    lastY = event.clientY;
    container.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event) {
    if (!dragging) return;

    // Finger up drags the ribbon up, which moves the reader down it.
    const delta = lastY - event.clientY;
    lastY = event.clientY;
    velocity = delta;
    applyDelta(delta);
  }

  function onPointerUp(event) {
    if (!dragging) return;

    dragging = false;
    if (container.hasPointerCapture(event.pointerId)) {
      container.releasePointerCapture(event.pointerId);
    }

    if (Math.abs(velocity) >= MOMENTUM_FLOOR) {
      momentumFrame = requestAnimationFrame(coast);
    }
  }

  const KEYS = {
    ArrowDown: () => MINOR_TICK_PX,
    ArrowUp: () => -MINOR_TICK_PX,
    PageDown: () => pageDelta(height, 1),
    PageUp: () => pageDelta(height, -1),
    Home: () => -position,
    End: () => MAX - position
  };

  function onKeyDown(event) {
    const move = KEYS[event.key];
    if (!move) return;

    event.preventDefault();
    stopMomentum();
    applyDelta(move());
  }

  $effect(() => {
    if (!container) return;

    // Svelte cannot express { passive: false }, and without it preventDefault
    // on wheel is ignored.
    container.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', onWheel);
      stopMomentum();
    };
  });
</script>

<!--
  Owns `position` and never sets element height. That is the entire mechanism:
  the ribbon runs to 10,000,000,000px, roughly 298× past the ~33.5M px ceiling
  a real element could reach.
-->
<div
  class="capture"
  class:dragging
  bind:this={container}
  role="scrollbar"
  tabindex="0"
  aria-label="Distance along the ribbon"
  aria-controls="ribbon-content"
  aria-orientation="vertical"
  aria-valuemin={0}
  aria-valuemax={MAX}
  aria-valuenow={Math.round(position)}
  aria-valuetext={formatShort(dollarsAt(position))}
  onpointerdown={onPointerDown}
  onpointermove={onPointerMove}
  onpointerup={onPointerUp}
  onpointercancel={onPointerUp}
  onkeydown={onKeyDown}
>
  <div id="ribbon-content">
    {@render children?.()}
  </div>
</div>

<style>
  .capture {
    /* touch-action: none stops the browser scrolling the document as well. */
    touch-action: none;
    position: relative;
    width: 100%;
    height: 100%;
    cursor: grab;
  }

  .capture.dragging {
    cursor: grabbing;
  }

  .capture:focus-visible {
    outline: 2px solid var(--truth);
    outline-offset: 2px;
  }

  #ribbon-content {
    width: 100%;
    height: 100%;
  }
</style>
