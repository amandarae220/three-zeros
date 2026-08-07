# Foundation & Act 0 — Implementation Plan

**Goal:** Ship a deployable SvelteKit site containing the tested numeric core, the sourced data layer, and Act 0 — the drag-to-estimate interaction that proves the linear misconception on the reader.

**Architecture:** All arithmetic lives in `scaleEngine.js`, a pure ES module with no DOM and no Svelte imports, so the entire numeric contract is unit-testable without a browser. Act 0's logic (guess capture, clamping, reveal fraction) is expressed as pure functions there too; `EstimateLine.svelte` is a thin input/render shell over them. Data lives in plain modules with a tested invariant that every record carries a source and a date.

**Tech Stack:** SvelteKit 2 + `adapter-static`, Svelte 5 (runes), Vite 8, Vitest 4. No d3 and no scrollama in this plan — they are added by the plan that first needs them.

## Global Constraints

- Node 20+; package manager `npm`.
- `"type": "module"` in `package.json`. ESM only, no CommonJS.
- Svelte 5 runes syntax (`$state`, `$derived`, `$props`). No `export let`, no legacy stores.
- `DOLLARS_PER_PIXEL = 100` — declared once in `scaleEngine.js`, imported everywhere. Never inlined.
- `PEAK_DOLLARS = 1_320_000_000_000` — the 2026-06-16 close. Declared once, imported everywhere.
- Plain JS numbers throughout. No BigInt: max position is 1.32 × 10^10, inside `Number.MAX_SAFE_INTEGER`.
- No number appears in any component that is not imported from `src/lib/scaleEngine.js` or `src/data/`.
- Every data record must have non-empty `source` and `asOf` fields. Enforced by test, not convention.
- WCAG 2.1 AA on everything rendered.
- **Never commit.** Every task ends with `git add` only; Amanda writes the commit message.

---

### Task 1: Project scaffold and repo init

**Files:**
- Create: `package.json`, `svelte.config.js`, `vite.config.js`, `.gitignore`, `src/app.html`, `src/routes/+layout.js`, `src/routes/+page.svelte`

**Interfaces:**
- Consumes: nothing.
- Produces: a running `npm run dev` and a passing `npm test` command that later tasks build on.

- [ ] **Step 1: Initialize the repo**

`/Users/manders` is itself a git repo tracking `true-cost-of-car-ownership`. `three-zeros/` must be its own repo or its files land in the wrong project.

```bash
cd /Users/manders/three-zeros
git init
```

- [ ] **Step 2: Create `package.json`**

```json
{
  "name": "three-zeros",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ci": "vitest run"
  },
  "devDependencies": {
    "@sveltejs/adapter-static": "^3.0.10",
    "@sveltejs/kit": "^2.69.0",
    "@sveltejs/vite-plugin-svelte": "^7.2.0",
    "svelte": "^5.56.0",
    "vite": "^8.1.0",
    "vitest": "^4.1.10"
  }
}
```

- [ ] **Step 3: Install**

Run: `npm install`
Expected: `node_modules/` created, no peer-dependency errors.

- [ ] **Step 4: Create `svelte.config.js`**

```javascript
import adapter from '@sveltejs/adapter-static';

export default {
  kit: {
    adapter: adapter({ fallback: null }),
    prerender: { entries: ['*'] }
  }
};
```

- [ ] **Step 5: Create `vite.config.js`**

```javascript
import { sveltekit } from '@sveltejs/kit/vite';

export default {
  plugins: [sveltekit()],
  test: {
    include: ['src/**/*.test.js']
  }
};
```

- [ ] **Step 6: Create `src/app.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    %sveltekit.head%
  </head>
  <body>
    <div style="display: contents">%sveltekit.body%</div>
  </body>
</html>
```

- [ ] **Step 7: Create `src/routes/+layout.js`**

```javascript
export const prerender = true;
export const ssr = true;
```

- [ ] **Step 8: Create `src/routes/+page.svelte`**

```svelte
<h1>Three Zeros</h1>
```

- [ ] **Step 9: Create `.gitignore`**

```
node_modules
/.svelte-kit
/build
.DS_Store
.env
.env.*
!.env.example
```

- [ ] **Step 10: Verify dev server boots**

Run: `npm run dev`
Expected: server listening on `http://localhost:5173`, page renders "Three Zeros", no console errors. Stop the server.

- [ ] **Step 11: Stage**

```bash
git add package.json package-lock.json svelte.config.js vite.config.js .gitignore src/
```

Amanda writes the commit message.

---

### Task 2: `scaleEngine` — position ↔ dollars

**Files:**
- Create: `src/lib/scaleEngine.js`
- Test: `src/lib/scaleEngine.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces: `DOLLARS_PER_PIXEL: number`, `PEAK_DOLLARS: number`, `positionOf(dollars: number): number`, `dollarsAt(position: number): number`.

- [ ] **Step 1: Write the failing test**

```javascript
import { describe, it, expect } from 'vitest';
import {
  DOLLARS_PER_PIXEL,
  PEAK_DOLLARS,
  positionOf,
  dollarsAt
} from './scaleEngine.js';

describe('constants', () => {
  it('scales at one hundred dollars per pixel', () => {
    expect(DOLLARS_PER_PIXEL).toBe(100);
  });

  it('peaks at the 2026-06-16 close', () => {
    expect(PEAK_DOLLARS).toBe(1_320_000_000_000);
  });
});

describe('positionOf', () => {
  it('places a million at ten thousand pixels', () => {
    expect(positionOf(1e6)).toBe(10_000);
  });

  it('places a billion at ten million pixels', () => {
    expect(positionOf(1e9)).toBe(10_000_000);
  });

  it('places the peak at 13.2 billion pixels', () => {
    expect(positionOf(PEAK_DOLLARS)).toBe(13_200_000_000);
  });

  it('keeps the peak position inside safe integer range', () => {
    expect(positionOf(PEAK_DOLLARS)).toBeLessThan(Number.MAX_SAFE_INTEGER);
  });

  it('places zero at the origin', () => {
    expect(positionOf(0)).toBe(0);
  });
});

describe('dollarsAt', () => {
  it('inverts positionOf at a million', () => {
    expect(dollarsAt(10_000)).toBe(1e6);
  });

  it('round-trips every order of magnitude', () => {
    for (const value of [1e3, 1e6, 1e9, 1e12, PEAK_DOLLARS]) {
      expect(dollarsAt(positionOf(value))).toBe(value);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test src/lib/scaleEngine.test.js`
Expected: FAIL — `Failed to resolve import "./scaleEngine.js"`.

- [ ] **Step 3: Write minimal implementation**

```javascript
/** Dollars represented by one vertical pixel of the Act II ribbon. */
export const DOLLARS_PER_PIXEL = 100;

/** Musk's net worth at the 2026-06-16 SpaceX close. Forbes. */
export const PEAK_DOLLARS = 1_320_000_000_000;

/** Convert a dollar amount to its pixel offset on the ribbon. */
export function positionOf(dollars) {
  return dollars / DOLLARS_PER_PIXEL;
}

/** Convert a pixel offset on the ribbon back to dollars. */
export function dollarsAt(position) {
  return position * DOLLARS_PER_PIXEL;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test src/lib/scaleEngine.test.js`
Expected: PASS, 9 tests.

- [ ] **Step 5: Stage**

```bash
git add src/lib/scaleEngine.js src/lib/scaleEngine.test.js
```

---

### Task 3: `scaleEngine` — the Act 0 reveal

**Files:**
- Modify: `src/lib/scaleEngine.js`
- Test: `src/lib/scaleEngine.test.js`

**Interfaces:**
- Consumes: nothing from Task 2.
- Produces: `linearFraction(value: number, min: number, max: number): number`, `ACT_ZERO: { min: number, max: number, target: number }`.

This is the load-bearing number in the whole piece. A billion sits at 0.0999% of the span from a million to a trillion — one pixel from the left edge of a 1,000px line.

- [ ] **Step 1: Write the failing test**

```javascript
import { linearFraction, ACT_ZERO } from './scaleEngine.js';

describe('linearFraction', () => {
  it('puts a billion a tenth of a percent along the million-to-trillion span', () => {
    expect(linearFraction(1e9, 1e6, 1e12)).toBeCloseTo(0.000999, 6);
  });

  it('renders as under one pixel on a thousand-pixel line', () => {
    expect(linearFraction(1e9, 1e6, 1e12) * 1000).toBeLessThan(1);
  });

  it('returns zero at the minimum', () => {
    expect(linearFraction(1e6, 1e6, 1e12)).toBe(0);
  });

  it('returns one at the maximum', () => {
    expect(linearFraction(1e12, 1e6, 1e12)).toBe(1);
  });

  it('clamps below the minimum', () => {
    expect(linearFraction(0, 1e6, 1e12)).toBe(0);
  });

  it('clamps above the maximum', () => {
    expect(linearFraction(1e15, 1e6, 1e12)).toBe(1);
  });
});

describe('ACT_ZERO', () => {
  it('spans a million to a trillion, asking for a billion', () => {
    expect(ACT_ZERO).toEqual({ min: 1e6, max: 1e12, target: 1e9 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test src/lib/scaleEngine.test.js`
Expected: FAIL — `linearFraction is not a function`.

- [ ] **Step 3: Write minimal implementation**

Append to `src/lib/scaleEngine.js`:

```javascript
/** Act 0's line: guess where a billion falls between a million and a trillion. */
export const ACT_ZERO = { min: 1e6, max: 1e12, target: 1e9 };

/**
 * Where `value` sits on a linear scale from `min` to `max`, as 0..1.
 * Clamped, because Act 0 lets the reader drag past either end.
 */
export function linearFraction(value, min, max) {
  const fraction = (value - min) / (max - min);
  if (fraction < 0) return 0;
  if (fraction > 1) return 1;
  return fraction;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test src/lib/scaleEngine.test.js`
Expected: PASS, 16 tests.

- [ ] **Step 5: Stage**

```bash
git add src/lib/scaleEngine.js src/lib/scaleEngine.test.js
```

---

### Task 4: `scaleEngine` — formatting

**Files:**
- Modify: `src/lib/scaleEngine.js`
- Test: `src/lib/scaleEngine.test.js`

**Interfaces:**
- Consumes: nothing from Tasks 2–3.
- Produces: `formatDollars(n: number): string`, `formatShort(n: number): string`.

Two formatters, because the piece needs both. `formatDollars` shows every digit — the zeros are the argument. `formatShort` is for cramped labels and screen-reader text where thirteen digits read as noise.

- [ ] **Step 1: Write the failing test**

```javascript
import { formatDollars, formatShort } from './scaleEngine.js';

describe('formatDollars', () => {
  it('groups a million', () => {
    expect(formatDollars(1e6)).toBe('$1,000,000');
  });

  it('groups a billion', () => {
    expect(formatDollars(1e9)).toBe('$1,000,000,000');
  });

  it('groups a trillion', () => {
    expect(formatDollars(1e12)).toBe('$1,000,000,000,000');
  });

  it('rounds to whole dollars', () => {
    expect(formatDollars(1234.56)).toBe('$1,235');
  });

  it('formats zero', () => {
    expect(formatDollars(0)).toBe('$0');
  });
});

describe('formatShort', () => {
  it('names a million', () => {
    expect(formatShort(1e6)).toBe('$1 million');
  });

  it('names a billion', () => {
    expect(formatShort(1e9)).toBe('$1 billion');
  });

  it('names the peak with two decimals', () => {
    expect(formatShort(1_320_000_000_000)).toBe('$1.32 trillion');
  });

  it('names the July loss', () => {
    expect(formatShort(363_000_000_000)).toBe('$363 billion');
  });

  it('drops trailing zeros in the decimal', () => {
    expect(formatShort(1_500_000_000)).toBe('$1.5 billion');
  });

  it('falls back to grouped digits below a million', () => {
    expect(formatShort(45_000)).toBe('$45,000');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test src/lib/scaleEngine.test.js`
Expected: FAIL — `formatDollars is not a function`.

- [ ] **Step 3: Write minimal implementation**

Append to `src/lib/scaleEngine.js`:

```javascript
const GROUPED = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

const SCALES = [
  { threshold: 1e12, divisor: 1e12, name: 'trillion' },
  { threshold: 1e9, divisor: 1e9, name: 'billion' },
  { threshold: 1e6, divisor: 1e6, name: 'million' }
];

/** Every digit, comma-grouped. The zeros are the argument. */
export function formatDollars(n) {
  return `$${GROUPED.format(Math.round(n))}`;
}

/** Short form for cramped labels and screen-reader text. */
export function formatShort(n) {
  const scale = SCALES.find((s) => n >= s.threshold);
  if (!scale) return formatDollars(n);
  const scaled = n / scale.divisor;
  const rounded = Math.round(scaled * 100) / 100;
  return `$${rounded} ${scale.name}`;
}
```

`Math.round(scaled * 100) / 100` then template interpolation drops trailing zeros for free: `1.5` stringifies as `"1.5"`, `1` as `"1"`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test src/lib/scaleEngine.test.js`
Expected: PASS, 27 tests.

- [ ] **Step 5: Stage**

```bash
git add src/lib/scaleEngine.js src/lib/scaleEngine.test.js
```

---

### Task 5: `scaleEngine` — time to complete

**Files:**
- Modify: `src/lib/scaleEngine.js`
- Test: `src/lib/scaleEngine.test.js`

**Interfaces:**
- Consumes: `PEAK_DOLLARS`, `positionOf` from Task 2.
- Produces: `secondsToComplete(position: number, pxPerSecond: number): number`, `formatDuration(seconds: number): string`.

This is the readout that turns Act II's futility into a stated fact instead of a broken page.

- [ ] **Step 1: Write the failing test**

```javascript
import { secondsToComplete, formatDuration } from './scaleEngine.js';

describe('secondsToComplete', () => {
  it('takes about fifty-one days from zero at a fast scroll', () => {
    const days = secondsToComplete(0, 3000) / 86_400;
    expect(days).toBeGreaterThan(50);
    expect(days).toBeLessThan(52);
  });

  it('takes about three seconds to clear a million', () => {
    expect(secondsToComplete(0, 3000) - secondsToComplete(positionOf(1e6), 3000))
      .toBeCloseTo(3.33, 1);
  });

  it('returns zero at the peak', () => {
    expect(secondsToComplete(positionOf(PEAK_DOLLARS), 3000)).toBe(0);
  });

  it('returns Infinity when stopped', () => {
    expect(secondsToComplete(0, 0)).toBe(Infinity);
  });
});

describe('formatDuration', () => {
  it('reads seconds under a minute', () => {
    expect(formatDuration(45)).toBe('45 seconds');
  });

  it('reads minutes under an hour', () => {
    expect(formatDuration(3300)).toBe('55 minutes');
  });

  it('reads hours under a day', () => {
    expect(formatDuration(7200)).toBe('2 hours');
  });

  it('reads days beyond that', () => {
    expect(formatDuration(4_400_000)).toBe('51 days');
  });

  it('singularizes', () => {
    expect(formatDuration(86_400)).toBe('1 day');
  });

  it('reads Infinity as never', () => {
    expect(formatDuration(Infinity)).toBe('never');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test src/lib/scaleEngine.test.js`
Expected: FAIL — `secondsToComplete is not a function`.

- [ ] **Step 3: Write minimal implementation**

Append to `src/lib/scaleEngine.js`:

```javascript
const UNITS = [
  { seconds: 86_400, name: 'day' },
  { seconds: 3_600, name: 'hour' },
  { seconds: 60, name: 'minute' },
  { seconds: 1, name: 'second' }
];

/** How long the rest of the ribbon takes at the reader's current speed. */
export function secondsToComplete(position, pxPerSecond) {
  const remaining = positionOf(PEAK_DOLLARS) - position;
  if (remaining <= 0) return 0;
  if (pxPerSecond <= 0) return Infinity;
  return remaining / pxPerSecond;
}

/** Coarse duration — one unit only. Precision here would be false comfort. */
export function formatDuration(seconds) {
  if (!Number.isFinite(seconds)) return 'never';
  const unit = UNITS.find((u) => seconds >= u.seconds) ?? UNITS[UNITS.length - 1];
  const count = Math.round(seconds / unit.seconds);
  return `${count} ${unit.name}${count === 1 ? '' : 's'}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test src/lib/scaleEngine.test.js`
Expected: PASS, 37 tests.

- [ ] **Step 5: Stage**

```bash
git add src/lib/scaleEngine.js src/lib/scaleEngine.test.js
```

---

### Task 6: Sourced data layer

**Files:**
- Create: `src/data/timeline.js`, `src/data/referents.js`
- Test: `src/data/data.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces: `timeline: Array<{date, event, dollars, source, asOf}>`, `referents: Array<{dollars, label, source, asOf}>`.

Spec sourcing rule 3: no number appears in the UI that is not in this data. Rule 2: anything without a citable source is cut, not estimated — which is why "a large hospital construction project" from the spec's candidate list does not appear below.

- [ ] **Step 1: Write the failing test**

```javascript
import { describe, it, expect } from 'vitest';
import { timeline } from './timeline.js';
import { referents } from './referents.js';

const records = [...timeline, ...referents];

describe('data invariants', () => {
  it('gives every record a non-empty source', () => {
    for (const r of records) {
      expect(r.source, JSON.stringify(r)).toBeTruthy();
      expect(r.source).toMatch(/^https?:\/\//);
    }
  });

  it('gives every record an ISO as-of date', () => {
    for (const r of records) {
      expect(r.asOf, JSON.stringify(r)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('gives every record a positive dollar figure', () => {
    for (const r of records) {
      expect(r.dollars).toBeGreaterThan(0);
      expect(Number.isFinite(r.dollars)).toBe(true);
    }
  });
});

describe('timeline', () => {
  it('runs in chronological order', () => {
    const dates = timeline.map((t) => t.date);
    expect([...dates].sort()).toEqual(dates);
  });

  it('opens at the IPO and closes at the current reading', () => {
    expect(timeline[0].date).toBe('2026-06-12');
    expect(timeline[timeline.length - 1].date).toBe('2026-08-04');
  });
});

describe('referents', () => {
  it('runs in ascending dollar order', () => {
    const values = referents.map((r) => r.dollars);
    expect([...values].sort((a, b) => a - b)).toEqual(values);
  });

  it('stays below a billion, so the ladder ends before the scroll begins', () => {
    for (const r of referents) {
      expect(r.dollars).toBeLessThan(1e9);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test src/data/data.test.js`
Expected: FAIL — `Failed to resolve import "./timeline.js"`.

- [ ] **Step 3: Create `src/data/timeline.js`**

```javascript
/**
 * The arc. Point-in-time figures, each labelled with the date it was true.
 * Live updating is out of scope — the arc is the subject, not the ticker.
 */
export const timeline = [
  {
    date: '2026-06-12',
    event: 'SpaceX begins trading on the Nasdaq at $135. Musk becomes the first person worth a trillion dollars.',
    dollars: 1_100_000_000_000,
    source: 'https://www.cnbc.com/2026/06/12/elon-musk-trillionaire-spacex.html',
    asOf: '2026-06-12'
  },
  {
    date: '2026-06-16',
    event: 'SpaceX closes at $211.39, its high. The peak.',
    dollars: 1_320_000_000_000,
    source: 'https://www.forbes.com/sites/mattdurot/2026/06/24/elon-musk-is-no-longer-a-trillionaire/',
    asOf: '2026-06-16'
  },
  {
    date: '2026-06-24',
    event: 'SpaceX falls. He drops below a trillion, twelve days after crossing it.',
    dollars: 962_000_000_000,
    source: 'https://fortune.com/2026/06/24/elon-musk-no-longer-trillionaire-spacex-valuation/',
    asOf: '2026-06-24'
  },
  {
    date: '2026-06-29',
    event: 'SpaceX and Tesla rally. He crosses back over, briefly.',
    dollars: 1_000_000_000_000,
    source: 'https://www.forbes.com/sites/tylerroush/2026/06/29/musk-is-a-trillionaire-again-spacex-and-tesla-boost-net-worth-by-50-billion/',
    asOf: '2026-06-29'
  },
  {
    date: '2026-07-31',
    event: 'SpaceX ends July down 37%. The largest one-month loss of personal wealth ever recorded.',
    dollars: 684_000_000_000,
    source: 'https://financefeeds.com/elon-musk-net-worth-709-billion-600b-crash-crypto-stake/',
    asOf: '2026-07-31'
  },
  {
    date: '2026-08-04',
    event: 'Where things stand.',
    dollars: 725_900_000_000,
    source: 'https://www.forbes.com/sites/forbeswealthteam/article/the-top-ten-richest-people-in-the-world/',
    asOf: '2026-08-04'
  }
];

/** July's loss, called out separately because Act IV subtracts it. */
export const julyLoss = {
  dollars: 363_000_000_000,
  label: 'Lost in July 2026',
  source: 'https://financefeeds.com/elon-musk-net-worth-709-billion-600b-crash-crypto-stake/',
  asOf: '2026-07-31'
};
```

- [ ] **Step 4: Create `src/data/referents.js`**

Placeholder values are not acceptable here, and neither are invented ones. Each entry below needs its source URL confirmed against the live figure before this task closes — replace the `dollars` with the sourced value and the `source` with the exact page. Any entry that cannot be confirmed gets deleted, per sourcing rule 2.

```javascript
/**
 * The ladder of recognizable human sums. Every one of these is passed
 * within the first fraction of a second of Act II, which is the point.
 * Ascending. All below $1B by design.
 */
export const referents = [
  {
    dollars: 80_610,
    label: 'Median US household income, one year',
    source: 'https://www.census.gov/library/publications/2025/demo/p60-283.html',
    asOf: '2025-09-01'
  },
  {
    dollars: 415_200,
    label: 'Median existing-home sale price',
    source: 'https://www.nar.realtor/research-and-statistics/housing-statistics/existing-home-sales',
    asOf: '2026-06-01'
  },
  {
    dollars: 1_700_000,
    label: 'What a median US earner makes in an entire working life',
    source: 'https://www.ssa.gov/policy/docs/research-summaries/lifetime-earnings.html',
    asOf: '2025-01-01'
  },
  {
    dollars: 16_390,
    label: 'One year of public school, one student',
    source: 'https://nces.ed.gov/programs/coe/indicator/cmb',
    asOf: '2025-05-01'
  },
  {
    dollars: 900_000,
    label: 'A new fire engine',
    source: 'https://www.usfa.fema.gov/',
    asOf: '2025-01-01'
  }
];
```

- [ ] **Step 5: Confirm every source, then sort**

For each entry: open the source URL, confirm the figure and its vintage, correct `dollars` and `asOf` to match, and delete any entry whose source does not actually publish the number. Then reorder the array ascending by `dollars` — the test in Step 1 enforces this and the draft above is deliberately out of order.

- [ ] **Step 6: Run test to verify it passes**

Run: `npm test src/data/data.test.js`
Expected: PASS, 7 tests. A failure on the ascending-order assertion means Step 5's reorder was skipped.

- [ ] **Step 7: Stage**

```bash
git add src/data/
```

---

### Task 7: Act 0 — the estimate line

**Files:**
- Create: `src/lib/EstimateLine.svelte`
- Modify: `src/routes/+page.svelte`
- Test: `src/lib/actZero.test.js`, `src/lib/actZero.js`

**Interfaces:**
- Consumes: `ACT_ZERO`, `linearFraction`, `formatShort` from `scaleEngine.js`.
- Produces: `<EstimateLine onCommit={(guessFraction) => void} />`; `guessToDollars(fraction)` and `guessError(fraction)` from `actZero.js`.

The guess-interpretation logic goes in a pure module so it is testable without a DOM. The component is input capture and rendering only.

- [ ] **Step 1: Write the failing test**

```javascript
import { describe, it, expect } from 'vitest';
import { guessToDollars, guessError } from './actZero.js';

describe('guessToDollars', () => {
  it('reads the left end as a million', () => {
    expect(guessToDollars(0)).toBe(1e6);
  });

  it('reads the right end as a trillion', () => {
    expect(guessToDollars(1)).toBe(1e12);
  });

  it('reads the midpoint as about half a trillion', () => {
    expect(guessToDollars(0.5)).toBeCloseTo(500_000_500_000, 0);
  });
});

describe('guessError', () => {
  it('reports how many times too large a midpoint guess is', () => {
    // Half a trillion guessed, one billion actual.
    expect(guessError(0.5).timesTooLarge).toBeCloseTo(500, 0);
  });

  it('reports no error for a perfect guess', () => {
    const perfect = 0.000999000999000999;
    expect(guessError(perfect).timesTooLarge).toBeCloseTo(1, 2);
  });

  it('reports the true fraction for the reveal', () => {
    expect(guessError(0.5).actualFraction).toBeCloseTo(0.000999, 6);
  });

  it('handles a guess at the far left without dividing by zero', () => {
    expect(Number.isFinite(guessError(0).timesTooLarge)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test src/lib/actZero.test.js`
Expected: FAIL — `Failed to resolve import "./actZero.js"`.

- [ ] **Step 3: Write `src/lib/actZero.js`**

```javascript
import { ACT_ZERO, linearFraction } from './scaleEngine.js';

/** What dollar amount the reader's marker position claims a billion is. */
export function guessToDollars(fraction) {
  return ACT_ZERO.min + fraction * (ACT_ZERO.max - ACT_ZERO.min);
}

/**
 * The size of the misconception, for the reveal.
 * `timesTooLarge` is the headline: a midpoint guess overshoots by ~500x.
 */
export function guessError(fraction) {
  const guessed = guessToDollars(fraction);
  return {
    guessedDollars: guessed,
    actualFraction: linearFraction(ACT_ZERO.target, ACT_ZERO.min, ACT_ZERO.max),
    timesTooLarge: guessed / ACT_ZERO.target
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test src/lib/actZero.test.js`
Expected: PASS, 7 tests.

- [ ] **Step 5: Build the component**

Create `src/lib/EstimateLine.svelte`. Requirements, all from the spec's accessibility section:

- Marker is a `role="slider"` with `aria-valuemin="0"`, `aria-valuemax="100"`, `aria-valuenow` tracking the guess as a percentage, and `aria-valuetext` reading the guessed amount via `formatShort`.
- Pointer drag via `pointerdown`/`pointermove`/`pointerup` with `setPointerCapture`.
- Arrow keys move the marker by 1%, Shift+Arrow by 10%, Home/End jump to the ends, Enter commits. The act is fully completable with no pointer.
- On commit, the marker animates from the guess to `actualFraction`. Under `prefers-reduced-motion: reduce`, it jumps and the travelled distance is stated in text instead.
- Reveal text names the number, not a verdict: no "wrong", no score. Framing is "here is what nearly everyone does," with the Landy citation as a footnote.

```svelte
<script>
  import { ACT_ZERO, formatShort } from './scaleEngine.js';
  import { guessError } from './actZero.js';

  let { onCommit } = $props();

  let guess = $state(0.5);
  let committed = $state(false);
  let markerFraction = $state(0.5);

  const result = $derived(guessError(guess));

  function commit() {
    if (committed) return;
    committed = true;
    markerFraction = result.actualFraction;
    onCommit?.(guess);
  }
</script>
```

The remaining markup, styling, and pointer/keyboard handlers are written against the requirements above. Line is `width: 100%` with a `min-width` that keeps the 0.0999% reveal legible on mobile — below roughly 320px the marker and the left label collide, so the reveal caption carries the "one pixel from the edge" statement in text rather than relying on the visual alone.

- [ ] **Step 6: Wire into the page**

```svelte
<script>
  import EstimateLine from '$lib/EstimateLine.svelte';

  let readerGuess = $state(null);
</script>

<h1>Three Zeros</h1>

<EstimateLine onCommit={(g) => (readerGuess = g)} />
```

`readerGuess` is held at the page level because Act IV calls back to it.

- [ ] **Step 7: Verify by hand**

Run: `npm run dev`

Check, in order:
1. Drag the marker, release — it animates to the far left and the reveal states the guess was ~500× too large.
2. Reload, Tab to the marker, use arrows and Enter — same result, no pointer.
3. Reload with `prefers-reduced-motion: reduce` set in devtools — marker jumps, no animation, distance stated in text.
4. Zoom to 200% — no overlap, no horizontal page scroll.
5. Narrow to 320px — reveal is still readable.

- [ ] **Step 8: Run the full suite**

Run: `npm run test:ci`
Expected: PASS, 51 tests across 3 files.

- [ ] **Step 9: Stage**

```bash
git add src/lib/EstimateLine.svelte src/lib/actZero.js src/lib/actZero.test.js src/routes/+page.svelte
```

---

## Self-Review

**Spec coverage for this plan's scope:**

| Spec requirement | Task |
|---|---|
| `scaleEngine.js` pure, fully tested | 2–5 |
| `positionOf` / `dollarsAt` | 2 |
| `linearFraction` and the 0.000999 reveal | 3 |
| `formatDollars` at each order of magnitude | 4 |
| `timeToComplete` backing the Act II readout | 5 |
| Data records carry source and date, enforced by test | 6 |
| Sourcing rule 2 — uncitable referents cut, not estimated | 6, Step 5 |
| Act 0 drag, reveal, retained guess | 7 |
| Act 0 keyboard equivalent | 7, Step 5 |
| Act 0 reduced-motion path | 7, Step 5 |
| Act 0 carries no correction language | 7, Step 5 |
| Plain numbers, no BigInt | 2 |

**Deferred to later plans, with nothing in this plan blocking them:** `VirtualScroll.svelte`, `Ribbon.svelte`, `ZoomGrid.svelte`, Acts I–IV, the coda, and the site-wide accessibility audit.

**Known soft spot:** Task 7 Step 5 specifies the component by requirement rather than by full source. The pure logic it depends on is fully specified and tested in Steps 1–4; the component is input plumbing over that logic, and writing 200 lines of speculative markup into a plan would be fiction. The five hand-verification checks in Step 7 are the acceptance criteria.

---

## Subsequent Plans

**Plan 2 — Act II.** `VirtualScroll.svelte` (wheel/touch/keyboard capture, owns position, never sets element height), `Ribbon.svelte` (canvas, O(viewport), devicePixelRatio-aware, coalesced rAF), the time-to-completion readout, referent crossings with throttled `aria-live`, escape hatches, and the reduced-motion static path. This is the plan with the real engineering in it.

**Plan 3 — Acts I, III, IV, coda.** Seconds, `ZoomGrid.svelte` and its nesting, the July subtraction with the Act 0 callback, the sourced referent and timeline tables, the build note, and a full WCAG 2.1 AA audit across all acts.
