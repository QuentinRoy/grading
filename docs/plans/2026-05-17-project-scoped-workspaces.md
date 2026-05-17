# Project Scoped Workspaces

## Goal
Introduce project-level isolation for all domain data with URL-scoped context under `/projects/[projectId]/[projectSlug]/...`, while also reducing technical debt in the affected routes, loaders, actions, and navigation.

## Debt Reduction Priority
- Keep the new project model from creating a second layer of duplicated global code.
- Prefer shared helpers and route builders over route-specific one-offs.
- Remove obsolete compatibility code once the project-scoped path exists.
- Keep the data layer smaller by consolidating project predicates and cache-tag usage.
- Treat cleanup as a required deliverable, not a postscript.

## Confirmed Decisions
- Scope all domain data per project.
  - Questions and rubrics.
  - Students, teams, and submissions.
  - Assessments.
  - Imports and exports.
- Use URL-based active project context.
- Use `/projects/` as the public project prefix.
- Use an opaque public project id as the stable identifier.
- Keep public project ids short enough to remain readable in URLs.
- Treat the slug as a derived display segment rather than the project key.
- Seed a default project and migrate legacy rows into it.
- Creating a project should automatically switch to it.

## Non-goals for v1
- Cross-project analytics.
- Cross-project search.
- Auth or permissions.

## Current Status

### Progress Snapshot
- Phase 1, Foundation and Refactor: complete.
  - Done: project resolver usage, project-aware route helpers, shared cache-tag helpers, shared project-scope helper, route/navigation wiring, and the DB-layer refactor cleanup.
- Phase 2, Project Feature Implementation: complete.
  - Done: schema migration, backfill, merged public-id setup, opaque short public ids (nanoid in runtime, node:crypto in migration), slug removed from DB, surrogate student key model, scoped read paths, dashboard shell, project switch page, project-aware assessment writes, project-scoped question management, and project-bound import flows.
- Phase 3, Debt Reduction and Final Cleanup: in progress.
  - Done: legacy top-level routes removed, import menu removed, stale redirect removed, slug-only project route tree removed, route helpers narrowed to canonical URL shape, migration refactored to db.schema with no third-party deps, two-project isolation regression tests.
  - Remaining: manual multi-project spot-checks.

### Completed
- Added a `project` table and backfilled legacy data into a seeded default project.
- Added `projectId` to the project-scoped tables and updated the assessment write path to persist it.
- Reworked the student model so the imported student id is a project-scoped natural key and the relational foreign keys use a surrogate student row id.
- Added project-aware read helpers for questions, submissions, rubric overview, submission progress, and dashboard progress.
- Added central route helpers for `/projects/[projectId]/[projectSlug]/...` links.
- Added the `/projects` switcher page and the project dashboard shell.
- Rewired the app shell navigation to point at project-scoped routes.
- Updated the test bootstrap to run the latest Kysely migrations automatically.
- Scoped the project question management page so it reads, saves, deletes, and reorders within the active project.
- Collapsed question editing onto the project questions page instead of reintroducing a separate legacy-style edit route.
- Scoped the project import pages by binding actions to the active project and scoping the underlying save/look-up helpers.
- Added conservative conflict guards in import flows so existing ids or names from another project fail fast instead of silently overwriting another project's data.
- Removed the legacy top-level route tree under `app/assessments`, `app/questions`, and `app/import`.
- Removed the orphaned import menu that still linked to the deleted routes.
- Updated the remaining hardcoded redirect away from `/questions`.
- Kept the audit note in sync with the cleanup work.
- Introduced opaque public project ids and started the canonical `/projects/[projectId]/[projectSlug]/...` route tree.
- Removed the legacy slug-only project route tree under `app/projects/[projectSlug]`.
- Removed the one-argument project route helper compatibility layer and narrowed shell parsing to canonical project URLs.
- Merged the public-id schema change into the original project migration so the database now stores only `name` plus a short opaque public id.
- Replaced raw SQL in the project migration with `db.schema` and `db.updateTable` calls throughout; the backfill and structural DDL are now fully Kysely-native.
- Removed third-party dependency (nanoid) from the migration; the seeded default id uses `node:crypto` instead.
- Typed the migration's `MigrationDB` to include backfill tables so the update can use `db.updateTable` instead of raw SQL.
- Scoped the questions export route to pass `project.id` to `loadQuestions`.
- Scoped `createSubmissionExport`, `loadQuestionPlan`, and `assertSubmissionInvariants` to require a `projectId`; the streaming rows query filters by `submission.projectId`.
- Removed legacy global export routes under `app/export/` (questions and submissions); project-scoped equivalents exist under `app/projects/[projectId]/[projectSlug]/export/`.
- Replaced the globally-unique `team.name` constraint with a per-project composite unique constraint `(name, project_id)` via migration `20260517000001_fix_team_name_uniqueness.ts`.
- Updated the team import helper to use the composite `onConflict` and removed the now-unnecessary cross-project team name guard.
- Updated the base migration so student rows use a surrogate `row_id` primary key and submission / team-link tables point at that surrogate key.

### In Progress / Still To Do


## Deviation Log
- The implementation did not follow the original phase ordering exactly.
  - We removed the legacy top-level route tree earlier than originally planned, once the project-scoped routes were usable.
  - The cleanup pass started before every project-scoped write flow was fully threaded.
  - Phase 1 was only fully finished during the later cleanup pass, after the helper consolidation work landed.
- The public-id pivot changed the route model after the slug-only plan was already underway.
  - Slugs became cosmetic display segments instead of the stable key.
  - The canonical route shape expanded from one project segment to two.
  - The temporary slug-only compatibility tree was later removed instead of being kept as redirects.
- Some refactor goals were satisfied opportunistically during implementation rather than in a single dedicated pre-feature pass.
  - Example: project-aware read helpers were tightened while route pages were being updated.
  - Example: the route audit was updated after the cleanup work instead of before it.

## Decision Log
- Route prefix: `/projects/` is the canonical public scope for project-specific work.
- Default project behavior: legacy data lives in a seeded default project instead of being left unscoped.
- Compatibility strategy: remove the old global route tree once project-scoped equivalents exist, rather than keeping permanent duplicates.
- Navigation strategy: the app shell should surface the active project and route through the project-scoped helpers.
- Identifier strategy: public ids are the stable project key; the slug is derived from the project name for display and canonical links.
- URL readability strategy: public ids should be shorter than UUIDs while remaining opaque and collision-resistant for the expected project volume.
- Migration dependency rule: migrations import only from `kysely` and Node.js built-ins; no third-party packages. This keeps migrations independently runnable regardless of which app deps are present.

## Implementation Phases

### Phase 1: Foundation and Refactor
1. Add a server-side project context resolver.
  - Resolve `projectId` from route params and canonicalize the slug segment for display.
  - Keep lookup logic in one place.
2. Add project-aware route helpers.
  - Centralize builders for `/projects/[projectId]/[projectSlug]/...` links.
  - Replace hardcoded internal hrefs progressively.
3. Add scoped cache-tag helpers where needed.
  - Introduce project-specific tag builders for questions, submissions, assessments, and per-question subsets.
4. Reduce coupling in DB hotspots.
  - Keep read/write responsibilities clearer in larger modules.
  - Share query predicates for project scoping.

### Phase 2: Project Feature Implementation
1. Database schema and migration.
  - Add the `project` table.
  - Backfill the default project.
  - Add `projectId` to scoped tables.
  - Convert uniqueness constraints where required.
  - Enforce `NOT NULL` and foreign keys after backfill.
2. Data-layer scoping.
  - Thread project context through loaders and savers.
  - Enforce same-project membership on writes.
  - Scope import and export flows to the active project.
3. App routing and navigation.
  - Compose routes under `/projects/[projectId]/[projectSlug]/...`.
  - Show the project dashboard for the active project.
  - Surface the active project in the menu.
  - Add the project switch page.
4. Actions and validation.
  - Require project context in server actions.
  - Reject cross-project ids consistently.

### Phase 3: Debt Reduction and Final Cleanup
1. Remove temporary compatibility code.
  - Delete dead global routes, shims, and duplicate entry points once the project-scoped path is live.
2. Consolidate naming and project context contracts.
  - Keep project-scoped APIs explicit and consistent.
3. Remove duplicate predicates and obsolete cache tags.
  - Collapse repeated project filters into shared helpers where it actually reduces complexity.
4. Redesign student identity for project-scoped imports.
  - Replace the global student primary key with a project-scoped model.
  - Update submission and student-team references to match the new key strategy.
  - Keep import/export behavior stable for existing project data.
5. Verify formatting, types, tests, and manual multi-project flows.
  - Do not treat the feature as done until the cleanup pass is also done.

## Affected Areas
- `app/layout.tsx`
- `app/page.tsx`
- `app/projects/**`
- `src/shared/AppShell.tsx`
- `src/db/**`
- `src/import/**`
- `src/export/**`
- `src/questions/actions.ts`
- `src/assessment/saveAssessment.ts`

## Verification Plan
1. Migration status and backfill checks.
2. `pnpm run check --fix`
3. `pnpm run check-types`
4. `pnpm run test:unit`
5. Manual flows.
  - Create a second project.
  - Switch projects.
  - Import distinct data per project.
  - Verify dashboard and menu labels.
  - Verify isolation across lists, assessment, and export views.

## Risks and Mitigations
- Risk: cross-project data leakage through missed predicates.
  - Mitigation: central project predicate helpers plus integration tests with two projects.
- Risk: cache invalidation leaks stale data across projects.
  - Mitigation: project-scoped cache tags and helper-based usage.
- Risk: route migration regressions from hardcoded hrefs.
  - Mitigation: central route builders and focused route regression checks.
