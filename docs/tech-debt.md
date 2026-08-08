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

## Act II components have no browser verification yet

**Where:** [`Ribbon.svelte`](../src/lib/Ribbon.svelte),
[`VirtualScroll.svelte`](../src/lib/VirtualScroll.svelte)

The 88 unit tests cover the pure modules only. The components were verified by
compiling them and by running their logic in Node — the tick loop's iteration
count and the wheel clamp-release rule both check out that way.

Nothing browser-only has been exercised: `devicePixelRatio` scaling, the palette
resolving through `getComputedStyle`, `ResizeObserver` firing, pointer capture,
momentum feel, or whether the page actually releases the wheel at both ends.

**To close:** Plan 2 Task 8.
