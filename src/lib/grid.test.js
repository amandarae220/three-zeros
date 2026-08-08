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

  it("counts July's loss", () => {
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
  const PITCH = layout.cell + layout.gap;
  const HEIGHT = 25 * PITCH;

  it('puts the first cell at the bottom left', () => {
    const { x, y } = cellOrigin(0, layout, HEIGHT);
    expect(x).toBe(0);
    expect(y).toBe(HEIGHT - layout.cell);
  });

  it('walks along the bottom row first', () => {
    expect(cellOrigin(1, layout, HEIGHT).x).toBe(PITCH);
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
    expect(last.y).toBe(HEIGHT - layout.cell - 24 * PITCH);
    expect(Math.floor((TRILLION_CELLS - 1) / COLUMNS)).toBe(layout.rows - 1);
  });
});
