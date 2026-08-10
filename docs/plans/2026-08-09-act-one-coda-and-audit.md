# Act I, the Coda, and the Audit — Implementation Plan

**Goal:** Finish the piece — Act I buys the patience Act II spends, the coda pays off the portfolio purpose by showing the sources and the engineering constraint in plain sight, and a site-wide audit proves the whole thing is usable by keyboard and screen reader at 200% zoom.

**Architecture:** One new pure module, `time.js`, converts seconds to human durations, because Act I's entire argument is three divisions and they belong in a tested module rather than in a template. One new data module, `durations.js`, holds the human anchors with their sources. `ActOne.svelte` and `Coda.svelte` are presentational — no canvas, no observers, no motion — so neither needs a reduced-motion branch. The audit is checks, not code.

**Tech Stack:** SvelteKit 2 + `adapter-static`, Svelte 5 runes, Vite 8, Vitest 4. No new runtime dependencies. The audit extends the existing Playwright suite.

## Global Constraints

- Everything in Plans 1–3's Global Constraints still applies — plain JS numbers, no number in a component that is not imported from `src/lib/` or `src/data/`, WCAG 2.1 AA, **`git add` only, never commit.**
- `SECONDS_PER_YEAR = 31_557_600` declared once in `time.js` — a Julian year, 365.25 days. This is the convention under which a billion seconds is 31.7 years and a trillion is 31,688; a 365-day year gives visibly different figures and the spec's numbers would stop matching.
- Act I renders between Act 0 and Act II. It is short by design — three figures and three anchors. **It must not become a fifth act.**
- Every anchor that makes a claim about the world carries a source and an as-of date. An anchor that is pure arithmetic ("eleven and a half days") does not, and `durations.js` enforces exactly that distinction rather than requiring a citation for a division.
- The coda states the piece's as-of date prominently, per sourcing rule 4.
- **Link text must be self-describing.** The acts currently render several links reading only "Source", which fails WCAG 2.4.4 when read out of context in a screen reader's link list. Fixing this is Task 6, and it touches every act already shipped.

---

### Task 1: `time.js` — seconds as human duration

**Files:**
- Create: `src/lib/time.js`
- Test: `src/lib/time.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces: `SECONDS_PER_DAY`, `SECONDS_PER_YEAR`, `humanDuration(seconds)`.

Act I's whole claim is that a million, a billion and a trillion seconds are eleven days, a working life, and deep prehistory. Those are three divisions, and they are the act — so they are tested, not typed into a template.

- [ ] **Step 1: Write the failing test**

```javascript
import { describe, it, expect } from 'vitest';
import { SECONDS_PER_DAY, SECONDS_PER_YEAR, humanDuration } from './time.js';

describe('constants', () => {
  it('counts a day in seconds', () => {
    expect(SECONDS_PER_DAY).toBe(86_400);
  });

  it('uses a Julian year', () => {
    // 365.25 days. A 365-day year puts a trillion seconds at 31,710 years and
    // the spec's figures stop matching.
    expect(SECONDS_PER_YEAR).toBe(31_557_600);
  });
});

describe('humanDuration', () => {
  it('makes a million seconds eleven and a half days', () => {
    expect(humanDuration(1e6)).toBe('11.6 days');
  });

  it('makes a billion seconds a working life', () => {
    expect(humanDuration(1e9)).toBe('31.7 years');
  });

  it('makes a trillion seconds deep prehistory', () => {
    expect(humanDuration(1e12)).toBe('31,688 years');
  });

  it('drops the decimal on whole units', () => {
    expect(humanDuration(SECONDS_PER_DAY)).toBe('1 day');
    expect(humanDuration(SECONDS_PER_YEAR)).toBe('1 year');
  });

  it('pluralises', () => {
    expect(humanDuration(SECONDS_PER_DAY * 2)).toBe('2 days');
  });

  it('groups large figures', () => {
    expect(humanDuration(SECONDS_PER_YEAR * 31_688)).toBe('31,688 years');
  });

  it('drops to hours and minutes below a day', () => {
    expect(humanDuration(3600)).toBe('1 hour');
    expect(humanDuration(90)).toBe('1.5 minutes');
    expect(humanDuration(30)).toBe('30 seconds');
  });

  it('holds at zero', () => {
    expect(humanDuration(0)).toBe('0 seconds');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/time.test.js`
Expected: FAIL — `Failed to resolve import "./time.js"`.

- [ ] **Step 3: Write minimal implementation**

```javascript
export const SECONDS_PER_DAY = 86_400;

/** A Julian year — 365.25 days. See the note in the plan's constraints. */
export const SECONDS_PER_YEAR = 31_557_600;

const UNITS = [
  { seconds: SECONDS_PER_YEAR, name: 'year' },
  { seconds: SECONDS_PER_DAY, name: 'day' },
  { seconds: 3600, name: 'hour' },
  { seconds: 60, name: 'minute' },
  { seconds: 1, name: 'second' }
];

const GROUPED = new Intl.NumberFormat('en-US');

/**
 * The largest unit the duration fills, to one decimal below 100 and whole
 * numbers above it. Precision past that would be false — these are arguments
 * about scale, not measurements.
 */
export function humanDuration(seconds) {
  const unit = UNITS.find((u) => seconds >= u.seconds) ?? UNITS[UNITS.length - 1];
  const value = seconds / unit.seconds;
  const rounded = value < 100 ? Math.round(value * 10) / 10 : Math.round(value);
  const text = GROUPED.format(rounded);
  return `${text} ${unit.name}${rounded === 1 ? '' : 's'}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/time.test.js`
Expected: PASS, 10 tests.

- [ ] **Step 5: Stage**

```bash
git add src/lib/time.js src/lib/time.test.js
```

---

### Task 2: `durations.js` — the human anchors

**Files:**
- Create: `src/data/durations.js`
- Test: `src/data/data.test.js` (extend)

**Interfaces:**
- Consumes: nothing.
- Produces: `durations: Array<{ seconds, label, anchor, claim?, source?, asOf? }>`.

The existing invariant in `data.test.js` requires every record to carry a positive `dollars`, which these do not — they are time. They get their own collection and their own invariant.

- [ ] **Step 1: Write the failing test**

Append to `src/data/data.test.js`:

```javascript
import { durations } from './durations.js';

describe('durations', () => {
  it('covers a million, a billion, and a trillion seconds', () => {
    expect(durations.map((d) => d.seconds)).toEqual([1e6, 1e9, 1e12]);
  });

  it('gives every entry a label and an anchor', () => {
    for (const d of durations) {
      expect(d.label, JSON.stringify(d)).toBeTruthy();
      expect(d.anchor, JSON.stringify(d)).toBeTruthy();
    }
  });

  it('sources every anchor that claims something about the world', () => {
    // An anchor that is pure arithmetic needs no citation. One that asserts a
    // fact — when farming began, how long a career runs — does.
    for (const d of durations.filter((entry) => entry.claim)) {
      expect(d.source, JSON.stringify(d)).toMatch(/^https?:\/\//);
      expect(d.asOf, JSON.stringify(d)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
    expect(durations.filter((d) => d.claim).length).toBeGreaterThan(0);
  });

  it('carries no dollar figures — this act is about time', () => {
    for (const d of durations) {
      expect(d.dollars).toBeUndefined();
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/data/data.test.js`
Expected: FAIL — `Failed to resolve import "./durations.js"`.

- [ ] **Step 3: Write minimal implementation**

```javascript
/**
 * Act I retires the "I already know a billion is bigger" objection using time,
 * where intuition already exists. Three divisions and three anchors.
 *
 * `claim` marks an anchor that asserts something about the world rather than
 * restating the arithmetic. Those carry a source; the arithmetic does not.
 */
export const durations = [
  {
    seconds: 1e6,
    label: 'A million seconds',
    anchor: 'A week and a half. You have already lived through it since the last time you thought about a million dollars.'
  },
  {
    seconds: 1e9,
    label: 'A billion seconds',
    anchor: 'A working life, end to end.',
    claim: 'Median US work-life expectancy at age 25 is roughly 35 years.',
    source: 'https://www.bls.gov/opub/mlr/2019/article/projections-of-the-labor-force-2019-29.htm',
    asOf: '2019-09-01'
  },
  {
    seconds: 1e12,
    label: 'A trillion seconds',
    anchor: 'Before farming. Before writing. Before anything you would recognise as a society.',
    claim: 'Agriculture began roughly 12,000 years ago — a trillion seconds is more than twice as long.',
    source: 'https://education.nationalgeographic.org/resource/development-agriculture/',
    asOf: '2022-10-19'
  }
];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/data/data.test.js`
Expected: PASS, all existing data tests plus 4.

- [ ] **Step 5: Stage**

```bash
git add src/data/durations.js src/data/data.test.js
```

---

### Task 3: `ActOne.svelte` — Seconds

**Files:**
- Create: `src/lib/ActOne.svelte`
- Modify: `src/routes/+page.svelte`

**Interfaces:**
- Consumes: `humanDuration` from `time.js`; `durations` from `../data/durations.js`.
- Produces: `<ActOne />`, mounted between `EstimateLine` and `ActTwo`.

Requirements:

- Three rows, one per duration: the label, the duration from `humanDuration(d.seconds)`, and the anchor. Rendered as a `<dl>` or a table — a real semantic structure, not divs.
- The figure is never typed. Every duration comes from `humanDuration`, so the page cannot disagree with the tests.
- Anchors carrying a `claim` render the claim and a source link with its as-of date. Anchors without one render neither, and no empty source affordance appears.
- One closing line, stated once: the same three words — million, billion, trillion — that read as a list are three orders of magnitude, and Act II is about to make the reader feel the second one.
- No canvas, no observer, no animation. **No reduced-motion branch** — there is no motion to suppress, and adding a branch that renders identical content would be dead code.
- Section carries `id="act-one"` and an `aria-labelledby` heading, matching the other acts.

- [ ] **Step 1: Write the component per the requirements above**
- [ ] **Step 2: Wire into `+page.svelte` between `EstimateLine` and `ActTwo`**
- [ ] **Step 3: Verify in the browser that the three figures read 11.6 days, 31.7 years, and 31,688 years**
- [ ] **Step 4: Stage**

```bash
git add src/lib/ActOne.svelte src/routes/+page.svelte
```

---

### Task 4: `Coda.svelte` — sources and the arc

**Files:**
- Create: `src/lib/Coda.svelte`
- Modify: `src/routes/+page.svelte`

**Interfaces:**
- Consumes: `referents` from `../data/referents.js`; `timeline`, `julyLoss` from `../data/timeline.js`; `formatDollars` from `scaleEngine.js`.
- Produces: `<Coda />`, mounted last.

Requirements:

- **The referent table.** All four referents with amount, note, source and as-of date. A real `<table>` with a caption and column headers.
- **The timeline.** Every entry in `timeline` with date, event, figure, source and as-of date. Entries carrying a `conflict` render the competing figure, its note and its source in the same row — the disagreement is shown, not resolved silently. `julyLoss` appears as its own row.
- **The as-of date, prominently.** The piece's reading date is the last timeline entry's `asOf`. It renders at the top of the coda in its own line, not buried in a table cell. Sourcing rule 4.
- Every figure comes from data via `formatDollars`. No number is typed into the template.
- Section carries `id="coda"` and an `aria-labelledby` heading.

- [ ] **Step 1: Write the component per the requirements above**
- [ ] **Step 2: Wire into `+page.svelte` below `ActFour`**
- [ ] **Step 3: Stage**

```bash
git add src/lib/Coda.svelte src/routes/+page.svelte
```

---

### Task 5: The build note

**Files:**
- Modify: `src/lib/Coda.svelte`

**Interfaces:**
- Consumes: `DOLLARS_PER_PIXEL`, `TRILLION`, `positionOf` from `scaleEngine.js`.
- Produces: the third part of the coda.

This is where the portfolio purpose is served explicitly. The constraint and its resolution are stated in plain language, with the numbers computed rather than asserted.

Requirements:

- State the ceiling: approximately 33,554,428px in Chrome, 17,895,697px in Firefox, lower in Safari. These are browser facts and carry a source.
- State the arithmetic: at `DOLLARS_PER_PIXEL`, a trillion is `positionOf(TRILLION)` pixels — computed, not typed — which overruns Chrome's ceiling by a factor the page calculates and prints.
- State the resolution in two sentences: the app owns a position value, the renderer draws only the visible window, and element height stops being the limit.
- State how the piece stays navigable while owning the scroll: the wheel is released at both ends so the page is never trapped, every jump target is a real button in the tab order, the canvas is `aria-hidden` with the content in the DOM beside it, and a reduced-motion reader gets a static path rather than a degraded one.
- **No adjective does work a number can do.** "Roughly 298 times over" is computed from the two figures.

- [ ] **Step 1: Write the build note**
- [ ] **Step 2: Verify the overrun factor printed on the page matches `positionOf(TRILLION) / 33_554_428`**
- [ ] **Step 3: Stage**

```bash
git add src/lib/Coda.svelte
```

---

### Task 6: Fix ambiguous link text across every act

**Files:**
- Modify: `src/lib/ActTwo.svelte`, `src/lib/ActThree.svelte`, `src/lib/ActFour.svelte`, `src/lib/Coda.svelte`

**Interfaces:**
- Consumes: nothing.
- Produces: no new exports — an accessibility correction to shipped code.

Every act currently renders links reading only "Source" or "Other figure". A screen reader's link list shows them stripped of surrounding context, so the page presents a dozen indistinguishable links. WCAG 2.4.4.

Requirements:

- Every source link gets an accessible name naming what it sources: `aria-label={`Source for ${label}, as of ${asOf}`}`. The visible text stays short — the label carries the context.
- No link opens a new tab, so no warning is owed. Keep `rel="noreferrer"`.
- The conflict links in Acts III and IV name the competing figure, not "Other figure".

- [ ] **Step 1: Add accessible names to every source link**
- [ ] **Step 2: Verify no two links on the page share an accessible name unless they share a destination**
- [ ] **Step 3: Stage**

```bash
git add src/lib/ActTwo.svelte src/lib/ActThree.svelte src/lib/ActFour.svelte src/lib/Coda.svelte
```

---

### Task 7: Page frame — one `h1` and a heading order

**Files:**
- Modify: `src/routes/+page.svelte`

**Interfaces:**
- Consumes: nothing.
- Produces: the page's title block.

The page has no `h1`. Every act opens at `h2`, so the document currently begins at the second level — an outline with no top. This is a WCAG 1.3.1 / 2.4.6 finding and it exists because the acts were built before the page around them.

Requirements:

- One `<h1>` naming the piece, with the standfirst beneath it.
- Heading order runs `h1` → `h2` per act → `h3` inside the coda, with no level skipped.
- `<main>` is the only `main` landmark; each act stays a `<section>` with an accessible name.

- [ ] **Step 1: Add the title block**
- [ ] **Step 2: Verify the heading outline has no gaps**
- [ ] **Step 3: Stage**

```bash
git add src/routes/+page.svelte
```

---

### Task 8: Site-wide accessibility audit

**Files:**
- Modify: `scratchpad/verify/check.mjs` — the Playwright suite. It lives outside the repo; see [tech-debt.md](../tech-debt.md).

The piece is finished, so the audit runs against the whole page rather than one act.

- [ ] **Step 1: Add the checks**

1. Exactly one `<h1>`, and the heading order never skips a level.
2. One `main` landmark; every `<section>` has an accessible name.
3. Every interactive element is reachable by Tab, and Tab order matches visual order down the page.
4. No keyboard trap: Tab from the first element to the last and back with `Shift+Tab`, without getting stuck — including through Act II's scroll capture.
5. Every focusable element shows a visible focus indicator distinguishable from its unfocused state.
6. No two links share an accessible name unless they share an `href`.
7. Every `<canvas>` is `aria-hidden="true"`, and no `<img>` lacks `alt`.
8. Body text contrast is at least 4.5:1 and UI/large text at least 3:1, in both light and dark.
9. At 200% zoom and at 320px, no horizontal overflow anywhere on the page.
10. Under `prefers-reduced-motion: reduce` the whole page renders zero canvases and every figure survives as text.
11. `<html lang>` is set and the page has a non-empty, descriptive `<title>`.
12. Act I's three figures read exactly 11.6 days, 31.7 years, 31,688 years.
13. The coda lists every referent, every timeline entry, and both conflicting figures.
14. The build note's overrun factor matches `positionOf(TRILLION) / 33_554_428` to the nearest whole number.

- [ ] **Step 2: Run the suite**

Run: `node check.mjs` with `npm run dev` already running.
Expected: all 62 existing checks plus all 14 above, passing.

---

## Self-Review

**Spec coverage:**

| Spec requirement | Task |
|---|---|
| Act I — three durations anchored to human frames | 1, 2, 3 |
| Act I buys the patience Act II spends | 3 |
| Coda — the referent table, sourced and dated | 4 |
| Coda — the timeline of the arc, with sources | 4 |
| Coda — the build note, ceiling and resolution | 5 |
| Known source conflict shown, not resolved | 4 |
| The piece states its as-of date prominently | 4 |
| No number in the UI that is not in data | 1, 3, 4, 5 |
| Site-wide WCAG 2.1 AA | 6, 7, 8 |

**Nothing is deferred.** This plan closes the spec. What remains after it is the tech-debt list, which is decisions rather than construction.

**Known soft spots:**

1. **Task 3 and 4 specify components by requirement rather than full source**, consistent with Plans 1–3. These two are the least risky instances of that tradeoff — both are presentational, and Task 8's checks pin their figures.
2. **The work-life anchor is the weakest citation in the piece.** BLS publishes work-life expectancy irregularly and the 2019 figure is the most recent clean one. If it will not hold up, cut the anchor rather than estimate it — sourcing rule 2, exactly as two referents were already cut.
3. **Contrast checking in Playwright is approximate.** Computed colours can be sampled and the ratio calculated, but text over the canvas cannot be sampled reliably. Where automation is not trustworthy, the check reports the measured pairs rather than asserting a pass.
4. **Task 6 changes shipped acts for an accessibility defect found while planning.** It is not new construction, and it is worth doing before the audit rather than having the audit report a dozen instances of the same fault.
