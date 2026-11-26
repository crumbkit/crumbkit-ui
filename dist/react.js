// React hooks over the address codec, the table sort and the accessibility
// helpers. Each hook returns values and prop getters and renders nothing, so
// the app draws and styles every element itself.
import { useCallback, useEffect, useMemo, useRef, useState, } from "react";
import { ariaSort, gridMove } from "./a11y.js";
import { nextSort } from "./table.js";
/**
 * Returns the values `codec` reads from `source.search`, and a function that
 * navigates to the address of those values with `change` applied. The state
 * lives only in the address, so a reload or a shared link keeps it.
 */
export function useAddressState(codec, source) {
    const { search, navigate } = source;
    const value = useMemo(() => codec.parse(search), [codec, search]);
    const change = useCallback((next) => navigate(codec.format({ ...value, ...next })), [codec, navigate, value]);
    return [value, change];
}
/**
 * Returns prop getters for the header cells of a sortable table. The sorted
 * column's header carries `aria-sort`, and its button flips the direction;
 * another column's button sorts by it in its first direction.
 */
export function useSortHeader({ sort, onSort, firstDirection, }) {
    const directionOf = (key) => (key === sort.key ? sort.direction : null);
    return {
        /** The direction the column sorts in, or null when the table is sorted by another. */
        directionOf,
        getHeaderProps: (key) => ({
            scope: "col",
            "aria-sort": ariaSort(directionOf(key)),
        }),
        getButtonProps: (key) => ({
            type: "button",
            onClick: () => onSort(nextSort(sort, key, firstDirection)),
        }),
    };
}
/** Returns a prop getter for chips that choose one value or many, each marked with `aria-pressed`. */
export function usePressed(options) {
    return {
        getButtonProps: (option) => {
            switch (options.mode) {
                case "one":
                    return {
                        type: "button",
                        "aria-pressed": options.value === option,
                        onClick: () => options.onChange(option),
                    };
                case "many": {
                    const pressed = options.value.includes(option);
                    return {
                        type: "button",
                        "aria-pressed": pressed,
                        onClick: () => options.onChange(options.order.filter((each) => each === option ? !pressed : options.value.includes(each))),
                    };
                }
            }
        },
    };
}
/**
 * Returns prop getters for a grid of `rows` by `columns` cells with one tab
 * stop. The arrow keys, Home, End and Ctrl or Command with Home or End move
 * focus between cells, and a cell that takes focus becomes the tab stop.
 */
export function useGrid({ rows, columns }) {
    const [active, setActive] = useState({ row: 0, column: 0 });
    const cells = useRef(new Map());
    const size = { rows, columns };
    // A grid that shrank keeps its tab stop on a cell that still exists.
    const current = {
        row: Math.max(0, Math.min(active.row, rows - 1)),
        column: Math.max(0, Math.min(active.column, columns - 1)),
    };
    const name = (row, column) => `${row}:${column}`;
    return {
        /** The cell that holds the tab stop. */
        active: current,
        getGridProps: () => ({
            role: "grid",
            onKeyDown: (event) => {
                const to = gridMove(current, {
                    key: event.key,
                    ctrlKey: event.ctrlKey,
                    metaKey: event.metaKey,
                    isComposing: event.nativeEvent.isComposing,
                }, size);
                if (to === null)
                    return;
                event.preventDefault();
                setActive(to);
                cells.current.get(name(to.row, to.column))?.focus();
            },
        }),
        getRowProps: () => ({ role: "row" }),
        getCellProps: (row, column) => ({
            role: "gridcell",
            tabIndex: row === current.row && column === current.column ? 0 : -1,
            ref: (element) => {
                if (element === null)
                    cells.current.delete(name(row, column));
                else
                    cells.current.set(name(row, column), element);
            },
            onFocus: () => setActive({ row, column }),
        }),
    };
}
/**
 * Returns focus, when the component that calls it unmounts, to the element
 * that had focus as it first rendered, such as the row that opened a
 * detail panel. Focus stays where it is when that element has left the page.
 */
export function useFocusReturn() {
    // Read during the first render, before an autoFocus inside the component
    // moves focus.
    const [opener] = useState(() => document.activeElement instanceof HTMLElement ? document.activeElement : null);
    useEffect(() => () => {
        if (opener?.isConnected === true)
            opener.focus();
    }, [opener]);
}
