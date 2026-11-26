// React hooks over the address codec, the table sort and the accessibility
// helpers. Each hook returns values and prop getters and renders nothing, so
// the app draws and styles every element itself.
import {
  type KeyboardEvent,
  type RefCallback,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ariaSort, type Cell, gridMove } from "./a11y.ts";
import type { Codec } from "./address.ts";
import { type Direction, nextSort, type Sort } from "./table.ts";

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
 * lives only in the address, so a reload or a shared link keeps it. Several
 * changes in one handler each apply on top of the one before, until the
 * next render reads the address again.
 */
export function useAddressState<V extends object>(
  codec: Codec<V>,
  source: AddressSource,
): readonly [V, (change: Partial<V>) => void] {
  const { search, navigate } = source;
  const value = useMemo(() => codec.parse(search), [codec, search]);
  // The value the last change navigated to, and the parsed value it built
  // on. A new parsed value means the address moved, so changes build on it.
  const latest = useRef({ base: value, pending: value });
  const change = useCallback(
    (next: Partial<V>) => {
      const start = latest.current.base === value ? latest.current.pending : value;
      const pending = { ...start, ...next };
      latest.current = { base: value, pending };
      navigate(codec.format(pending));
    },
    [codec, navigate, value],
  );
  return [value, change] as const;
}

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
export function useSortHeader<K extends string>({
  sort,
  onSort,
  firstDirection,
}: UseSortHeaderOptions<K>) {
  const directionOf = (key: K): Direction | null => (key === sort.key ? sort.direction : null);
  return {
    /** The direction the column sorts in, or null when the table is sorted by another. */
    directionOf,
    getHeaderProps: (key: K): SortHeaderCellProps => ({
      scope: "col",
      "aria-sort": ariaSort(directionOf(key)),
    }),
    getButtonProps: (key: K): SortButtonProps => ({
      type: "button",
      onClick: () => onSort(nextSort(sort, key, firstDirection)),
    }),
  };
}

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
export type UsePressedOptions<T> =
  | { readonly mode: "one"; readonly value: T; readonly onChange: (next: T) => void }
  | {
      readonly mode: "many";
      readonly value: readonly T[];
      readonly onChange: (next: readonly T[]) => void;
      readonly order: readonly T[];
    };

/** Returns a prop getter for chips that choose one value or many, each marked with `aria-pressed`. */
export function usePressed<T>(options: UsePressedOptions<T>) {
  return {
    getButtonProps: (option: T): PressedButtonProps => {
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
            onClick: () =>
              options.onChange(
                options.order.filter((each) =>
                  each === option ? !pressed : options.value.includes(each),
                ),
              ),
          };
        }
      }
    },
  };
}

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
 * A key pressed in a control inside a cell is left to that control.
 */
export function useGrid({ rows, columns }: { readonly rows: number; readonly columns: number }) {
  const [active, setActive] = useState<Cell>({ row: 0, column: 0 });
  const cells = useRef(new Map<string, HTMLElement>());
  const size = { rows, columns };
  // A grid that shrank keeps its tab stop on a cell that still exists.
  const current: Cell = {
    row: Math.max(0, Math.min(active.row, rows - 1)),
    column: Math.max(0, Math.min(active.column, columns - 1)),
  };
  const name = (row: number, column: number) => `${row}:${column}`;
  return {
    /** The cell that holds the tab stop. */
    active: current,
    getGridProps: (): GridProps => ({
      role: "grid",
      onKeyDown: (event) => {
        // A key pressed in a control inside a cell, such as a text field,
        // stays with that control.
        const fromCell = [...cells.current.values()].some((cell) => cell === event.target);
        if (!fromCell) return;
        const to = gridMove(
          current,
          {
            key: event.key,
            ctrlKey: event.ctrlKey,
            metaKey: event.metaKey,
            isComposing: event.nativeEvent.isComposing,
          },
          size,
        );
        if (to === null) return;
        event.preventDefault();
        setActive(to);
        cells.current.get(name(to.row, to.column))?.focus();
      },
    }),
    getRowProps: (): GridRowProps => ({ role: "row" }),
    getCellProps: (row: number, column: number): GridCellProps => ({
      role: "gridcell",
      tabIndex: row === current.row && column === current.column ? 0 : -1,
      ref: (element) => {
        if (element === null) cells.current.delete(name(row, column));
        else cells.current.set(name(row, column), element);
      },
      onFocus: () => setActive({ row, column }),
    }),
  };
}

/**
 * Returns focus, when the component that calls it unmounts, to the element
 * that had focus as it first rendered, such as the row that opened a
 * detail panel. Focus stays where it is when that element has left the page.
 * Focus moves a microtask after the unmount.
 */
export function useFocusReturn(): void {
  // Read during the first render, before an autoFocus inside the component
  // moves focus.
  const [opener] = useState(() =>
    document.activeElement instanceof HTMLElement ? document.activeElement : null,
  );
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      // StrictMode runs this cleanup and the effect again at once on the
      // first mount. Focus returns only when the effect did not run again,
      // so the unmount is real.
      queueMicrotask(() => {
        if (!mounted.current && opener?.isConnected === true) opener.focus();
      });
    };
  }, [opener]);
}
