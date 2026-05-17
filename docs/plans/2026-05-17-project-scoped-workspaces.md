# Project Scoped Workspaces

## Goal
Introduce project-level isolation for all domain data with URL-scoped context under /projects/[projectSlug]/..., while reducing technical debt through a pre-feature refactor and a final cleanup pass.

## Product Decisions (Confirmed)
- Scope all domain data per project:
  - questions/rubrics,
  - students/teams/submissions,
  - assessments,
  - imports/exports.
- Use URL-based active project context.
- URL prefix is /projects/.
- Use immutable project slug + editable display name.
- Auto-migrate legacy data into a seeded default project.
- Creating a new project auto-switches to it.

## Non-goals (v1)
- Cross-project analytics.
- Cross-project search.
- Auth/permissions.

## Phase 1: Pre-feature Refactor (No Functional Scope Change)
1. Add a server-side project context resolver.
- Resolve projectSlug from route params and map to projectId.
- Keep this in one module so project lookup is not duplicated.

2. Add project-aware route helpers.
- Create central route builders for /projects/[projectSlug]/... links.
- Replace hardcoded internal hrefs progressively.

3. Add scoped cache-tag helpers.
- Introduce tag builders for project-specific tags (questions, submissions, assessments, per-question subsets).
- Refactor existing tag calls to use helper APIs.

4. Reduce coupling in db hotspots.
- Keep read/write responsibilities clearer in large modules.
- Add shared query predicates for project scoping.

## Phase 2: Project Feature Implementation
1. Database schema and migration.
- Add project table (slug unique, displayName, timestamps).
- Backfill default project.
- Add projectId to all project-scoped tables.
- Convert global uniqueness constraints to project-scoped uniqueness where required.
- Enforce NOT NULL + FK after backfill.

2. Data-layer scoping.
- Thread project context through all loaders/savers.
- Enforce same-project membership on writes (assessment paths especially).
- Scope import and export flows to active project.

3. App routing and navigation.
- Move/compose app routes under /projects/[projectSlug]/...
- Show [Project Name] Dashboard.
- Show active project in menu.
- Add Change project page with:
  - switch project,
  - create project,
  - auto-switch after create.

4. Actions and validation.
- Require project context in server actions.
- Reject cross-project ids consistently.

## Phase 3: Final Cleanup / Debt Reduction
1. Remove temporary compatibility code.
2. Consolidate naming and project context contracts.
3. Remove duplicate predicates and obsolete cache tags.
4. Verify formatting, types, tests, and manual multi-project flows.

## Affected Areas
- app/layout.tsx
- app/page.tsx
- app/assessments/**
- app/questions/**
- app/import/**
- app/export/**
- src/shared/AppShell.tsx
- src/db/**
- src/import/**
- src/export/**
- src/questions/actions.ts
- src/assessment/saveAssessment.ts

## Verification Plan
1. Migration status/up/down and default-project backfill check.
2. pnpm run check --fix
3. pnpm run check-types
4. pnpm test
5. Manual flows:
- create second project,
- switch projects,
- import distinct data per project,
- verify dashboard/menu labels,
- verify isolation across lists/assessment/export.

## Risks and Mitigations
- Risk: cross-project data leakage through missed predicates.
  - Mitigation: central project predicate helpers + integration tests with two projects.
- Risk: cache invalidation leaks stale data across projects.
  - Mitigation: project-scoped cache tags and helper-based usage.
- Risk: route migration regressions from hardcoded hrefs.
  - Mitigation: central route builders and focused route regression checks.
