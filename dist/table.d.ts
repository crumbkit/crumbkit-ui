/** The direction a column sorts in. */
export type Direction = "ascending" | "descending";
/** The column a table sorts by and its direction. */
export interface Sort<K extends string> {
    readonly key: K;
    readonly direction: Direction;
}
/** A value a row sorts by: a number, text, or null when the row has none. */
export type SortValue = number | string | null;
/** One key of a sort: the value of each row and the direction it sorts in. */
export interface SortKey<R> {
    readonly value: (row: R) => SortValue;
    readonly direction: Direction;
}
/** A test a row passes to stay in the table. */
export type RowTest<R> = (row: R) => boolean;
/** Returns the rows that pass every one of `tests`, in their order. */
export declare function filterRows<R>(rows: readonly R[], tests: readonly RowTest<R>[]): R[];
/**
 * Returns `rows` sorted by each of `keys` in turn. A row with no value for a
 * key goes after every row with one, in either direction. Rows that tie on
 * every key go in the order of `tie`, such as their names, and rows that tie
 * on that too keep their given order.
 */
export declare function sortRows<R>(rows: readonly R[], keys: readonly SortKey<R>[], tie: (row: R) => string): R[];
/**
 * Returns the sort after the reader chooses the column `key`. Choosing the
 * sorted column again flips its direction. A newly chosen column takes the
 * direction `firstDirection` gives it, such as names A to Z and figures
 * most first.
 */
export declare function nextSort<K extends string>(current: Sort<K>, key: K, firstDirection: (key: K) => Direction): Sort<K>;
/** One group of a grouped table: its key and its rows. */
export interface Group<G, R> {
    readonly key: G;
    readonly rows: readonly R[];
}
/** A table grouped one level deep, with the number of rows it shows. */
export interface Grouped<G, R> {
    readonly groups: readonly Group<G, R>[];
    /** The rows in at least one group, each counted once however many groups list it. */
    readonly total: number;
}
/**
 * Returns `rows` grouped by the keys `groupsOf` gives each row. A row in
 * several groups shows under each of them, and once in the total. A row in
 * no group shows nowhere. The groups go in the order of `order`, then any
 * others in the order they first appear; a group with no rows is left out.
 */
export declare function groupRows<R, G>(rows: readonly R[], groupsOf: (row: R) => readonly G[], order?: readonly G[]): Grouped<G, R>;
/**
 * Returns the worst of `states` by `worstFirst`, which lists every state
 * from the worst to the best, or undefined when there are no states.
 */
export declare function rollUp<S>(states: readonly S[], worstFirst: readonly S[]): S | undefined;
