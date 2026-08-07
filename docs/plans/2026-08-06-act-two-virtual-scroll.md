# Act II — The Scroll — Implementation Plan

**Goal:** A canvas ribbon at an honest $100 per pixel that runs from $0 to exactly $1 trillion, scrolled by a position value the app owns rather than by the document, with the futility of finishing stated on screen instead of left to feel like a broken page.

**Architecture:** Three pure modules carry all the math — tick geometry, speed tracking, and jump targets — each testable with no DOM. `VirtualScroll.svelte` captures wheel, touch, and keyboard and owns a single `position` number; it never sets element height, which is what lets the ribbon exceed the browser's ~33.5M px ceiling by 298×. `Ribbon.svelte` renders only the pixels currently on screen, so cost is O(viewport) and independent of how far in the reader is.

**Tech Stack:** SvelteKit 2 + `adapter-static`, Svelte 5 runes, Vite 8, Vitest 4. Canvas 2D. No new runtime dependencies.

## Global Constraints

- Everything in the Plan 1 Global Constraints still applies — `DOLLARS_PER_PIXEL = 100`, `TRILLION` imported never inlined, plain JS numbers, no BigInt, `git add` only.
- `MINOR_TICK_PX = 50` and `MAJOR_TICK_PX = 500` declared once in `ribbon.js`. At $100/px that is a tick every $5,000 and a labelled tick every $50,000.
- **Tick density never changes with depth.** The ribbon looks identical at $1M and at $1T. The monotony is the argument; do not add adaptive tick scaling.
- Position is clamped to `[0, positionOf(TRILLION)]` — 0 to 10,000,000,000.
- `Ribbon.svelte` must never allocate inside the draw loop. No `map`/`filter` per frame; iterate with a `for` loop.
- Canvas draw is `requestAnimationFrame`-coalesced: many input events, at most one draw per frame.
- The reader must be able to leave at all times. A skip link to Act III is in the DOM from the first frame and is never `display: none`.
- Act II must be completable-by-escape without a pointer: every jump target is a real `<button>` in the tab order.

---

### Task 1: `ribbon.js` — tick geometry

**Files:**
- Create: `src/lib/ribbon.js`
- Test: `src/lib/ribbon.test.js`

**Interfaces:**
- Consumes: `dollarsAt` from `scaleEngine.js`.
- Produces: `MINOR_TICK_PX`, `MAJOR_TICK_PX`, `firstTickAtOrAfter(position, spacing)`, `isMajor(tickPosition)`, `tickLabel(tickPosition)`.

The renderer needs to know, for a window starting at an arbitrary position, where the first tick falls — without walking from zero. That is one modulo, and it is the whole reason the ribbon is O(viewport).

- [ ] **Step 1: Write the failing test**

```javascript
import { describe, it, expect } from 'vitest';
import {
  MINOR_TICK_PX,
  MAJOR_TICK_PX,
  firstTickAtOrAfter,
  isMajor,
  tickLabel
} from './ribbon.js';

describe('tick spacing', () => {
  it('puts a minor tick every $5,000', () => {
    expect(MINOR_TICK_PX).toBe(50);
  });

  it('puts a major tick every $50,000', () => {
    expect(MAJOR_TICK_PX).toBe(500);
  });

  it('nests majors on minors', () => {
    expect(MAJOR_TICK_PX % MINOR_TICK_PX).toBe(0);
  });
});

describe('firstTickAtOrAfter', () => {
  it('returns the position itself when already on a tick', () => {
    expect(firstTickAtOrAfter(100, 50)).toBe(100);
  });

  it('rounds up to the next tick', () => {
    expect(firstTickAtOrAfter(101, 50)).toBe(150);
  });

  it('starts at zero from the origin', () => {
    expect(firstTickAtOrAfter(0, 50)).toBe(0);
  });

  it('works nine billion pixels in without walking there', () => {
    expect(firstTickAtOrAfter(9_000_000_001, 50)).toBe(9_000_000_050);
  });

  it('stays exact at the end', () => {
    expect(firstTickAtOrAfter(10_000_000_000, 500)).toBe(10_000_000_000);
  });
});

describe('isMajor', () => {
  it('marks every tenth minor tick', () => {
    expect(isMajor(0)).toBe(true);
    expect(isMajor(500)).toBe(true);
    expect(isMajor(550)).toBe(false);
  });

  it('holds deep into the ribbon', () => {
    expect(isMajor(9_000_000_500)).toBe(true);
    expect(isMajor(9_000_000_050)).toBe(false);
  });
});

describe('tickLabel', () => {
  it('labels the first major tick', () => {
    expect(tickLabel(500)).toBe('$50,000');
  });

  it('labels a million', () => {
    expect(tickLabel(10_000)).toBe('$1,000,000');
  });

  it('labels a billion', () => {
    expect(tickLabel(10_000_000)).toBe('$1,000,000,000');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/ribbon.test.js`
Expected: FAIL — `Failed to resolve import "./ribbon.js"`.

- [ ] **Step 3: Write minimal implementation**

```javascript
import { dollarsAt, formatDollars } from './scaleEngine.js';

/** A tick every $5,000. */
export const MINOR_TICK_PX = 50;

/** A labelled tick every $50,000. */
export const MAJOR_TICK_PX = 500;

/**
 * The first tick at or after `position`. One modulo, no walking — this is
 * what keeps rendering O(viewport) nine billion pixels in.
 */
export function firstTickAtOrAfter(position, spacing) {
  const remainder = position % spacing;
  return remainder === 0 ? position : position + (spacing - remainder);
}

export function isMajor(tickPosition) {
  return tickPosition % MAJOR_TICK_PX === 0;
}

export function tickLabel(tickPosition) {
  return formatDollars(dollarsAt(tickPosition));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/ribbon.test.js`
Expected: PASS, 13 tests.

- [ ] **Step 5: Stage**

```bash
git add src/lib/ribbon.js src/lib/ribbon.test.js
```

---

### Task 2: `velocity.js` — the speed tracker

**Files:**
- Create: `src/lib/velocity.js`
- Test: `src/lib/velocity.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces: `createSpeedTracker(windowMs?)` returning `{ record(deltaPx, nowMs), speed(nowMs), reset() }`.

This backs the "X to go at this speed" readout. It must be a rolling window, not an instantaneous delta, or the number flickers unreadably.

- [ ] **Step 1: Write the failing test**

```javascript
import { describe, it, expect } from 'vitest';
import { createSpeedTracker } from './velocity.js';

describe('createSpeedTracker', () => {
  it('reports zero before anything is recorded', () => {
    expect(createSpeedTracker().speed(0)).toBe(0);
  });

  it('reports pixels per second over the window', () => {
    const t = createSpeedTracker(500);
    t.record(100, 0);
    t.record(100, 100);
    t.record(100, 200);
    // 300px over 200ms.
    expect(t.speed(200)).toBeCloseTo(1500, 0);
  });

  it('drops samples older than the window', () => {
    const t = createSpeedTracker(500);
    t.record(10_000, 0);
    t.record(100, 900);
    t.record(100, 1000);
    // The 10,000px sample is outside the 500ms window and must not count.
    expect(t.speed(1000)).toBeLessThan(3000);
  });

  it('decays to zero once the reader stops', () => {
    const t = createSpeedTracker(500);
    t.record(1000, 0);
    expect(t.speed(2000)).toBe(0);
  });

  it('treats direction as speed, not velocity', () => {
    const t = createSpeedTracker(500);
    t.record(-300, 0);
    t.record(-300, 200);
    expect(t.speed(200)).toBeGreaterThan(0);
  });

  it('resets', () => {
    const t = createSpeedTracker(500);
    t.record(1000, 0);
    t.reset();
    expect(t.speed(0)).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/velocity.test.js`
Expected: FAIL — `Failed to resolve import "./velocity.js"`.

- [ ] **Step 3: Write minimal implementation**

```javascript
/**
 * Rolling-window speed in pixels per second. The readout needs a stable
 * number, so this averages over a window rather than reporting the last delta.
 */
export function createSpeedTracker(windowMs = 500) {
  let samples = [];

  function prune(nowMs) {
    const cutoff = nowMs - windowMs;
    while (samples.length && samples[0].at < cutoff) samples.shift();
  }

  return {
    record(deltaPx, nowMs) {
      samples.push({ px: Math.abs(deltaPx), at: nowMs });
      prune(nowMs);
    },
    speed(nowMs) {
      prune(nowMs);
      if (samples.length < 2) return 0;
      const elapsed = nowMs - samples[0].at;
      if (elapsed <= 0) return 0;
      let total = 0;
      for (let i = 0; i < samples.length; i++) total += samples[i].px;
      return (total / elapsed) * 1000;
    },
    reset() {
      samples = [];
    }
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/velocity.test.js`
Expected: PASS, 6 tests.

- [ ] **Step 5: Stage**

```bash
git add src/lib/velocity.js src/lib/velocity.test.js
```

---

### Task 3: `jumps.js` — the escape hatches

**Files:**
- Create: `src/lib/jumps.js`
- Test: `src/lib/jumps.test.js`

**Interfaces:**
- Consumes: `positionOf`, `TRILLION`, `formatShort` from `scaleEngine.js`.
- Produces: `JUMPS: Array<{ label, dollars, position }>`, `clampPosition(position)`, `pageDelta(viewportPx, direction)`.

- [ ] **Step 1: Write the failing test**

```javascript
import { describe, it, expect } from 'vitest';
import { JUMPS, clampPosition, pageDelta } from './jumps.js';
import { TRILLION, positionOf } from './scaleEngine.js';

describe('JUMPS', () => {
  it('offers a million, a billion, and the peak', () => {
    expect(JUMPS.map((j) => j.dollars)).toEqual([1e6, 1e9, TRILLION]);
  });

  it('gives each jump a resolved pixel position', () => {
    for (const jump of JUMPS) {
      expect(jump.position).toBe(positionOf(jump.dollars));
    }
  });

  it('labels each jump in words', () => {
    expect(JUMPS[1].label).toBe('$1 billion');
  });

  it('runs ascending', () => {
    const positions = JUMPS.map((j) => j.position);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });
});

describe('clampPosition', () => {
  it('holds at the origin', () => {
    expect(clampPosition(-500)).toBe(0);
  });

  it('holds at the end', () => {
    expect(clampPosition(99e12)).toBe(positionOf(TRILLION));
  });

  it('passes through the middle', () => {
    expect(clampPosition(12_345)).toBe(12_345);
  });
});

describe('pageDelta', () => {
  it('pages down by just under a viewport', () => {
    expect(pageDelta(1000, 1)).toBe(900);
  });

  it('pages up by the same amount', () => {
    expect(pageDelta(1000, -1)).toBe(-900);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/jumps.test.js`
Expected: FAIL — `Failed to resolve import "./jumps.js"`.

- [ ] **Step 3: Write minimal implementation**

```javascript
import { TRILLION, positionOf, formatShort } from './scaleEngine.js';

/** Always-visible escape hatches. The reader is never trapped in the ribbon. */
export const JUMPS = [1e6, 1e9, TRILLION].map((dollars) => ({
  dollars,
  label: formatShort(dollars),
  position: positionOf(dollars)
}));

const MAX_POSITION = positionOf(TRILLION);

export function clampPosition(position) {
  if (position < 0) return 0;
  if (position > MAX_POSITION) return MAX_POSITION;
  return position;
}

/** PageUp/PageDown move just under a viewport, keeping a line of overlap. */
export function pageDelta(viewportPx, direction) {
  return Math.round(viewportPx * 0.9) * direction;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/jumps.test.js`
Expected: PASS, 9 tests.

- [ ] **Step 5: Stage**

```bash
git add src/lib/jumps.js src/lib/jumps.test.js
```

---

### Task 4: `Ribbon.svelte` — the canvas renderer

**Files:**
- Create: `src/lib/Ribbon.svelte`

**Interfaces:**
- Consumes: `MINOR_TICK_PX`, `MAJOR_TICK_PX`, `firstTickAtOrAfter`, `isMajor`, `tickLabel` from `ribbon.js`.
- Produces: `<Ribbon {position} {height} />` — a canvas drawing the window `[position, position + height]`.

Requirements:

- Canvas sized to `clientWidth × height` in CSS pixels, backing store scaled by `devicePixelRatio`, context scaled once on resize — never per frame.
- Draw loop: compute `firstTickAtOrAfter(position, MINOR_TICK_PX)`, then walk by `MINOR_TICK_PX` until past `position + height`. That is at most `height / 50 + 1` iterations — about 22 at 1080px, identical at $1M and at $1T.
- Minor tick: 1px hairline, 12px long, muted ink. Major tick: 2px, 32px long, secondary ink, with `tickLabel()` drawn beside it in 11px system sans, `tabular-nums`.
- **No allocation in the loop.** No array building, no `map`. Colours resolved once per resize into module-scope consts read from CSS custom properties via `getComputedStyle`.
- Redraw only on `position` change or resize, coalesced through one `requestAnimationFrame`; a pending frame is not re-scheduled.
- `ResizeObserver` on the container drives re-measure; disconnect on destroy.
- The canvas carries `aria-hidden="true"`. It is decoration — Task 5 supplies the accessible content.
- Light and dark: colours read from the same custom properties Act 0 defines, so one palette serves both acts.

- [ ] **Step 1: Write the component per the requirements above**

Core of the draw function, which the rest of the component is built around:

```javascript
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
    ctx.fillRect(0, y, major ? 32 : 12, major ? 2 : 1);

    if (major) {
      ctx.fillStyle = colorLabel;
      ctx.fillText(tickLabel(tick), 42, y + 4);
    }

    tick += MINOR_TICK_PX;
  }
}

function schedule() {
  if (frame === null) frame = requestAnimationFrame(draw);
}
```

- [ ] **Step 2: Verify the loop is bounded**

Run: `npm run dev`, then in the browser console with the ribbon mounted at position 0 and again at 9_000_000_000, confirm the tick loop runs the same number of iterations. Instrument temporarily with a counter; remove the instrumentation before staging.

Expected: identical iteration counts at both positions — around 22 at a 1080px viewport.

- [ ] **Step 3: Stage**

```bash
git add src/lib/Ribbon.svelte
```

---

### Task 5: `VirtualScroll.svelte` — input capture

**Files:**
- Create: `src/lib/VirtualScroll.svelte`

**Interfaces:**
- Consumes: `clampPosition`, `pageDelta` from `jumps.js`; `createSpeedTracker` from `velocity.js`.
- Produces: `<VirtualScroll bind:position bind:speed {height}>{@render children()}</VirtualScroll>`.

Requirements:

- Owns `position`. **Never sets element height.** This is the whole mechanism — assert it in review.
- Wheel: `preventDefault`, normalise `deltaMode` (0 = px as-is, 1 = lines × 16, 2 = pages × viewport height), add to position, clamp. Listener registered with `{ passive: false }`.
- Touch: `pointerdown`/`pointermove`/`pointerup` with `setPointerCapture`; drag moves position inversely to finger travel. On release, apply momentum — decay velocity by a factor per frame until under 1px/frame, cancelled by any new pointerdown.
- Keyboard, on a focusable container with `role="scrollbar"`-equivalent semantics: Arrow Up/Down ±`MINOR_TICK_PX`, PageUp/PageDown via `pageDelta`, Home → 0, End → a trillion.
- Every position change feeds the speed tracker.
- `touch-action: none` on the capture element so the browser does not also scroll.
- **Wheel capture must not trap the page.** When position is already clamped at 0 and the reader scrolls up, do not `preventDefault` — let the document scroll back to Act 0. Same at the peak scrolling down. Without this the act is a roach motel.

- [ ] **Step 1: Write the component per the requirements above**

The clamp-release rule, which is the subtle part:

```javascript
function onWheel(event) {
  const delta = normalizeWheel(event);
  const next = clampPosition(position + delta);

  // At an end and still pushing outward — release the page.
  if (next === position && (position === 0 || next === MAX)) return;

  event.preventDefault();
  applyDelta(next - position);
}
```

- [ ] **Step 2: Stage**

```bash
git add src/lib/VirtualScroll.svelte
```

---

### Task 6: `ActTwo.svelte` — assembly

**Files:**
- Create: `src/lib/ActTwo.svelte`
- Modify: `src/routes/+page.svelte`

**Interfaces:**
- Consumes: `VirtualScroll`, `Ribbon`, `JUMPS`, `referents`, `secondsToComplete`, `formatDuration`, `formatDollars`, `dollarsAt`.
- Produces: `<ActTwo />`.

Requirements:

- Sticky readout: current amount via `formatDollars(dollarsAt(position))`, and `formatDuration(secondsToComplete(position, speed))` — rendered as "at this speed, 39 days to go". When speed is 0 the readout holds its last non-zero value rather than flashing "never".
- Referent cards: as position passes `positionOf(r.dollars)` for each of the four referents, its card appears with label, `formatDollars`, note, and source link. All four are cleared within roughly the first 16,000px — about five seconds — and the act says so once they are all behind: "That was every sum on the ladder. You are 0.001% of the way."
- Jump buttons from `JUMPS`, plus a skip link to Act III. Real buttons, in the tab order, visible from the first frame.
- `aria-live="polite"` region announcing referent crossings, throttled to at most one announcement per 800ms so a fast scroll cannot flood a screen reader.
- Visually-hidden `<ol>` listing all four referents with amounts and sources, so the canvas is never the sole source of content.
- The futility line is stated, not implied: when the readout first exceeds 24 hours, show "You are not expected to finish this."

- [ ] **Step 1: Write the component per the requirements above**
- [ ] **Step 2: Wire into `+page.svelte` below `EstimateLine`**
- [ ] **Step 3: Stage**

```bash
git add src/lib/ActTwo.svelte src/routes/+page.svelte
```

---

### Task 7: The reduced-motion path

**Files:**
- Modify: `src/lib/ActTwo.svelte`

**Interfaces:**
- Consumes: `window.matchMedia('(prefers-reduced-motion: reduce)')`.
- Produces: a static branch of `ActTwo` carrying identical content.

A hijacked, momentum-driven, effectively endless scroll is the exact thing `prefers-reduced-motion` exists to protect people from. The static path is not a degraded fallback — it carries the same argument in prose and a table.

Requirements:

- Query `matchMedia` on mount, and subscribe to changes.
- When reduced motion is on, render no canvas and no input capture. Instead: the three headline amounts ($1M, $1B, $1T), their pixel distances, their durations at 3,000 px/sec, the four referents as a real table with sources, and the futility stated directly.
- The `matchMedia` subscription is removed on destroy.
- Both paths must expose the same referent content to assistive technology.

- [ ] **Step 1: Write the branch**
- [ ] **Step 2: Verify with devtools emulation that no canvas element is present**
- [ ] **Step 3: Stage**

```bash
git add src/lib/ActTwo.svelte
```

---

### Task 8: Browser verification

**Files:**
- Modify: `scratchpad/verify/check.mjs` (not in the repo — see the note in Plan 1's handoff)

Add checks. Each is a claim about Act II that would otherwise be an assertion I make in prose:

- [ ] **Step 1: Add the checks**

1. No element in the document has a height above 33,554,428px — proves the ceiling is not being approached.
2. Wheeling 5,000px moves the readout by exactly $500,000.
3. The tick loop draws the same number of ticks at position 0 and at 9,000,000,000 (read via an instrumented counter exposed on `window` in dev only).
4. Wheeling up at position 0 does **not** call `preventDefault` — the document scrolls instead.
5. Jump to $1 billion lands the readout on exactly `$1,000,000,000`.
6. End jumps to exactly `$1,000,000,000,000`.
7. All four referent cards have appeared by position 16,000.
8. The `aria-live` region fires at most once per 800ms during a fast scroll.
9. Under `prefers-reduced-motion: reduce` there is no `<canvas>` in the document, and all four referents are still present as text.
10. The skip link to Act III is focusable within two Tab presses from the top of Act II.
11. No horizontal overflow at 320px with the ribbon mounted.
12. Frame time stays under 16ms across a 2,000px wheel sweep.

- [ ] **Step 2: Run the suite**

Run: `node check.mjs`
Expected: all Plan 1 checks plus all 12 above, passing.

---

## Self-Review

**Spec coverage:**

| Spec requirement | Task |
|---|---|
| Canvas ribbon at honest $100/px | 1, 4 |
| Position owned by app, element height never set | 5 |
| O(viewport) rendering independent of depth | 1, 4, 8 (check 3) |
| devicePixelRatio-aware, coalesced rAF, no per-frame allocation | 4 |
| Time-to-completion readout | 2, 6 |
| Referents appear as the ribbon passes them | 6 |
| Escape hatches always visible | 3, 6 |
| Throttled `aria-live` on crossings | 6, 8 (check 8) |
| Visually-hidden referent list | 6 |
| Full keyboard mapping incl. Home/End | 5, 8 (checks 5, 6) |
| Skip link present from the first frame | 6, 8 (check 10) |
| Reduced-motion static path | 7, 8 (check 9) |
| Futility stated, not implied | 6 |
| No focus trap / no scroll roach motel | 5, 8 (check 4) |

**Deferred to Plan 3:** Acts I, III, IV, the coda, and the site-wide WCAG audit.

**Known soft spots:**

1. **Tasks 4–7 specify components by requirement rather than by full source**, same tradeoff as Plan 1 Task 7 and for the same reason — the pure logic underneath is fully specified and tested in Tasks 1–3, and the components are plumbing over it. Task 8's twelve checks are the acceptance criteria.
2. **Momentum tuning is empirical.** The decay factor cannot be derived; it gets set against a real touch device and adjusted by feel. Flagged rather than invented.
3. **Check 12 (frame time) may be flaky on a loaded machine.** If it proves unstable, it becomes a reported measurement rather than a pass/fail gate.
