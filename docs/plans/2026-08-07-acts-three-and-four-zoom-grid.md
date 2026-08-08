# Acts III & IV — The Zoom Grid — Implementation Plan

**Goal:** The only two acts where a trillion fits on one screen — Act III resolves the scale as area by nesting $1M squares into a billion and then a trillion, and Act IV removes July's $363 billion from that same grid, live, so the loss is finally something the reader can see.

**Architecture:** One pure module, `grid.js`, owns every number: how many cells an amount is worth, how they lay out in a viewport, where each one sits, and how many remain part-way through a removal. `ZoomGrid.svelte` is a canvas renderer that draws a count of cells and nothing else — it has no idea which act it is in. `ActThree.svelte` and `ActFour.svelte` are step sequencers over that one renderer, driven by `IntersectionObserver` against a sticky stage, so the page scrolls natively and neither act touches the scrollbar.

**Tech Stack:** SvelteKit 2 + `adapter-static`, Svelte 5 runes, Vite 8, Vitest 4. Canvas 2D. No new runtime dependencies — no d3, no scrollama. Act II proved the canvas-plus-pure-module split; these acts reuse it.

## Global Constraints

- Everything in Plan 1 and Plan 2's Global Constraints still applies — plain JS numbers, no BigInt, no number in a component that is not imported from `src/lib/` or `src/data/`, every data record carrying `source` and `asOf`, WCAG 2.1 AA, **`git add` only, never commit.**
- `SQUARE_DOLLARS = 1_000_000` and `CELL_DOLLARS = 1_000_000_000` declared once in `grid.js`. Never inlined.
- `COLUMNS = 40` for every grid in both acts. This is load-bearing, not cosmetic: 1,000 cells is exactly 25 rows, so the trillion threshold is always a clean horizontal line with no partial row.
- The threshold line is drawn at `TRILLION_CELLS = 1000` in the trillion grid. Above it is above a trillion — that is the whole visual argument of Act III's ending.
- Cells fill **bottom-up**, row by row. A quantity growing upward against a fixed line is the only orientation in which "above the line" means anything.
- `ZoomGrid.svelte` must not allocate inside the draw loop, same rule as `Ribbon.svelte`. Iterate with a `for` loop, resolve colours once per resize.
- Neither act may capture wheel, touch, or keyboard scrolling. Act II owns the only hijacked scroll in the piece; these acts scroll natively.
- Both acts need a reduced-motion path carrying identical content, per Plan 2 Task 7's precedent.
- Act IV consumes Act 0's retained guess. If the reader skipped Act 0, Act IV must render without it rather than assuming it exists.

---

### Task 1: `grid.js` — cell counts and layout

**Files:**
- Create: `src/lib/grid.js`
- Test: `src/lib/grid.test.js`

**Interfaces:**
- Consumes: `TRILLION` from `scaleEngine.js`.
- Produces: `SQUARE_DOLLARS`, `CELL_DOLLARS`, `COLUMNS`, `TRILLION_CELLS`, `cellsFor(dollars, perCell)`, `rowsFor(count)`, `layoutFor(count, width, height, gap)`, `cellOrigin(index, layout, height)`.

The renderer needs to know how big a cell can be and where each one goes, for any count in any viewport, without measuring anything itself.

- [ ] **Step 1: Write the failing test**

```javascript
import { describe, it, expect } from 'vitest';
import {
  SQUARE_DOLLARS,
  CELL_DOLLARS,
  COLUMNS,
  TRILLION_CELLS,
  cellsFor,
  rowsFor,
  layoutFor,
  cellOrigin
} from './grid.js';
import { TRILLION } from './scaleEngine.js';

describe('constants', () => {
  it('makes one square a million dollars', () => {
    expect(SQUARE_DOLLARS).toBe(1_000_000);
  });

  it('makes one cell a billion dollars', () => {
    expect(CELL_DOLLARS).toBe(1_000_000_000);
  });

  it('nests a thousand squares in a cell', () => {
    expect(CELL_DOLLARS / SQUARE_DOLLARS).toBe(1000);
  });

  it('puts a trillion at a thousand cells', () => {
    expect(TRILLION_CELLS).toBe(1000);
    expect(cellsFor(TRILLION, CELL_DOLLARS)).toBe(TRILLION_CELLS);
  });

  it('divides the trillion threshold into whole rows', () => {
    expect(TRILLION_CELLS % COLUMNS).toBe(0);
  });
});

describe('cellsFor', () => {
  it('counts a billion as one cell', () => {
    expect(cellsFor(1e9, CELL_DOLLARS)).toBe(1);
  });

  it('counts the peak as more than a trillion', () => {
    expect(cellsFor(1_320_000_000_000, CELL_DOLLARS)).toBe(1320);
  });

  it('counts July\'s loss', () => {
    expect(cellsFor(363_000_000_000, CELL_DOLLARS)).toBe(363);
  });

  it('rounds to the nearest whole cell', () => {
    expect(cellsFor(725_900_000_000, CELL_DOLLARS)).toBe(726);
  });

  it('never goes negative', () => {
    expect(cellsFor(-5e9, CELL_DOLLARS)).toBe(0);
  });
});

describe('rowsFor', () => {
  it('fills exactly twenty-five rows at a trillion', () => {
    expect(rowsFor(TRILLION_CELLS)).toBe(25);
  });

  it('starts a new row for one cell over', () => {
    expect(rowsFor(TRILLION_CELLS + 1)).toBe(26);
  });

  it('has no rows at zero', () => {
    expect(rowsFor(0)).toBe(0);
  });
});

describe('layoutFor', () => {
  it('sizes cells to fit the viewport', () => {
    const layout = layoutFor(TRILLION_CELLS, 800, 600, 2);
    expect(layout.cols).toBe(COLUMNS);
    expect(layout.rows).toBe(25);
    expect(layout.cell).toBeGreaterThan(0);
    expect(layout.cols * layout.cell + (layout.cols - 1) * layout.gap).toBeLessThanOrEqual(800);
    expect(layout.rows * layout.cell + (layout.rows - 1) * layout.gap).toBeLessThanOrEqual(600);
  });

  it('shrinks cells when the count grows', () => {
    const thousand = layoutFor(1000, 800, 600, 2);
    const peak = layoutFor(1320, 800, 600, 2);
    expect(peak.cell).toBeLessThan(thousand.cell);
  });

  it('holds the same geometry for both grids', () => {
    // A thousand $1M squares and a thousand $1B cells are drawn identically.
    // Only the label changes, which is the entire trick of the act.
    expect(layoutFor(1000, 800, 600, 2)).toEqual(layoutFor(1000, 800, 600, 2));
  });

  it('degrades to nothing rather than NaN', () => {
    expect(layoutFor(0, 800, 600, 2).cell).toBe(0);
    expect(layoutFor(1000, 0, 0, 2).cell).toBe(0);
  });
});

describe('cellOrigin', () => {
  const layout = { cols: COLUMNS, rows: 25, cell: 10, gap: 2 };
  const HEIGHT = 25 * 12;

  it('puts the first cell at the bottom left', () => {
    const { x, y } = cellOrigin(0, layout, HEIGHT);
    expect(x).toBe(0);
    expect(y).toBe(HEIGHT - layout.cell);
  });

  it('walks along the bottom row first', () => {
    expect(cellOrigin(1, layout, HEIGHT).x).toBe(12);
    expect(cellOrigin(1, layout, HEIGHT).y).toBe(cellOrigin(0, layout, HEIGHT).y);
  });

  it('starts the next row above, not below', () => {
    const first = cellOrigin(0, layout, HEIGHT);
    const second = cellOrigin(COLUMNS, layout, HEIGHT);
    expect(second.x).toBe(0);
    expect(second.y).toBeLessThan(first.y);
  });

  it('puts the trillionth cell on the top row of a trillion grid', () => {
    const last = cellOrigin(TRILLION_CELLS - 1, layout, HEIGHT);
    expect(last.y).toBe(HEIGHT - 25 * 12);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/grid.test.js`
Expected: FAIL — `Failed to resolve import "./grid.js"`.

- [ ] **Step 3: Write minimal implementation**

```javascript
import { TRILLION } from './scaleEngine.js';

/** One filled square in Act III's first grid. */
export const SQUARE_DOLLARS = 1_000_000;

/** One filled cell once the screen has collapsed to a dot. */
export const CELL_DOLLARS = 1_000_000_000;

/**
 * Fixed for every grid in both acts. 1,000 cells is exactly 25 rows, so the
 * trillion threshold is a clean horizontal line and never a partial row.
 */
export const COLUMNS = 40;

/** How many cells a dollar amount is worth. Never negative. */
export function cellsFor(dollars, perCell) {
  if (dollars <= 0) return 0;
  return Math.round(dollars / perCell);
}

export const TRILLION_CELLS = cellsFor(TRILLION, CELL_DOLLARS);

export function rowsFor(count) {
  if (count <= 0) return 0;
  return Math.ceil(count / COLUMNS);
}

/**
 * The largest cell size that fits `count` cells in the box. Computed once per
 * resize — never per frame.
 */
export function layoutFor(count, width, height, gap = 2) {
  const cols = COLUMNS;
  const rows = rowsFor(count);
  if (count <= 0 || rows <= 0 || width <= 0 || height <= 0) {
    return { cols, rows: 0, cell: 0, gap };
  }

  const cell = Math.min(
    (width - gap * (cols - 1)) / cols,
    (height - gap * (rows - 1)) / rows
  );

  return { cols, rows, cell: Math.max(0, cell), gap };
}

/**
 * Where a cell sits, measured from the bottom up. A quantity that grows
 * upward against a fixed line is the only orientation in which "above the
 * line" carries meaning.
 */
export function cellOrigin(index, layout, height) {
  const pitch = layout.cell + layout.gap;
  const col = index % layout.cols;
  const row = Math.floor(index / layout.cols);
  return { x: col * pitch, y: height - layout.cell - row * pitch };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/grid.test.js`
Expected: PASS, 21 tests.

- [ ] **Step 5: Stage**

```bash
git add src/lib/grid.js src/lib/grid.test.js
```

---

### Task 2: `grid.js` — the removal schedule

**Files:**
- Modify: `src/lib/grid.js`
- Test: `src/lib/grid.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces: `REMOVAL_MS`, `easeOutCubic(t)`, `cellsRemainingAt(elapsedMs, fromCells, toCells, durationMs)`.

Act IV's subtraction is the piece's only animated quantity, so the count on screen at any instant has to be a pure function of elapsed time — not a mutable counter a rAF loop decrements. That is what makes it testable, and what makes the reduced-motion path a one-line branch instead of a second implementation.

- [ ] **Step 1: Write the failing test**

```javascript
import { describe, it, expect } from 'vitest';
import { REMOVAL_MS, easeOutCubic, cellsRemainingAt } from './grid.js';

describe('easeOutCubic', () => {
  it('starts at zero and ends at one', () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
  });

  it('front-loads the motion', () => {
    // Most of the loss happens early — the collapse should look like a
    // collapse, not a metronome.
    expect(easeOutCubic(0.5)).toBeGreaterThan(0.5);
  });

  it('clamps outside the unit interval', () => {
    expect(easeOutCubic(-1)).toBe(0);
    expect(easeOutCubic(2)).toBe(1);
  });
});

describe('cellsRemainingAt', () => {
  const FROM = 1000;
  const TO = 637;

  it('holds the starting count before it begins', () => {
    expect(cellsRemainingAt(0, FROM, TO, REMOVAL_MS)).toBe(FROM);
  });

  it('lands exactly on the ending count', () => {
    expect(cellsRemainingAt(REMOVAL_MS, FROM, TO, REMOVAL_MS)).toBe(TO);
  });

  it('stays at the ending count afterwards', () => {
    expect(cellsRemainingAt(REMOVAL_MS * 3, FROM, TO, REMOVAL_MS)).toBe(TO);
  });

  it('never rises part-way through', () => {
    let previous = FROM;
    for (let t = 0; t <= REMOVAL_MS; t += 50) {
      const remaining = cellsRemainingAt(t, FROM, TO, REMOVAL_MS);
      expect(remaining).toBeLessThanOrEqual(previous);
      previous = remaining;
    }
  });

  it('returns whole cells only', () => {
    const remaining = cellsRemainingAt(REMOVAL_MS / 3, FROM, TO, REMOVAL_MS);
    expect(Number.isInteger(remaining)).toBe(true);
  });

  it('stays inside the endpoints', () => {
    for (let t = 0; t <= REMOVAL_MS; t += 137) {
      const remaining = cellsRemainingAt(t, FROM, TO, REMOVAL_MS);
      expect(remaining).toBeLessThanOrEqual(FROM);
      expect(remaining).toBeGreaterThanOrEqual(TO);
    }
  });

  it('jumps straight to the end with no duration', () => {
    expect(cellsRemainingAt(0, FROM, TO, 0)).toBe(TO);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/grid.test.js`
Expected: FAIL — `REMOVAL_MS is not defined` and `cellsRemainingAt is not a function`.

- [ ] **Step 3: Write minimal implementation**

Append to `src/lib/grid.js`:

```javascript
/**
 * How long the evaporation takes. Long enough to read as a quantity draining
 * rather than a number changing, short enough that nobody waits it out.
 */
export const REMOVAL_MS = 4000;

export function easeOutCubic(t) {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return 1 - Math.pow(1 - t, 3);
}

/** How many cells are still standing `elapsedMs` into the removal. */
export function cellsRemainingAt(elapsedMs, fromCells, toCells, durationMs) {
  if (durationMs <= 0) return toCells;
  const progress = easeOutCubic(elapsedMs / durationMs);
  return Math.round(fromCells - (fromCells - toCells) * progress);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/grid.test.js`
Expected: PASS, 31 tests.

- [ ] **Step 5: Stage**

```bash
git add src/lib/grid.js src/lib/grid.test.js
```

---

### Task 3: `ZoomGrid.svelte` — the canvas renderer

**Files:**
- Create: `src/lib/ZoomGrid.svelte`

**Interfaces:**
- Consumes: `layoutFor`, `cellOrigin`, `COLUMNS` from `grid.js`.
- Produces: `<ZoomGrid {count} {capacity} {threshold} {label} />` — a canvas drawing `count` filled cells inside a grid sized for `capacity`, with an optional horizontal rule at `threshold`.

Requirements:

- `capacity` sizes the layout; `count` is how many of those cells are filled. Passing them separately is what stops the grid resizing every frame during Act IV's removal — the box is fixed by the peak, and cells empty inside it.
- Canvas sized to `clientWidth × clientHeight` in CSS pixels, backing store scaled by `devicePixelRatio`, context scaled once on resize — never per frame. Same contract as `Ribbon.svelte`.
- Draw loop: one `for` loop from 0 to `count`, `cellOrigin` per cell, `fillRect`. No allocation, no `map`, no per-cell closure.
- Cells above `threshold` draw in `--guess`; cells at or below it draw in `--truth`. The threshold rule itself draws in `--text-primary` at 2px with its label beside it.
- Redraw only when `count`, `capacity`, `threshold` or the box size changes, coalesced through one `requestAnimationFrame`; a pending frame is not re-scheduled.
- `ResizeObserver` on the container drives re-measure; disconnect on destroy.
- `aria-hidden="true"` on the canvas. The acts supply the accessible content, exactly as in Act II.
- Colours read from the `:root` custom properties hoisted in Plan 2 Task 4.

- [ ] **Step 1: Write the component per the requirements above**

Core of the draw function, which the rest of the component is built around:

```javascript
function draw() {
  frame = null;
  if (!ctx || layout.cell <= 0) return;

  ctx.clearRect(0, 0, width, height);

  const gridHeight = layout.rows * (layout.cell + layout.gap) - layout.gap;
  const top = height - gridHeight;

  for (let i = 0; i < count; i++) {
    const { x, y } = cellOrigin(i, layout, height);
    ctx.fillStyle = threshold > 0 && i >= threshold ? colorOver : colorFill;
    ctx.fillRect(x, y, layout.cell, layout.cell);
  }

  if (threshold > 0 && threshold <= capacity) {
    const rows = threshold / COLUMNS;
    const y = height - rows * (layout.cell + layout.gap) + layout.gap / 2;
    ctx.fillStyle = colorRule;
    ctx.fillRect(0, y - 1, width, 2);
    ctx.fillStyle = colorLabel;
    ctx.fillText(label, 0, y - 8);
  }

  void top;
}
```

- [ ] **Step 2: Verify the loop is bounded and allocation-free**

Run: `npm run dev`, then in the browser console with the trillion grid mounted, confirm the draw loop runs `count` iterations and that a removal frame allocates nothing per cell. Instrument temporarily with a counter; remove the instrumentation before staging.

Expected: 1,320 iterations at the peak, 726 at the closing figure, and no array allocation in the loop.

- [ ] **Step 3: Stage**

```bash
git add src/lib/ZoomGrid.svelte
```

---

### Task 4: `ActThree.svelte` — the zoom out

**Files:**
- Create: `src/lib/ActThree.svelte`
- Modify: `src/routes/+page.svelte`

**Interfaces:**
- Consumes: `ZoomGrid`, `SQUARE_DOLLARS`, `CELL_DOLLARS`, `TRILLION_CELLS`, `cellsFor` from `grid.js`; `timeline` from `../data/timeline.js`; `formatDollars`, `formatShort` from `scaleEngine.js`.
- Produces: `<ActThree />`, mounted at `id="act-three"`.

Requirements:

- Four steps, advanced by `IntersectionObserver` on step markers against a sticky stage. The page scrolls natively — no wheel capture, no position ownership, nothing borrowed from Act II.
  1. **One square.** A single filled square, labelled `$1,000,000`.
  2. **A billion.** 1,000 squares fill the stage. Caption states that the entire screen is $1 billion and that Act II took roughly 55 minutes to cross it.
  3. **A trillion.** The same 1,000-cell geometry, relabelled: each cell is now $1 billion, the screen is $1 trillion. The grid does not move — only the label changes, and the caption says so.
  4. **The arc.** Capacity opens to the peak, 1,320 cells. The trillion rule is drawn at cell 1,000. The 16 June peak stands above it, the 4 August figure below, both from `timeline`, both with sources.
- Every step's caption is real DOM text, not canvas. The canvas is `aria-hidden`; a visually-hidden `<ol>` carries the four steps as prose so the act reads in full with the canvas ignored.
- Replaces the placeholder `<div id="act-three">` added in Plan 2 Task 6. `ActThree`'s `<section>` carries the id, and Act II's skip link keeps working. **Delete the placeholder — do not leave two elements with the same id.**
- Both figures render with `formatDollars` and carry their `source` and `asOf` from `timeline`, per sourcing rule 1.
- `IntersectionObserver` disconnects on destroy.

- [ ] **Step 1: Write the component per the requirements above**

The step observer, which the rest of the component is built around:

```javascript
const STEPS = [
  { count: 1, capacity: 1, threshold: 0, unit: SQUARE_DOLLARS },
  { count: 1000, capacity: 1000, threshold: 0, unit: SQUARE_DOLLARS },
  { count: TRILLION_CELLS, capacity: TRILLION_CELLS, threshold: 0, unit: CELL_DOLLARS },
  { count: peakCells, capacity: peakCells, threshold: TRILLION_CELLS, unit: CELL_DOLLARS }
];

let step = $state(0);

$effect(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) step = Number(entry.target.dataset.step);
      }
    },
    { rootMargin: '-50% 0px -50% 0px' }
  );

  for (const marker of markers) observer.observe(marker);
  return () => observer.disconnect();
});
```

- [ ] **Step 2: Wire into `+page.svelte`, replacing the placeholder**

- [ ] **Step 3: Stage**

```bash
git add src/lib/ActThree.svelte src/routes/+page.svelte
```

---

### Task 5: `ActFour.svelte` — what evaporated

**Files:**
- Create: `src/lib/ActFour.svelte`
- Modify: `src/routes/+page.svelte`

**Interfaces:**
- Consumes: `ZoomGrid`, `cellsFor`, `cellsRemainingAt`, `REMOVAL_MS`, `CELL_DOLLARS`, `TRILLION_CELLS` from `grid.js`; `julyLoss`, `timeline` from `../data/timeline.js`; `guessToDollars` from `actZero.js`; `formatDollars`, `formatShort` from `scaleEngine.js`.
- Produces: `<ActFour {readerGuess} />`.

Requirements:

- The grid persists from Act III at the peak's capacity, so the removal happens inside a box the reader already recognises. Capacity never changes during the removal.
- The removal starts when the act is at least half visible, runs once, and does not restart on re-entry. `cellsRemainingAt` drives every frame — the component holds a start timestamp and nothing else.
- From and to come from data, not from arithmetic in the component: `from` is the last pre-July `timeline` figure (1,000 cells, 29 June), `to` is `from` less `julyLoss.dollars` (637 cells), both converted with `cellsFor`.
- A live readout counts down in dollars alongside the grid, using `formatDollars`.
- **The endpoints do not reconcile, and the act must say so.** 1,000 cells less July's sourced 363 leaves 637, but the recorded 4 August figure is $725.9B — 726 cells. The $363B is a record *single-month* fall; other days inside the window moved the other way, so the two figures are not a subtraction. What the grid shows is the size of July's loss, not a running balance. When the removal settles, the act states the 4 August figure with its source and notes plainly why it is higher than what just drained. Editorial rule 2 — where sources disagree, say so on the page — applies directly here. **Do not quietly animate to 726 to make the arithmetic look clean, and do not present 637 as today's figure.**
- The line is stated once the removal finishes: 363 cells gone, each one a billion — 363 times the quantity Act II could not cross once.
- **The Act 0 callback.** `readerGuess` is the fraction Act 0 retained; `guessToDollars(readerGuess)` is what the reader claimed a billion was. When that amount is smaller than `julyLoss.dollars`, the act says so in the reader's own numbers. **When `readerGuess` is `null` — the reader skipped Act 0 — render the act without the callback rather than showing a fallback sentence about a guess that was never made.**
- `aria-live="polite"` announces only the start and the end of the removal, never the intermediate counts. Two announcements total.
- A visually-hidden summary states the before figure, the loss, and the after figure with sources, so the act does not depend on watching an animation.

- [ ] **Step 1: Write the component per the requirements above**

The removal clock, which the rest of the component is built around:

```javascript
let startedAt = $state(null);
let elapsed = $state(0);

const fromCells = cellsFor(preJulyDollars, CELL_DOLLARS);
const toCells = cellsFor(preJulyDollars - julyLoss.dollars, CELL_DOLLARS);

const remaining = $derived(
  startedAt === null ? fromCells : cellsRemainingAt(elapsed, fromCells, toCells, REMOVAL_MS)
);

function tick(now) {
  elapsed = now - startedAt;
  if (elapsed < REMOVAL_MS) frame = requestAnimationFrame(tick);
  else announce(`${formatShort(julyLoss.dollars)} gone.`);
}
```

- [ ] **Step 2: Wire into `+page.svelte` below `ActThree`, passing `readerGuess`**

- [ ] **Step 3: Stage**

```bash
git add src/lib/ActFour.svelte src/routes/+page.svelte
```

---

### Task 6: The reduced-motion path for both acts

**Files:**
- Modify: `src/lib/ActThree.svelte`, `src/lib/ActFour.svelte`

**Interfaces:**
- Consumes: `window.matchMedia('(prefers-reduced-motion: reduce)')`.
- Produces: static branches of both acts carrying identical content.

Act III's sticky step sequence and Act IV's live subtraction are both motion the reader may have asked not to see. The static paths are not degraded fallbacks — they carry the same argument.

Requirements:

- Query `matchMedia` on mount and subscribe to changes; remove the subscription on destroy. Same shape as `ActTwo.svelte`.
- Act III static: all four steps as a table — what one square is worth, what the screen is worth, how many screens a trillion is — plus the peak and closing figures with sources. No canvas, no `IntersectionObserver`.
- Act IV static: the before figure, the loss, and the after figure as a table with sources, the 363-billions line in prose, and the Act 0 callback when a guess exists. No canvas, no animation frame.
- Both paths expose the same figures and the same sources to assistive technology.

- [ ] **Step 1: Write both branches**
- [ ] **Step 2: Verify with devtools emulation that no `<canvas>` is present in either act**
- [ ] **Step 3: Stage**

```bash
git add src/lib/ActThree.svelte src/lib/ActFour.svelte
```

---

### Task 7: Browser verification

**Files:**
- Modify: `scratchpad/verify/check.mjs` — the Playwright suite from Plan 1, extended in Plan 2 Task 8. It lives outside the repo; see [tech-debt.md](../tech-debt.md).

Each check is a claim about Acts III and IV that would otherwise be an assertion in prose.

- [ ] **Step 1: Add the checks**

1. Act III mounts at `id="act-three"` and exactly one element in the document carries that id.
2. Act II's skip link moves focus into Act III.
3. Scrolling through Act III advances the step marker 0 → 1 → 2 → 3, and the sticky stage stays fixed while it does.
4. At step 2 the grid draws exactly 1,000 cells; at step 3 it draws 1,320.
5. The grid geometry at step 1 and step 2 is pixel-identical — only the caption changes.
6. The trillion rule sits at exactly 25 rows from the bottom, and 320 cells render above it.
7. Act IV's removal starts once, and the cell count is monotonically non-increasing across the whole animation.
8. The count settles on exactly 637 cells — the size of July's loss removed — and the act renders the 4 August figure of $725.9B with its source alongside, plus the sentence explaining why the two do not reconcile.
9. The `aria-live` region fires exactly twice during Act IV — start and end, never the intermediate counts.
10. With Act 0 completed at a midpoint guess, Act IV's callback names the reader's own figure; with Act 0 skipped, the callback is absent and no fallback sentence appears.
11. Under `prefers-reduced-motion: reduce`, neither act renders a `<canvas>`, and every figure and source is still present as text.
12. No horizontal overflow at 320px with both grids mounted.
13. A removal sweep costs no more per frame than the same page idle — the baseline comparison from Plan 2 Task 8, since headless Chrome does not run rAF at display rate.

- [ ] **Step 2: Run the suite**

Run: `node check.mjs` with `npm run dev` already running.
Expected: all 39 existing checks plus all 13 above, passing.

---

## Self-Review

**Spec coverage:**

| Spec requirement | Task |
|---|---|
| One filled square = $1,000,000 | 1, 4 |
| 1,000 squares fill a screen = $1B, visible at once | 1, 4 |
| Screen collapses to a dot; a grid of dots is $1T | 3, 4 |
| The arc lands on the grid as area | 4 |
| Peak above the line, closing figure below | 1, 4, 7 (checks 4, 6) |
| Act III's grid stays for Act IV | 3, 5 |
| $363B removed live | 2, 5, 7 (checks 7, 8) |
| 363× the quantity Act II could not cross | 5 |
| Callback to Act 0's retained guess | 5, 7 (check 10) |
| Known source conflict stated, not resolved silently | 5, 7 (check 8) |
| Every figure sourced and dated on the page | 4, 5, 6 |
| Reduced-motion path | 6, 7 (check 11) |
| Keyboard and screen-reader navigable | 4, 5, 7 (checks 2, 9, 11) |
| Native scroll only — no second hijack | 4, 7 (check 3) |

**Deferred to Plan 4:** Act I (Seconds), the coda — referent table, timeline, and the build note about the 33.5M px ceiling — and the site-wide WCAG audit.

**Known soft spots:**

1. **Tasks 3–6 specify components by requirement rather than by full source**, the same tradeoff as Plan 1 Task 7 and Plan 2 Tasks 4–7, and for the same reason: the pure logic underneath is fully specified and tested in Tasks 1–2, and the components are plumbing over it. Task 7's thirteen checks are the acceptance criteria.
2. **The `IntersectionObserver` step thresholds are empirical.** `rootMargin: '-50% 0px -50% 0px'` fires a step at the vertical midpoint, which is conventional but wants checking against a real trackpad before it is called correct.
3. **`REMOVAL_MS = 4000` is a judgement, not a derivation.** Four seconds is long enough to read as draining and short enough not to strand the reader. It should be adjusted by feel once it exists.
4. **Act IV's endpoints do not reconcile, and no plan can fix that** — it is a property of the sources. 1,000 cells less 363 is 637; the recorded 4 August figure is 726. The act states both and explains the gap rather than picking the tidier number. If a later source publishes a clean 1 July opening balance, this becomes a straight subtraction and the explanatory sentence can go.
5. **Check 5 (pixel-identical geometry) may be brittle** if the canvas is re-measured between steps and `devicePixelRatio` rounding shifts a cell by a subpixel. If it proves flaky, compare `layoutFor` output rather than rendered pixels.
