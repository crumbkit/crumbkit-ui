# Working on crumbkit-ui

crumbkit-ui is one package, `@crumbkit/ui`, at the repository root. It has
no pnpm workspace, because consumers install it from a git tag and a git
dependency cannot resolve `workspace:*`. `src/address.ts`, `src/table.ts`
and `src/a11y.ts` hold state, rules and words with no DOM, network or
framework. `src/react.ts` binds them to React as props and renders nothing.
The rules are typescript-standards' base profile, as
[typescript-standards.toml](typescript-standards.toml) adopts it. Node's
version is in `.node-version`.

Run these before every push. They are the steps of the `lane` job in
[.github/workflows/ci.yml](.github/workflows/ci.yml), after its zizmor step.

```sh
pnpm install --frozen-lockfile
pnpm run fix
pnpm run lint
pnpm run typecheck
pnpm run knip
pnpm run test
pnpm run build
pnpm run bundle
```

- Write the test first, named as a sentence (BASE-18, BASE-24).
- Pin every dependency to an exact version (BASE-13).
- `pnpm run typecheck` checks the three core modules a second time with
  `tsconfig.core.json`, whose lib has no DOM. A core module that reaches for
  `document`, `window` or `fetch` fails it.
- `dist/` is committed, because consumers install the tag with no build.
  Commit the output of `pnpm run build` in the same commit as the source
  change. The `bundle` step fails when the committed `dist/` differs from a
  fresh build. A Dependabot branch that changes TypeScript needs the same
  rebuild and commit.
- Each new subpath adds an `exports` entry in `package.json`, a file in
  `tsconfig.build.json` and `tsconfig.core.json` when it is a core module,
  and an entry in `knip.json`.

## Releasing

1. Add the version's entry to `CHANGELOG.md` and set `version` in
   `package.json`, in a pull request whose CI passes.
2. After it merges, tag the merge commit on `main` as `v<version>` once CI
   on `main` passes, and push the tag.
3. A tag never moves. A bad release is fixed by the next patch version,
   such as `v0.1.1`.

## Writing

Docs, comments and commit messages use plain declarative sentences with a
named subject. Avoid "not X but Y", fragments, metaphors and closing
flourishes. A stated limit says what it counts and what happens when it is
hit. Commit messages describe changed behaviour.
