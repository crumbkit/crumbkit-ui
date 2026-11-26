# Changelog

This file records the notable changes to `@crumbkit/ui`. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the package
follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0]

### Added

- `@crumbkit/ui/address` reads filter state from a page's query string and
  writes it back with `defineAddress` and the field kinds `oneOf`, `manyOf`,
  `text` and `id`. A field the address lacks, names twice or gives an unknown
  value takes its default, and `format` leaves defaults out.
- `@crumbkit/ui/table` filters, sorts and groups rows with `filterRows`,
  `sortRows`, `nextSort`, `groupRows` and `rollUp`.
- `@crumbkit/ui/a11y` gives the grid keyboard model `gridMove`, `ariaSort`,
  and the count phrases `counted` and `shownPhrase`.
- `@crumbkit/ui/react` binds them to React with `useAddressState`,
  `useSortHeader`, `usePressed`, `useGrid` and `useFocusReturn`, which return
  props and render nothing.

[0.1.0]: https://github.com/crumbkit/crumbkit-ui/releases/tag/v0.1.0
