# Centralise project slug canonicalisation

Status: Completed
Date: 2026-05-29
Resolution: Implemented and verified (biome, type-check, unit tests green) on branch `centralise-slug-canonicalisation`. All 9 pages call the helper; the overview and assessments wrong-target redirects are fixed.
Follow-up: Moving the client-side route parser (`getProjectRouteContext`) out of `shared/` is deferred to the drawer rework (architecture-review candidate #6).

Implements architecture-review candidate #1: replace the slug-canonicalisation redirect copied across 9 project-scoped pages with a single helper, so the Canonical Project URL is decided in one place.

Reverses the per-page decision recorded in `plans/completed/2026-05-29-project-route-context-cleanup.md` ("redirect targets are page-specific"). See `docs/adr/0001-centralise-slug-canonicalisation.md` and the new `CONTEXT.md` terms **Project Slug** / **Canonical Project URL**.

## Motivation

The slug compare + `redirect` was copied inline into 9 pages with a per-route target. Two copies had already drifted to the wrong page:

- `assessments/overview/page.tsx` redirected a stale slug to the dashboard instead of the overview.
- `assessments/page.tsx` redirected to the overview instead of the assessments root.

A page is the only place that knows its full segment set, so it declares a **route kind**; the helper owns the slug compare and maps the kind to the canonical path. This makes redirecting to the *wrong* target a compile-time concern. (It does not prevent a brand-new page from forgetting to canonicalise altogether — only a layout or middleware could, and both were rejected in ADR 0001.)

## Changes

### 1. `src/projects/canonicalProjectRedirect.ts` (new, server-side)

- `ProjectRoute` — discriminated union mirroring the `projectPaths` builders 1:1; deep routes carry their extra segments (`submission` → `submissionId`, `submissionQuestion` → `submissionId` + `questionId`).
- `canonicalProjectPath({ route, project })` — pure; exhaustive `switch` dispatching to the matching `projectPaths` builder, `default: return assertNever(route)`. `projectPaths.ts` stays the sole source of URL strings.
- `canonicalProjectRedirect({ project, requestedSlug, route })` — thin wrapper: `redirect(canonicalProjectPath(...))` only when `project.slug !== requestedSlug`. Both functions take a single named object (exported domain helpers; `project.slug`/`requestedSlug` are swappable slugs); `route` nests as the `ProjectRoute` domain unit. `project` is `Pick<ProjectSummary, "id" | "slug">` via a type-only import (source module is `server-only`); `assertNever` is imported relatively (the unit vitest project resolves no `@/` alias at runtime).

### 2. `src/projects/canonicalProjectRedirect.test.ts` (new)

- Pure path-per-kind assertions (no mock), including the two previously-wrong targets.
- `next/navigation` mocked: no redirect on slug match; redirect to canonical URL on mismatch; deep segments carried through.

### 3. Rewrite the 9 pages

Replace each `if (project.slug !== projectSlug) { redirect(...) }` block with one `canonicalProjectRedirect({ project, requestedSlug: projectSlug, route: { kind: … } })` call, dropping the now-unused `projectPaths` redirect-target import and the `redirect` import where it was only used for canonicalisation. This fixes the overview and assessments targets as a side effect.

| Page | kind |
| --- | --- |
| `[projectSlug]/page.tsx` | `dashboard` |
| `assessments/page.tsx` | `assessments` (was wrongly `overview`) |
| `assessments/overview/page.tsx` | `overview` (was wrongly `dashboard`) |
| `questions/page.tsx` | `questions` |
| `import/questions/page.tsx` | `importQuestions` |
| `import/students/page.tsx` | `importStudents` |
| `import/assessments/page.tsx` | `importAssessments` |
| `assessments/submissions/[submissionId]/page.tsx` | `submission` |
| `assessments/submissions/[submissionId]/questions/[questionId]/page.tsx` | `submissionQuestion` |

## Execution order

1. Add `canonicalProjectRedirect.ts` + test.
2. Update CONTEXT.md glossary and write ADR 0001 (done).
3. Rewrite the 9 pages.
4. `pnpm run check --fix` + `pnpm run check-types`.
5. `pnpm test:unit canonicalProjectRedirect projectPaths`.
6. Confirm zero remaining `project.slug !== projectSlug` sites.

## Out of scope

- Moving `ProjectRouteContext` / `getProjectRouteContext` out of `shared/` (deferred to candidate #6).
- Canonicalising in the layout or middleware (rejected — see ADR 0001).
- Any behaviour change beyond fixing the two wrong redirect targets.
