# Project Identifier Normalization Plan (Issue #51)

- **Status:** Completed
- **Created:** 2026-05-27
- **Tracked by:** #51

## Takeover Update (2026-05-27)

- Latest baseline: `pnpm run check-types` reports 64 errors in 25 files.
- Prioritized failure groups:
   - app/import/export/action call sites still typed as numeric project ids.
   - DB progress/overview modules still carry `string | number` identifier unions.
   - question/rubric insert builders still produce optional or mismatched `projectId` values.
   - integration tests still pass numeric project ids into string-boundary APIs.
- Execution order for current session:
   1. stabilize DB boundary signatures and query typing.
   2. fix insert typing in questions/import paths.
   3. align app and server action signatures/call sites.
   4. update integration tests to public project id usage.
   5. run `pnpm run check --fix` then `pnpm run check-types`.

## 1. Goal

Adopt and enforce the identifier convention:

- `row_id`: internal surrogate database key.
- `id`: stable public/domain identifier.

Contract clarification:

- `project.id` is the public identifier.
- `project.row_id` is internal and must not leave DB read/write functions.
- Route and app-level naming can continue using `projectId` and should refer to the public identifier.
- Project read outputs expose only `id` for identity (no `rowId` in returned app models).
- DB-facing APIs should migrate toward public `project.id` inputs unless this causes clear complexity or performance regressions.
- Any exception that keeps `row_id` at an API boundary must include documented rationale and measurable evidence.

Approved exception bar:

1. Measured regression on representative workload after switching to public-id query shape.
2. No reasonable query/index rewrite removes the regression.
3. Exception stays DB-internal, documented in plan/reference docs, and covered by tests.

Cutover decision:

- Use hard cutover per module when changing API boundaries from numeric project identifiers to public project identifiers.
- Do not add temporary dual-accept signatures.

Additional required audit:

- Review all DB function exports (project-related and unrelated features) to ensure `rowId` does not leak from DB read/write boundaries.
- Apply the same identifier boundary convention consistently across every feature area.

Type alignment decision:

- Keep app type dependencies on generated DB schema where they prevent mismatch.
- In `src/db/types.ts`, prefer deriving correlated types from generated schema types over manual duplication.

Primary inconsistency to fix now: `project` table currently uses `id` (internal) and `public_id` (public).

## 2. Current-State Findings (Verified)

From DB inspection via MCP:

- `project.id` is `integer` PK.
- `project.public_id` is unique `text`.
- The following tables reference `project.id` through `project_id` FKs:
  - `assessment`
  - `question`
  - `rubric`
  - `student`
  - `submission`
  - `team`
- `question`, `rubric`, and `student` already use `row_id` (internal PK) + `id` (public/domain).

Implication: this migration can be mostly metadata renames plus FK retargeting, without changing stored numeric FK values.

## 3. Scope

In scope:

1. Database migration for `project` identifier normalization.
2. Kysely/types/query updates required by column rename.
3. Integration and type/lint validation.
4. Documentation of identifier policy.

Out of scope:

1. Broad redesign of non-project surrogate keys.
2. Natural key adoption.
3. Rewriting prior committed migrations.

## 4. Migration Plan (Up)

Create a new migration file only (do not modify committed migrations).

Implementation strategy decision:

- Use strict metadata rename and constraint/foreign-key retargeting only.
- Do not use copy-and-swap unless a concrete tooling or engine limitation is demonstrated.

Execution order:

1. Drop FKs referencing `project(id)`:
   - `Assessment_projectId_fkey`
   - `Question_projectId_fkey`
   - `Rubric_projectId_fkey`
   - `Student_projectId_fkey`
   - `Submission_projectId_fkey`
   - `Team_projectId_fkey`
2. Rename `project.id` -> `row_id`.
3. Rename `project.public_id` -> `id`.
4. Recreate constraints on `project` with normalized names/targets:
   - PK on `project.row_id`.
   - Unique key on `project.id`.
5. Recreate dropped `project_id` FKs to reference `project(row_id)`.
6. Validate in migration with defensive assertions where practical:
   - `project.id` remains non-null and unique.
   - FK creation succeeds for all dependent tables.

Notes:

- Existing `project_id` integer values remain valid because `project.row_id` is the renamed previous `project.id`.
- No data copy is expected.

## 5. Rollback Plan (Down)

Reverse exactly:

1. Drop `project_id` FKs referencing `project(row_id)`.
2. Rename `project.id` -> `public_id`.
3. Rename `project.row_id` -> `id`.
4. Restore PK on `project.id` (integer) and unique on `project.public_id`.
5. Recreate original `project_id` FKs to `project(id)`.

## 6. Application and Type Changes

Required updates after migration:

1. Kysely DB types/schema for `project`:
   - `row_id: Generated<number>` (internal)
   - `id: string` (public)
2. Query layer:
   - Continue join/filter by `project_id` against `project.row_id` for internal relations.
   - Use `project.id` for route/public identity and import/export external references.
   - Do not return `project.row_id` from DB read/write boundaries unless required by internal DB operations.
   - Prefer in-query resolution from public `project.id` (joins/subqueries) over a dedicated pre-resolution helper call that adds extra round trips.
3. Replace direct `public_id` usage in app/db code with `id` where semantics are public identifier.

## 7. Validation Checklist

Before merge:

1. Run:
   - `pnpm run check --fix`
   - `pnpm run check-types`
   - `pnpm run db:types:generate`
2. Generated DB types policy:
   - Never hand-edit `src/db/generated/db.ts`.
   - Always regenerate with `pnpm run db:types:generate` after schema changes.
3. `src/db/types.ts` derivation gate:
   - Every changed type correlated to DB schema must either:
     - be imported directly from generated DB types, or
     - be a composition over generated schema primitives/enums.
   - Do not introduce independent manual redefinitions for schema-correlated types.
4. Run DB-focused integration tests (at minimum):
   - migrations integration tests
   - project loading/routing related tests
   - import/export project-scoped tests
5. Verify no regression in route resolution that depends on project identifier.
6. Confirm exports still emit public project identifier fields correctly.

## 8. Risks and Mitigations

Risk 1: Implicit assumptions that `project.id` is numeric in app code.

- Mitigation: targeted code search for `project.id` arithmetic/coercion and strict TypeScript fixes.

Risk 2: Constraint-name mismatch across environments.

- Mitigation: use explicit `DROP CONSTRAINT IF EXISTS` and deterministic recreate names.

Risk 3: Breakage in import/export contracts expecting `public_id`.

- Mitigation: contract tests and explicit mapping updates in import/export modules.

## 9. Documentation Follow-up

After migration lands, add/update a durable reference doc that states policy explicitly:

- `row_id = internal surrogate DB key`
- `id = stable public/domain identifier`

Candidate location: `docs/reference/database-migrations.md` with link from `docs/index.md`.

## 10. Execution Snapshot (2026-05-27)

- Completed hard-cutover typing pass for project-scoped read/write APIs where `project.id` is public string input.
- `projectScope` helper now accepts only string project ids and no longer carries numeric union boundary.
- Updated DB modules and import/export boundaries to resolve `project.row_id` internally.
- Updated affected integration tests to pass public project ids to API boundaries while keeping row ids for fixture writes.
- Added durable project identifier policy to `docs/reference/database-migrations.md`.
- Verification:
   - `pnpm run db:types:generate` ✅
   - `pnpm run check-types` ✅
   - `pnpm run check --fix` ✅
   - Focused integration tests for migrations, DB query paths, and import paths ✅
