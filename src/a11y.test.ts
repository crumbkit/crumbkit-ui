import { describe, expect, it } from "vitest";
import { ariaSort, counted, gridMove, type KeyPress, shownPhrase } from "./a11y.ts";

const plain = { ctrlKey: false, metaKey: false, isComposing: false };
const press = (key: string, change: Partial<KeyPress> = {}): KeyPress => ({
  key,
  ...plain,
  ...change,
});
const size = { rows: 3, columns: 4 };

describe("gridMove", () => {
  it("moves one cell for each arrow", () => {
    const middle = { row: 1, column: 1 };
    expect(gridMove(middle, press("ArrowUp"), size)).toEqual({ row: 0, column: 1 });
    expect(gridMove(middle, press("ArrowDown"), size)).toEqual({ row: 2, column: 1 });
    expect(gridMove(middle, press("ArrowLeft"), size)).toEqual({ row: 1, column: 0 });
    expect(gridMove(middle, press("ArrowRight"), size)).toEqual({ row: 1, column: 2 });
  });

  it("stays on the edge cell when an arrow points past the edge", () => {
    const topLeft = { row: 0, column: 0 };
    const bottomRight = { row: 2, column: 3 };
    expect(gridMove(topLeft, press("ArrowUp"), size)).toEqual(topLeft);
    expect(gridMove(topLeft, press("ArrowLeft"), size)).toEqual(topLeft);
    expect(gridMove(bottomRight, press("ArrowDown"), size)).toEqual(bottomRight);
    expect(gridMove(bottomRight, press("ArrowRight"), size)).toEqual(bottomRight);
  });

  it("moves to the first or last cell of the row with Home and End", () => {
    const cell = { row: 1, column: 2 };
    expect(gridMove(cell, press("Home"), size)).toEqual({ row: 1, column: 0 });
    expect(gridMove(cell, press("End"), size)).toEqual({ row: 1, column: 3 });
    expect(gridMove({ row: 1, column: 0 }, press("Home"), size)).toEqual({ row: 1, column: 0 });
    expect(gridMove({ row: 1, column: 3 }, press("End"), size)).toEqual({ row: 1, column: 3 });
  });

  it("moves to the first or last cell of the grid with Ctrl or Command and Home or End", () => {
    const cell = { row: 1, column: 2 };
    expect(gridMove(cell, press("Home", { ctrlKey: true }), size)).toEqual({ row: 0, column: 0 });
    expect(gridMove(cell, press("End", { ctrlKey: true }), size)).toEqual({ row: 2, column: 3 });
    expect(gridMove(cell, press("Home", { metaKey: true }), size)).toEqual({ row: 0, column: 0 });
    expect(gridMove(cell, press("End", { metaKey: true }), size)).toEqual({ row: 2, column: 3 });
  });

  it("gives no move for another key or for a key that ends a composition", () => {
    const cell = { row: 1, column: 1 };
    expect(gridMove(cell, press("a"), size)).toBeNull();
    expect(gridMove(cell, press("Enter"), size)).toBeNull();
    expect(gridMove(cell, press("ArrowDown", { isComposing: true }), size)).toBeNull();
  });

  it("brings a cell outside a smaller grid back inside it", () => {
    expect(gridMove({ row: 9, column: 9 }, press("ArrowUp"), size)).toEqual({ row: 1, column: 3 });
  });
});

describe("ariaSort", () => {
  it("names the direction of the sorted column and nothing for another column", () => {
    expect(ariaSort("ascending")).toBe("ascending");
    expect(ariaSort("descending")).toBe("descending");
    expect(ariaSort(null)).toBeUndefined();
  });
});

describe("counted", () => {
  it("names one in the singular and groups the thousands of any other count", () => {
    expect(counted(1, "run")).toBe("1 run");
    expect(counted(0, "run")).toBe("0 runs");
    expect(counted(1384, "row")).toBe("1,384 rows");
    expect(counted(2, "match", "matches")).toBe("2 matches");
    expect(counted(1, "match", "matches")).toBe("1 match");
  });
});

describe("shownPhrase", () => {
  it("says how many of the total a list shows, with the noun agreeing with the total", () => {
    expect(shownPhrase(4, 6, "book")).toBe("Showing 4 of 6 books");
    expect(shownPhrase(0, 1, "book")).toBe("Showing 0 of 1 book");
    expect(shownPhrase(1, 1_200, "match", "matches")).toBe("Showing 1 of 1,200 matches");
  });

  it("says the list shows every row when it does", () => {
    expect(shownPhrase(6, 6, "book")).toBe("Showing all 6 books");
    expect(shownPhrase(1, 1, "book")).toBe("Showing 1 book");
    expect(shownPhrase(0, 0, "book")).toBe("Showing 0 books");
  });

  it("says more match when the total is unknown", () => {
    expect(shownPhrase(4, null, "book")).toBe("Showing 4 books, and more match");
    expect(shownPhrase(1, null, "book")).toBe("Showing 1 book, and more match");
  });
});
