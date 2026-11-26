import { type KeyboardEvent, type RefCallback } from "react";
import { type Cell } from "./a11y.ts";
import type { Codec } from "./address.ts";
import { type Direction, type Sort } from "./table.ts";
/** Where an app's address comes from and how the hook changes it. */
export interface AddressSource {
    /** The page's query string, such as `location.search` or a router's search. */
    readonly search: string;
    /** Moves the page to the query string given, such as "?view=rules" or "" for none. */
    readonly navigate: (search: string) => void;
}
/**
 * Returns the values `codec` reads from `source.search`, and a function that
 * navigates to the address of those values with `change` applied. The state
 * lives only in the address, so a reload or a shared link keeps it.
 */
export declare function useAddressState<V extends object>(codec: Codec<V>, source: AddressSource): readonly [V, (change: Partial<V>) => void];
/** The props of a sortable column's header cell. */
export interface SortHeaderCellProps {
    readonly scope: "col";
    readonly "aria-sort": Direction | undefined;
}
/** The props of the button inside a sortable column's header. */
export interface SortButtonProps {
    readonly type: "button";
    readonly onClick: () => void;
}
export interface UseSortHeaderOptions<K extends string> {
    readonly sort: Sort<K>;
    readonly onSort: (next: Sort<K>) => void;
    /** The direction a column sorts in when first chosen. */
    readonly firstDirection: (key: K) => Direction;
}
/**
 * Returns prop getters for the header cells of a sortable table. The sorted
 * column's header carries `aria-sort`, and its button flips the direction;
 * another column's button sorts by it in its first direction.
 */
export declare function useSortHeader<K extends string>({ sort, onSort, firstDirection, }: UseSortHeaderOptions<K>): {
    /** The direction the column sorts in, or null when the table is sorted by another. */
    directionOf: (key: K) => Direction | null;
    getHeaderProps: (key: K) => SortHeaderCellProps;
    getButtonProps: (key: K) => SortButtonProps;
};
/** The props of a chip, a toggle button that shows whether it is chosen. */
export interface PressedButtonProps {
    readonly type: "button";
    readonly "aria-pressed": boolean;
    readonly onClick: () => void;
}
/**
 * The chips' choice: one value, which a press replaces, or many, which a
 * press toggles and which keep the order `order` lists.
 */
export type UsePressedOptions<T> = {
    readonly mode: "one";
    readonly value: T;
    readonly onChange: (next: T) => void;
} | {
    readonly mode: "many";
    readonly value: readonly T[];
    readonly onChange: (next: readonly T[]) => void;
    readonly order: readonly T[];
};
/** Returns a prop getter for chips that choose one value or many, each marked with `aria-pressed`. */
export declare function usePressed<T>(options: UsePressedOptions<T>): {
    getButtonProps: (option: T) => PressedButtonProps;
};
/** The props of a grid's container. */
export interface GridProps {
    readonly role: "grid";
    readonly onKeyDown: (event: KeyboardEvent) => void;
}
/** The props of a grid's row. */
export interface GridRowProps {
    readonly role: "row";
}
/** The props of a grid's cell. */
export interface GridCellProps {
    readonly role: "gridcell";
    readonly tabIndex: 0 | -1;
    readonly ref: RefCallback<HTMLElement>;
    readonly onFocus: () => void;
}
/**
 * Returns prop getters for a grid of `rows` by `columns` cells with one tab
 * stop. The arrow keys, Home, End and Ctrl or Command with Home or End move
 * focus between cells, and a cell that takes focus becomes the tab stop.
 */
export declare function useGrid({ rows, columns }: {
    readonly rows: number;
    readonly columns: number;
}): {
    /** The cell that holds the tab stop. */
    active: Cell;
    getGridProps: () => GridProps;
    getRowProps: () => GridRowProps;
    getCellProps: (row: number, column: number) => GridCellProps;
};
/**
 * Returns focus, when the component that calls it unmounts, to the element
 * that had focus as it first rendered, such as the row that opened a
 * detail panel. Focus stays where it is when that element has left the page.
 */
export declare function useFocusReturn(): void;
