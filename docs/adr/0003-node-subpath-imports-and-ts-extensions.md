# Imports use the Node `imports` field with mandatory `.ts`/`.tsx` extensions; `#` marks cross-feature edges

- **Status:** Accepted
- **Created:** 2026-06-01

The repository resolves non-relative internal imports through the Node `imports` field in `package.json` (`"#*": "./src/*"`) instead of the TypeScript `paths` alias (`@/*`), and every internal import — relative or `#`-prefixed — carries an explicit `.ts`/`.tsx` extension. `#` is reserved for **cross-feature** imports (a module reaching into a different top-level feature under `src/`); **feature-internal** imports stay relative (`./…`). This keeps source erasable and resolvable by one scheme across raw Node (the `node src/db/migrate.ts` scripts; relies on Node 24's native type-stripping, pinned via `engines.node`), vitest/vite, and Turbopack.

## Why

The `@/*` `paths` alias is a TypeScript-only construct: it is erased with no runtime equivalent, so Node and the vitest node environment do not resolve it. Tests therefore could not use `@/` and leaned on relative imports as a workaround, while app and Storybook code (which read tsconfig `paths`) used `@/` freely — two resolution worlds in one repo. The Node `imports` field is real runtime resolution understood by Node, vite/vitest, and Turbopack alike, so a single import scheme works everywhere and the build stays close to plain ESM.

Mandatory `.ts`/`.tsx` extensions are what make raw `node` execution of source work (Node type-stripping requires explicit extensions and does no extension probing). They also remove the ambiguity that extensionless resolution papers over differently per tool.

Reserving `#` for cross-feature edges makes feature boundaries visible at the import site, complementing [ADR-0002](0002-db-is-infrastructure-features-own-persistence.md): a `#feature/…` specifier flags a dependency crossing a feature boundary, while relative paths stay local to the feature.

## Rules

1. `package.json` declares `"imports": { "#*": "./src/*" }`. tsconfig sets `allowImportingTsExtensions: true` (valid under `noEmit`) and keeps `moduleResolution: "bundler"`; the `paths` alias is removed.
   - The `@/*` alias is removed and must not be reintroduced. Removing `paths` already makes it unresolvable; a Biome `noRestrictedImports` rule additionally fails any `@/**` import in `pnpm check` with an actionable message, so the failure is explicit rather than a generic "cannot find module".
2. Every internal import carries an explicit `.ts`/`.tsx` extension — static `import`/`export … from`, dynamic `import()`, and module specifiers in `vi.mock()`/`vi.doMock()` alike (a mock specifier must match the resolved module of the code under test). Relative imports are enforced by Biome's `useImportExtensions` rule (defaults enforce the real source extension; `forceJsExtensions` and `extensionMappings` are left unset). `#` subpath imports are enforced by a Biome `noRestrictedImports` negation pattern (`#*`/`#*/**` minus the `.ts`/`.tsx` / `.css` forms) that fails any extensionless `#` import.
3. Cross-feature imports (target resolves under a different top-level `src/` feature) use `#feature/…`. Feature-internal imports use relative `./…`. Files under `app/` are not a `src/` feature: imports from `app/` into `src/` always use `#`, while `app/`→`app/` imports stay relative.
4. Third-party and Node built-in imports are unchanged (no extension). Non-TS asset imports (e.g. `*.css`) keep their own extension and are untouched.

## Considered Options

- **`moduleResolution: "nodenext"` for compiler-enforced extensions** — rejected: tsc would error on missing extensions (the preferred enforcement), but it deviates from Next's recommended `bundler` mode, pulls in `module: nodenext` and stricter ESM resolution, and risks conflicts with `module: preserve` and Next patterns. Biome's lint rule gives the enforcement at far lower blast radius.
- **Keep `@/*` and add a vitest alias / tsconfig-paths plugin** — rejected: keeps a TypeScript-only, non-erasable alias and a per-tool resolver shim, the exact split this decision removes.
- **`.js` extensions pointing at `.ts` sources (`rewriteRelativeImportExtensions`)** — rejected: the repo runs `.ts` directly under Node type-stripping and has `noEmit`; `.ts` extensions match what actually executes, and Turbopack does not alias `.js`→`.ts`.

## Consequences

- A future contributor can run any source file under `node` directly without a build step.
- No per-tool resolver shim is needed: vitest required no alias config, and Storybook keeps only its unrelated node-builtin stubs. The two-resolution-worlds split is gone — one scheme resolves everywhere.
- Both relative and `#` imports are lint-enforced in `pnpm check`: relative via `useImportExtensions`, `#` via a `noRestrictedImports` negation pattern. The two rules use different mechanisms because `useImportExtensions` only covers relative specifiers; together they leave no internal-import path unenforced.
- The repo is pinned to Node 24 (`engines.node`); dropping below the version where native type-stripping is stable would break raw-`node` execution of `.ts` sources.
- Turbopack resolution of the `imports` field plus literal `.ts` specifiers was validated by a build spike, then confirmed repo-wide: `tsc`, Biome, `next build`, and the unit/integration/Storybook suites all pass, and `node src/db/migrate.ts` runs. The `turbopack.resolveAlias` escape hatch was therefore not needed.
- `CONTEXT.md` is unchanged: this decision introduces no domain language.
