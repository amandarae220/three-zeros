# Three Zeros — Design Spec

**Date:** 2026-08-05
**Status:** Draft for review — revision 2

## Problem

People treat "million," "billion," and "trillion" as the same word with a different adjective. Everyone knows a billion is a thousand millions. Nobody feels it.

The specific error is that the sequence *reads as linear*. Thousand, million, billion, trillion arrive as evenly spaced steps — first, second, third, fourth — when each one is a thousand times the last. This is measured, not assumed: [Landy, Silbert & Goldin, *Estimating Large Numbers*, Cognitive Science 2013](https://onlinelibrary.wiley.com/doi/full/10.1111/cogs.12028) found participants placing values on a number line as though the number words "constitute a uniformly spaced count list," most commonly putting a million squarely between a thousand and a billion. Follow-up work confirms the same compressive bias across cultures ([Landy et al. 2017](https://onlinelibrary.wiley.com/doi/full/10.1111/cogs.12342)).

That misconception is the subject of the piece, and Act 0 proves it on the reader before anything else happens.

## Subject

The world's first trillionaire, and the fact that he isn't one anymore.

Elon Musk crossed $1 trillion on 12 June 2026 when SpaceX began trading on the Nasdaq. He was above the line for twelve days. As of 4 August 2026 he is worth roughly $726 billion — about $594 billion below his peak, having lost a recorded $363 billion in July alone.

That arc is the piece's spine for one reason: **the number is so large that its own month-to-month noise exceeds the entire quantity the reader is struggling to picture.** He shed, in July, three hundred and sixty-three of the thing you cannot form a mental image of one of. The coronation is the setup. The evaporation is the ending.

## Goals

1. A reader leaves knowing, bodily, that the sequence is multiplicative, not sequential.
2. The piece demonstrates communication of a complex idea — the portfolio purpose.
3. The engineering is legible: the governing technical constraint and its solution are visible in the work.

## Non-Goals

- No user-supplied number input. The acts are authored, not parameterized.
- No prescription. The piece does not propose a tax, a policy, or a remedy.
- No comparison to other named individuals. One subject, because the arc is the argument.

## Editorial Stance

**Pointed.** The piece has a thesis: sums this large escape scrutiny precisely because nobody can picture them. Incomprehensibility is not a side effect of the number's size — it is the finding, and it is load-bearing. A figure that cannot be imagined cannot be argued with, and Act IV is the demonstration: $363 billion left in a month and the number was too large for anyone to feel it go.

The thesis is stated once, in the coda, in plain language. It is not repeated, and it is never asserted in place of a number. The piece argues by construction — the reader's own failed guess in Act 0, the scroll they abandon in Act II, the area they finally see in Act III — and says out loud at the end what those three failures add up to.

No prescription. The piece does not propose a tax, a cap, or a remedy, and does not tell the reader what to do with the conclusion. Its claim is about comprehension, not policy.

Three rules hold throughout:

1. Every figure carries a source and an as-of date, rendered on the page.
2. Where sources disagree, say so on the page rather than picking the friendlier number.
3. No adjective does work a number can do.

## Prior Art

| Piece | Mechanic | Borrowed | Rejected |
|---|---|---|---|
| [Scroll to a Billion](https://aeiowu.com/billion/) | Native scroll, 1px = 100 | Milestone markers accelerating past; explicit arrival moment | Stops at a billion; bound by DOM height |
| [If the Moon Were Only 1 Pixel](https://www.joshworth.com/dev/pixelspace/pixelspace_solarsystem.html) | Native horizontal scroll | Commentary placed in the empty stretches; autoscroll | 5.5-hour traversal with no escape hatch |
| [Wealth Shown to Scale](https://mkorostoff.github.io/1-pixel-wealth/) | Native scroll, $1,000 = 1px | Interruptions that reframe the distance just covered | Static subject; no arc, no reversal |
| [MegaPenny Project](https://kokogiak.com/megapenny/) | Static physical renders | Physical objects land faster than abstract dots | Static; no sense of travel |
| [Wait But Why: 1 to 1,000,000](https://waitbutwhy.com/2014/11/from-1-to-1000000.html) | Nested dot grids | Nesting as the resolution device | No interaction |

None of the prior art proves the misconception on the reader, and none has a subject that moves. Those are the two things this piece adds.

## The Governing Constraint

Maximum element height is approximately **33,554,428 px in Chrome** and **17,895,697 px in Firefox**; Safari is lower. Native scroll cannot represent a trillion at any honest rate:

| Rate | $1M | $1B | $1T |
|---|---|---|---|
| $100 / px | 10,000 px | 10,000,000 px | 10,000,000,000 px |
| Fits native scroll? | Yes | Yes (Chrome only) | **No — over by ~298×** |

Act II is therefore virtualized: the app owns its position value and renders a window onto it. Element height stops being the limit. The constraint and its resolution are stated on the page, in the coda.

## Structure

### Act 0 — The Line

The thesis, proved on the reader, before any assertion is made.

A horizontal line. `$1,000,000` labelled at the left end, `$1,000,000,000,000` at the right. One prompt: **drag the marker to where a billion belongs.**

The reader commits. Then the reveal: a billion sits at **0.0999%** of that span. On a 1,000px line it is one pixel from the left edge — visually indistinguishable from the starting label. The marker animates from where they put it to where it goes, and the distance it travels is the size of the misconception, in their own hand.

Their guess is retained and referenced later ("you put it here"). The Landy citation appears here, sized as a footnote, not a lecture.

This act is small, fast, and load-bearing. Everything after it is elaboration.

### Act I — Seconds

Short. Retires the "but I already know a billion is bigger" objection using time, where intuition already exists.

- 1,000,000 seconds = 11.6 days
- 1,000,000,000 seconds = 31.7 years
- 1,000,000,000,000 seconds = 31,688 years

Anchored to a human frame: a week and a half ago; a working life; before agriculture. Act I buys the patience Act II spends.

### Act II — The Scroll

Canvas ribbon at a fixed, honest **$100 per pixel**, from $0 to **exactly $1 trillion** — the threshold Musk crossed on 12 June 2026. Position is owned by the app, not the scrollbar.

The endpoint is a threshold, not an estimate, and that is why it is safe to hardcode. Net worth figures are revised constantly; "the first person on record to cross a trillion dollars" is fixed for good. Ending here also makes every act in the piece terminate at the same number — Act 0's line, Act II's ribbon, and Act III's grid all end at a trillion.

| Amount | Pixels | Screens (1080px) | Time at 3,000 px/sec |
|---|---|---|---|
| $1,000,000 | 10,000 | ~9 | ~3 seconds |
| $1,000,000,000 | 10,000,000 | ~9,260 | ~55 minutes |
| $1,000,000,000,000 | 10,000,000,000 | ~9,259,259 | **~39 days** |

The reader clears a million in about three seconds and feels capable. That feeling is the setup.

A persistent readout shows time-to-completion at the reader's current speed. In the millions it reads in seconds; on entering the billions, in minutes; on entering the trillions, in weeks. **The reader is not expected to finish. Abandoning Act II is the intended ending**, and the interface says so plainly rather than letting it read as a broken page.

Referents appear as the ribbon passes them — a lifetime of median earnings, a median home, a fire engine, a school's annual budget, an airliner, a hospital — each a fixed dollar amount with a citation. They cluster invisibly near zero, which is the point: the entire ladder of recognizable human sums is over before the scroll has meaningfully begun.

Escape hatches, always visible: jump to $1B, jump to $1T, exit to Act III.

### Act III — Zoom Out

The resolution, and the only act where a trillion fits inside a viewport.

One filled square = $1,000,000. A grid of 1,000 squares fills one screen — that is a billion, entirely visible at once. The whole screen then collapses to a single dot, and a grid of those dots is a trillion.

Once the trillion grid is on screen, the arc lands on it as area: the 16 June peak sits above the line, 4 August well below it. The gap is visible as area for the first time.

### Act IV — What Evaporated

The close, and the act that only exists because the subject moves.

Act III's grid stays. July is applied: **$363 billion** of squares are removed, live. What vanishes is 363 times the entire quantity the reader spent Act II failing to cross once — drained in thirty-one days, by a stock price, without anyone able to picture it happening.

Callback to Act 0: the amount that evaporated unnoticed is larger than where the reader originally guessed a billion belonged.

### Coda

Three parts. The referent table, sourced and dated. A timeline of the arc — IPO, peak, fall below, brief recovery, July, today — with sources. And a short build note: the 33.5M px ceiling, why the scrollbar had to be replaced, and how the piece stays keyboard- and screen-reader-navigable while owning the scroll. The coda is where the portfolio purpose is served explicitly.

## Data

### Subject Timeline

Every entry renders with its source and date. Values are point-in-time and labelled as such.

| Date | Event | Figure |
|---|---|---|
| 2026-06-12 | SpaceX begins trading on Nasdaq; IPO priced at $135 | Musk crosses $1T |
| 2026-06-16 | SpaceX closing high $211.39 | Peak ~$1.32T |
| 2026-06-24 | Falls below $1T after SpaceX decline | ~$962B |
| 2026-06-29 | Brief recovery on SpaceX and Tesla gains | Above $1T |
| 2026-07-31 | SpaceX down 37% over July | Record single-month loss ~$363B |
| 2026-08-04 | Forbes real-time | ~$725.9B |

### Known Source Conflict

Reporting on the June peak differs — approximately $1.32T (Forbes, on the 16 June close) versus ~$1.45T (intraday). The page uses the closing-price figure, states the number it uses, and notes the conflict rather than silently choosing. Rule 2 of the Editorial Stance applies.

### Sourcing Rules

1. Every figure carries a source URL and an as-of date, rendered on the page.
2. Any referent without a citable federal-statistical, trade-association, or major-outlet source is cut, not estimated. This will likely eliminate "a large hospital construction project," which varies too widely to cite honestly.
3. All values live as integers in `data/` with the source attached to the same record. No number appears in the UI that is not in that data.
4. The piece states its as-of date prominently. A live-updating figure is explicitly out of scope; the arc is the subject, not the ticker.

## Architecture

Stack matches `where-it-counts`: SvelteKit + `adapter-static`, d3 (scales and formatting only), Vitest, deployed to Vercel.

```
src/lib/
  scaleEngine.js       pure: position <-> dollars, milestone lookup, formatting
  EstimateLine.svelte  Act 0 drag-to-guess, retains the guess
  VirtualScroll.svelte input capture -> position value
  Ribbon.svelte        canvas renderer, visible window only
  ZoomGrid.svelte      Acts III and IV nested grids
src/data/
  referents.js         amount, label, source, vintage
  timeline.js          date, event, figure, source
src/routes/
  +page.svelte         act sequencing
```

### `scaleEngine.js`

Pure module, no DOM, no Svelte. Carries the entire numeric contract and all of the unit tests.

- `dollarsAt(position)` — position in px to dollars
- `positionOf(dollars)` — inverse
- `referentsInRange(fromDollars, toDollars)` — which referents fall in a window
- `formatDollars(n)` — display formatting
- `timeToComplete(position, pxPerSecond)` — the readout's backing value
- `linearFraction(value, min, max)` — Act 0's reveal; `linearFraction(1e9, 1e6, 1e12)` returns `0.000999`

$1T at $100/px is exactly 10^10 px, well inside `Number.MAX_SAFE_INTEGER`. Plain numbers throughout; BigInt is not needed and is not used.

### `VirtualScroll.svelte`

Owns a single `position` value. Consumes wheel, touch drag, and keyboard. Emits position changes. Never sets element height. Handles touch momentum and clamps to `[0, positionOf(1e12)]`.

### `Ribbon.svelte`

Canvas. Renders only the pixels currently on screen — cost is O(viewport), independent of total scale. `devicePixelRatio`-aware. Redraws on position change via coalesced `requestAnimationFrame`. No per-frame allocation.

## Accessibility

Owning the scroll means owning every affordance the scrollbar provided. Non-negotiable:

- `prefers-reduced-motion: reduce` — autoscroll off by default; Act II renders as a static summary carrying the same referent content; Act IV's removal animation becomes a before/after pair.
- Act 0's drag has a keyboard equivalent: arrow keys move the marker, Enter commits. The act is fully completable without a pointer.
- Keyboard in Act II — arrows, PageUp/PageDown, Home, End all map to position. End jumps to a trillion.
- A persistent skip link to Act III, present from the first frame of Act II.
- `aria-live="polite"` announcing each referent as it is crossed, throttled so it cannot flood.
- The full referent list exists as real DOM, visually hidden, so canvas is never the sole source of content.
- Focus is never trapped. The reader can Tab out of any act.
- WCAG 2.1 AA contrast on all text and on the ribbon's marks against their background.

## Testing

`scaleEngine.js` is unit-tested in full: round-tripping `positionOf`/`dollarsAt`; referent range boundaries, inclusive and exclusive at exact values; formatting at each order of magnitude; `timeToComplete` at the three headline amounts; and `linearFraction` against the Act 0 reveal value. Components get smoke coverage for keyboard mapping, the reduced-motion branch, and Act 0's commit-and-reveal cycle. Both data files are tested for the invariant that every record carries a non-empty source and date.

## Risks

| Risk | Mitigation |
|---|---|
| The piece takes a position on a living person's wealth, and rigor is its only defense | Every figure sourced and dated; the June peak's source conflict disclosed on the page; thesis stated once and confined to comprehension; no prescription anywhere |
| A pointed thesis slides into editorializing across four acts | Thesis appears only in the coda. Acts 0–IV carry no argumentative adjectives — they present the reader's guess, the scroll, the grid, and the subtraction, and let those land |
| Figures go stale — he may cross $1T again, or fall further | No figure in the piece needs maintaining. The ribbon ends at a threshold that cannot be revised; every net-worth estimate appears only as dated timeline data, never as a scale constant. Live updating is explicitly out of scope |
| Readers experience Act II as broken rather than as the point | Time-to-completion readout plus always-visible escape hatches frame abandonment as intended |
| Scroll interception feels hostile | Reduced-motion static path, full keyboard mapping, skip link, no focus trap |
| Act 0 feels like a quiz the reader can fail | Framing is "here is what everyone does," with the research cited; no score, no wrong answer, no correction language |
| Mobile touch momentum feels wrong at extreme scale | Tune against real devices; touch is a first-class input, not a fallback |
| Canvas redraw jank on low-end hardware | O(viewport) rendering; coalesced rAF; no per-frame allocation |

## Open Questions

1. **Project name.** `three-zeros` is a working title. With the subject and stance settled, "Twelve Days" is the stronger candidate — it names the arc rather than the arithmetic, and it carries the reversal.
