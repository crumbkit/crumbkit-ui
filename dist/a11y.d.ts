import type { Direction } from "./table.ts";
/** The parts of a key press the keyboard rules read. */
export interface KeyPress {
    readonly key: string;
    readonly ctrlKey: boolean;
    readonly metaKey: boolean;
    readonly isComposing: boolean;
}
/** A cell of a grid, counted from 0. */
export interface Cell {
    readonly row: number;
    readonly column: number;
}
/** The number of rows and columns in a grid. */
export interface GridSize {
    readonly rows: number;
    readonly columns: number;
}
/**
 * Returns the cell that `press` moves focus to from `from`, or null when the
 * key is not a grid move. The arrows move one cell, Home and End move to the
 * first and last cell of the row, and Ctrl or Command with Home or End move
 * to the first and last cell of the grid. A move past an edge stays on the
 * edge cell. The key that ends an input method's composition never moves.
 */
export declare function gridMove(from: Cell, press: KeyPress, size: GridSize): Cell | null;
/**
 * Returns the `aria-sort` of a column header: the direction of the sorted
 * column, or undefined for any other column, whose header then carries no
 * `aria-sort`.
 */
export declare function ariaSort(direction: Direction | null): Direction | undefined;
/**
 * Returns a count with its noun, singular for 1, such as "1 run" or
 * "1,384 runs". The plural is the noun with an s unless `plural` says
 * otherwise.
 */
export declare function counted(count: number, noun: string, plural?: string): string;
/**
 * Returns the phrase that says how many rows a list shows, such as "Showing
 * 4 of 6 books", "Showing all 6 books", or "Showing 4 books, and more match"
 * when the total is unknown. The noun agrees with the total, or with the
 * rows shown when the total is unknown.
 */
export declare function shownPhrase(shown: number, total: number | null, noun: string, plural?: string): string;
