function clamp(value, last) {
    return Math.max(0, Math.min(value, last));
}
/**
 * Returns the cell that `press` moves focus to from `from`, or null when the
 * key is not a grid move. The arrows move one cell, Home and End move to the
 * first and last cell of the row, and Ctrl or Command with Home or End move
 * to the first and last cell of the grid. A move past an edge stays on the
 * edge cell. The key that ends an input method's composition never moves.
 */
export function gridMove(from, press, size) {
    if (press.isComposing)
        return null;
    const lastRow = Math.max(0, size.rows - 1);
    const lastColumn = Math.max(0, size.columns - 1);
    const row = clamp(from.row, lastRow);
    const column = clamp(from.column, lastColumn);
    const toGrid = press.ctrlKey || press.metaKey;
    switch (press.key) {
        case "ArrowUp":
            return { row: clamp(row - 1, lastRow), column };
        case "ArrowDown":
            return { row: clamp(row + 1, lastRow), column };
        case "ArrowLeft":
            return { row, column: clamp(column - 1, lastColumn) };
        case "ArrowRight":
            return { row, column: clamp(column + 1, lastColumn) };
        case "Home":
            return toGrid ? { row: 0, column: 0 } : { row, column: 0 };
        case "End":
            return toGrid ? { row: lastRow, column: lastColumn } : { row, column: lastColumn };
        default:
            return null;
    }
}
/**
 * Returns the `aria-sort` of a column header: the direction of the sorted
 * column, or undefined for any other column, whose header then carries no
 * `aria-sort`.
 */
export function ariaSort(direction) {
    return direction ?? undefined;
}
/**
 * Returns a count with its noun, singular for 1, such as "1 run" or
 * "1,384 runs". The plural is the noun with an s unless `plural` says
 * otherwise.
 */
export function counted(count, noun, plural = `${noun}s`) {
    return `${count.toLocaleString("en")} ${count === 1 ? noun : plural}`;
}
/**
 * Returns the phrase that says how many rows a list shows, such as "Showing
 * 4 of 6 books", "Showing all 6 books", or "Showing 4 books, and more match"
 * when the total is unknown. The noun agrees with the total, or with the
 * rows shown when the total is unknown.
 */
export function shownPhrase(shown, total, noun, plural = `${noun}s`) {
    if (total === null)
        return `Showing ${counted(shown, noun, plural)}, and more match`;
    if (shown !== total)
        return `Showing ${shown.toLocaleString("en")} of ${counted(total, noun, plural)}`;
    return total > 1
        ? `Showing all ${counted(total, noun, plural)}`
        : `Showing ${counted(total, noun, plural)}`;
}
