# Tech Debt

Open items deferred during the build. Each says what was done, why, and what
decision or work would close it.

Opened 2026-08-07, during Plan 2 (Act II).

---

## Copy: the plan's "0.001% of the way" is wrong

**Where:** [`ActTwo.svelte`](../src/lib/ActTwo.svelte), the `.cleared` line — and
[the Act II plan](plans/2026-08-06-act-two-virtual-scroll.md), Task 6.

The plan specifies the line "That was every sum on the ladder. You are 0.001% of
the way." The last referent is $1.6M, which is position 16,000 of 10,000,000,000
— **0.00016%**, roughly 6× smaller than the plan claims.

The component computes the figure from `position / MAX` rather than hardcoding
it, so what ships is correct and cannot drift if a referent changes. The plan
document still carries the wrong number.

**To close:** confirm the real figure is the one we want on the page (it is more
punishing than the plan intended), and correct the plan text so the two agree.

---

## Placeholder mount point for Act III

**Where:** [`+page.svelte`](../src/routes/+page.svelte)

Act II's skip link points at `#act-three`. With no such element, prerender fails
outright, so the page carries an empty `<div id="act-three" tabindex="-1">` as a
real focus target.

**To close:** delete the placeholder when Act III's real section lands, and check
the skip link still lands focus somewhere meaningful.

---

## Canvas tick labels use monospace, not system sans

**Where:** [`Ribbon.svelte`](../src/lib/Ribbon.svelte), `measure()`

The plan asks for 11px system sans with `tabular-nums`. Canvas `ctx.font` takes
the CSS font shorthand, which has no slot for `font-variant-numeric` —
`tabular-nums` cannot be set on a 2D context at all. A monospace stack is the
achievable route to the same intent: uniform digit widths, so labels don't
ripple as they scroll.

**To close:** decide between uniform digits (monospace, current) and matching the
piece's typeface (`system-ui`, variable-width digits). Cosmetic either way.

---

## `role="scrollbar"` is a stronger claim than the plan made

**Where:** [`VirtualScroll.svelte`](../src/lib/VirtualScroll.svelte)

The plan asked for "`role="scrollbar"`-equivalent semantics." The component uses
the real role, with `aria-valuenow`, `aria-valuetext`, `aria-controls` and
`aria-orientation`. Screen readers will announce it as an operable scrollbar,
which is accurate — but `role="slider"` or a plain focusable region with a live
readout are defensible alternatives.

**To close:** test with VoiceOver and NVDA during Plan 2 Task 8 and settle the
role. Unverified against a real screen reader as of writing.

---

## Referent cards show one at a time

**Where:** [`ActTwo.svelte`](../src/lib/ActTwo.svelte), the `current` derivation

The plan says each card "appears" as its amount is passed, without saying whether
earlier cards persist. All four clear inside 16,000px — well under a second at
speed — so accumulating them would flash four cards into a heap. The component
renders only the most recently passed referent.

**To close:** confirm one-at-a-time is the intended reading, or switch to
accumulating with a scroll-away treatment.

---

## The speed readout reads a slow scroll as stopped

**Where:** [`velocity.js`](../src/lib/velocity.js), `speed()`

`createSpeedTracker` returns 0 whenever fewer than two samples sit inside the
500ms window. A reader making one slow scroll per second therefore reads as
stopped, and `formatDuration(Infinity)` renders "never".

This behaviour is specified by the plan's own tests, and arguably correct for a
piece whose subject is futility. It is recorded because it will look like a bug
in the browser before it looks like an argument.

**To close:** decide whether "never" is the intended readout for a slow scroller.
`ActTwo` currently holds the last real duration rather than showing it, which
softens but does not remove the question.

---

## Act II browser verification — mostly closed

**Closed 2026-08-07 by Plan 2 Task 8.** 39/39 Playwright checks pass, covering
the height ceiling, depth-independent tick count, wheel exchange rate, clamp
release, jump targets, live-region throttling, the reduced-motion path and
narrow-viewport overflow.

Two things remain unverified:

- **No real screen reader has run against this.** The checks assert ARIA
  attributes and DOM text, which is not the same as VoiceOver or NVDA making
  sense of it. See the `role="scrollbar"` item above.
- **Momentum has never been felt on a touch device.** The decay factor (0.95)
  was picked, not derived — the plan flagged it as empirical. Playwright drives
  a mouse, so the coast has only been exercised synthetically.

**To close:** one pass with VoiceOver, and one with a real phone.

---

## Contrast is verified by sampling, not by eye

**Where:** the palette in [`+page.svelte`](../src/routes/+page.svelte)

The audit samples every text node's computed colour against its nearest painted
background and calculates the ratio — 161 nodes, both themes, all passing AA.
Two things that method cannot see: text drawn *on* the canvas (Act II's tick
labels, Act III's threshold label), which is painted pixels rather than a DOM
node, and whether the darker light-mode tones still read as a deliberate
hierarchy rather than as three greys that drifted together.

**To close:** look at the page in both themes, and check the canvas labels
against their backdrop by hand.

---

## Act III's step thresholds and Act IV's timing are unfelt

**Where:** [`ActThree.svelte`](../src/lib/ActThree.svelte) `rootMargin`,
[`grid.js`](../src/lib/grid.js) `REMOVAL_MS`

`rootMargin: '-50% 0px -50% 0px'` fires each step at the viewport midpoint, and
`REMOVAL_MS = 4000` is how long July takes to drain. Both were picked, not
derived, and both have only ever been exercised by Playwright driving synthetic
scrolls. Neither has been judged on a real trackpad.

**To close:** scroll Act III by hand and watch Act IV once, then adjust.

---

## The verification suite lives outside the repo

**Where:** `scratchpad/verify/check.mjs`, currently under a Claude Code session
scratchpad, with its own `package.json` and a Playwright install.

Every check is throwaway by location but not by value — 39 of them now encode
claims about Acts 0 and II that no unit test covers. A new session gets a new
scratchpad, and the file is one `rm` from gone.

**To close:** decide whether it moves into the repo as `e2e/` with Playwright as
a dev dependency, or stays deliberately outside it. If it stays out, copy it
somewhere durable.
