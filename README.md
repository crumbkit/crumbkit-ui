# crumbkit-ui

Headless TypeScript building blocks shared by crumbkit's web front ends:

- filter state held in the page address
- table grouping and sorting
- accessibility helpers
- React hooks over each of these, which return props and render nothing

The package is `@crumbkit/ui`. It stores nothing and calls no network, and
it renders no element and ships no styles.

## Install

The package is not on the npm registry. A consumer installs a release tag
from GitHub, and its lockfile records the tag's commit:

```sh
pnpm add github:crumbkit/crumbkit-ui#v0.1.0
```

The tag carries the built ESM and type declarations in `dist/`, so the
install runs no build and needs no `allowBuilds` entry. The `react` subpath
needs React 19 as a peer dependency; the other subpaths need nothing.

## Subpaths

| Import                 | What it holds                                                                                                                                                                                                                                                                                                                                        |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@crumbkit/ui/address` | `defineAddress` and the field kinds `oneOf`, `manyOf`, `text` and `id`. A codec's `parse` reads a query string into values, giving a field its default when the address lacks it, names it twice or holds a value it does not know. Its `format` writes the values back, leaving defaults out and writing the fields in the order they were defined. |
| `@crumbkit/ui/table`   | `Direction`, `Sort`, `filterRows`, `sortRows`, `nextSort`, `groupRows` and `rollUp`. `sortRows` is stable and puts a row with no value last in either direction. `groupRows` groups one level deep, lists a row under each group it belongs to and counts it once in the total.                                                                      |
| `@crumbkit/ui/a11y`    | `KeyPress`, `gridMove`, `ariaSort`, `counted` and `shownPhrase`. `gridMove` gives the cell that an arrow, Home, End, or Ctrl or Command with Home or End moves to, and stays on the edge cell at an edge.                                                                                                                                            |
| `@crumbkit/ui/react`   | `useAddressState`, `useSortHeader`, `usePressed`, `useGrid` and `useFocusReturn`. Each returns values and prop getters, such as the `aria-sort` of a header, the `aria-pressed` of a chip and the `tabIndex` of a grid cell.                                                                                                                         |

`address`, `table` and `a11y` type-check with no DOM, so they run under any
front end and in Node.

## Example

```ts
import { defineAddress, manyOf, oneOf, text } from "@crumbkit/ui/address";
import { useAddressState } from "@crumbkit/ui/react";

const filters = defineAddress({
  view: oneOf(["rules", "repositories"], "rules"),
  state: manyOf(["fail", "warn", "pass"]),
  q: text(),
});

// In a component, with the router's search string and navigate function:
const [value, change] = useAddressState(filters, { search, navigate });
change({ state: ["fail"] }); // navigates to "?state=fail"
```

## Licence

crumbkit-ui is licensed under either of the [MIT licence](LICENSE-MIT) or the
[Apache License 2.0](LICENSE-APACHE), at your option.
