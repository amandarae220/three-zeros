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
