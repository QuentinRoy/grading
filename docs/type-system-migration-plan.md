# Type System Migration Plan

Date: 2026-05-13
Status: Active working plan
Related: `docs/type-audit-report.md`

## Status snapshot

| Field | Current value |
| --- | --- |
| Current phase | Phase 0 — Investigation and decision record |
| Overall status | Not started |
| Current blocker | None |
| Open uncertainties | Submission architecture; ordinal export representation; import staging and naming |
| Last confirmed decisions | Domain-first architecture; `Rubric`/`AssessmentRubricValue` canonical; `switch` + `assertNever`; strict import |
| Last updated | 2026-05-13 |

## Purpose


This document turns the current type audit into an execution plan.

It is intentionally written as a living migration plan that should be updated as work progresses. The goal is not only to fix isolated typing issues, but to reshape the code so that domain types are the source of truth and import/export boundaries derive from them in a readable, safe, maintainable way.

## Current decisions and constraints

These decisions are already agreed and should be treated as default guidance unless new investigation results prove they need revision.

### Canonical source-of-truth decisions

- `src/db/types.ts` is the canonical domain type layer.
- `Rubric` is the canonical source of truth for rubric variants.
- `AssessmentRubricValue` is the canonical source of truth for rubric assessment variants.
- `db/generated/*` is generated DB-facing material and should stay scoped to DB-related code.

### Refactor scope decisions

- The repo is self-contained and experimental.
- Cross-cutting renames and signature changes are acceptable.
- Large internal refactors are acceptable if they improve architecture.
- Behavior fixes are allowed when a real inconsistency is found, but they must be validated when encountered.
- DB schema changes are allowed if they improve alignment with the domain model, provided read/write safety is validated.

### Type design decisions

- Prefer readable `switch (value.type)` branching with `assertNever` exhaustiveness checking.
- Helper functions are welcome.
- Do not introduce visitor-pattern abstractions unless a concrete use case justifies them.
- Use derived/shared utility types when they clearly improve reuse.
- Avoid unnecessary type-level cleverness that hurts readability.
- Keep types close to usage unless shared reuse clearly justifies extraction.

### Import and data safety decisions

- Import should be strict, not permissive.
- Unknown columns should be rejected.
- Import work should move toward validated row types plus normalization helpers.
- Data integrity is the top priority, especially around DB persistence.
- Validation expectations include diagnostics, tests, and focused regression checks.

### Confirmed audit clarification

- In `Submission`, the team branch field `studentId?: undefined` is a typo.
- The intended exclusion there is the other branch's `studentName` field.
- Submission modeling still requires investigation before deciding whether one type or multiple purposeful types is the best long-term architecture.

## Audit summary translated into migration priorities

The current audit findings suggest these priorities:

1. Investigate and stabilize the domain model around `Submission` before broad propagation.
2. Refactor export planning to derive from domain rubric types instead of redefining them.
3. Refactor import assessment rows into validated and normalized stages.
4. Standardize readable discriminant handling and exhaustiveness checks.
5. Remove misleading local type names and residual duplicated boundary shapes.

## Migration strategy

This is an architecture-first migration.

That means we do not start by patching every boundary type in place. We first investigate unresolved domain questions, then stabilize domain architecture, then align import/export boundaries, then clean up residual drift.

## Uncertainty handling rule

New uncertainty discovered during execution should not be silently papered over with assumptions.

If implementation work reveals unclear semantics, conflicting usage patterns, or a domain/DB mismatch that was not previously identified, that uncertainty must be explicitly recorded in this document and discussed before proceeding with broad structural changes.

### Practical rule

- If uncertainty affects naming only and the intended meaning is still obvious, it can usually be resolved locally.
- If uncertainty affects domain modeling, persistence behavior, import/export contracts, or data integrity, stop and discuss before continuing.
- If uncertainty changes the assumptions of a current phase, update the decision log and checklist before further work.


## Phase overview

- Phase 0: Investigation and decisions
- Phase 1: Domain model stabilization
- Phase 2: DB/domain alignment
- Phase 3: Export boundary refactor
- Phase 4: Import boundary refactor
- Phase 5: Naming and local type cleanup
- Phase 6: Consistency pass and documentation refresh

---

## Phase 0 — Investigation and decision record

### Goal

Resolve open domain questions before changing core architecture.

### Checklist

#### 0.1 Submission model investigation

- [ ] Find every usage of `Submission`.
- [ ] Find every usage of `SubmissionType`.
- [ ] Find every usage of `studentName`, `studentId`, and `teamName` in submission-related flows.
- [ ] Identify whether current `Submission` is acting as domain type, display type, export type, DB projection, or a mix.
- [ ] Determine whether canonical submission identity is owner-oriented, display-oriented, or needs to be split.
- [ ] Decide whether to keep one main `Submission` type or split into purposeful domain-facing types.

#### 0.2 Ordinal rubric representation investigation

- [ ] Find every usage of `marksByLabel`.
- [ ] Determine whether `marksByLabel` is only export-specific or has broader architectural value.
- [ ] Compare export needs against domain `marks: Record<string, number>`.
- [ ] Decide whether ordinal export planning should adapt at the final edge or keep a distinct internal export shape.

#### 0.3 Import pipeline investigation

- [ ] Trace assessment import from parse to validation to normalization to save.
- [ ] Identify where broad CSV rows can become validated rows.
- [ ] Identify where normalization helpers should exist.
- [ ] Determine whether `ImportedSubmission` and related names still match actual lifecycle semantics.

### Phase 0 deliverables

- [ ] Add a short decision summary to this document for submission modeling.
- [ ] Add a short decision summary to this document for ordinal rubric representation.
- [ ] Add a short decision summary to this document for import staging.

### Phase 0 exit criteria

- [ ] There is a clear decision on `Submission` architecture direction.
- [ ] There is a clear decision on ordinal rubric representation strategy.
- [ ] There is a clear decision on import row staging.

---

## Phase 1 — Domain model stabilization

### Goal

Make `src/db/types.ts` a clean and reliable source of truth for domain concepts.

### Candidate focus areas

- `Submission`
- `Rubric`
- `AssessmentRubricValue`
- small reusable domain derivation helpers if justified
- exhaustiveness patterns and `assertNever`

### Checklist

#### 1.1 Submission cleanup

- [ ] Correct the asymmetric `Submission` branch typo as part of the chosen architecture.
- [ ] If investigation supports it, split mixed-purpose submission concerns into clearer types.
- [ ] Keep naming aligned with actual responsibility: domain identity, display, owner, export-ready view, etc.

#### 1.2 Domain derivation helpers

- [ ] Evaluate whether `RubricOf<T>` is justified by actual reuse.
- [ ] Evaluate whether `AssessmentOf<T>` is justified by actual reuse.
- [ ] Add only the shared aliases that clearly improve multiple modules.
- [ ] Keep helpers near the domain layer unless broader reuse proves necessary.

#### 1.3 Exhaustiveness strategy

- [ ] Add or standardize `assertNever` utility if needed.
- [ ] Prefer `switch`-based discriminant handling for rubric and assessment variants.
- [ ] Avoid visitor-style abstractions unless a concrete case justifies them.

### Phase 1 exit criteria

- [ ] Domain types read clearly and consistently.
- [ ] Core discriminated unions are the obvious source of truth.
- [ ] There is no unresolved ambiguity about what `Submission` means.

---

## Phase 2 — DB and domain alignment

### Goal

Ensure DB-facing code and persistence assumptions support the chosen domain model.

### Checklist

#### 2.1 Read/write alignment

- [ ] Review DB loaders and mappers that construct `Submission`, `Rubric`, and related domain values.
- [ ] Identify any mismatch between DB shape and intended domain shape.
- [ ] Decide whether mapping cleanup is enough or whether schema changes are justified.

#### 2.2 Safety validation

- [ ] Validate that save paths still persist the intended data correctly after any domain changes.
- [ ] Validate that load paths still reconstruct the intended domain values correctly.
- [ ] Add or update targeted tests for DB-integrity-sensitive flows.

#### 2.3 Optional DB migration work

- [ ] If a schema mismatch is discovered, document the reason before changing the DB.
- [ ] If a DB change is needed, define migration scope and rollback assumptions.
- [ ] Verify read/write safety before proceeding to broad boundary refactors.

### Phase 2 exit criteria

- [ ] Persistence logic matches the chosen domain architecture.
- [ ] Any DB changes are justified, validated, and documented.

---

## Phase 3 — Export boundary refactor

### Goal

Make export types derive from domain types wherever the concepts are the same.

### Candidate focus areas

- `src/export/submissionExportCsv.ts`
- `src/db/submissionExport.ts`

### Checklist

#### 3.1 Rubric export derivation

- [ ] Refactor `ExportRubricPlan` to derive as much as possible from domain `Rubric`.
- [ ] Revisit whether `marksByLabel` should remain an internal export planning shape.
- [ ] Keep export-specific transformation only where it adds real clarity.

#### 3.2 Submission export identity

- [ ] Replace or narrow `SubmissionIdentity` using domain-derived logic where practical.
- [ ] Add a shared assertion/helper for export-ready submission identity.
- [ ] Centralize submission export invariant checks.

#### 3.3 Export flow readability

- [ ] Simplify row generation around validated domain-aligned inputs.
- [ ] Use readable `switch` + `assertNever` handling for discriminant logic where needed.

### Phase 3 exit criteria

- [ ] Export types no longer duplicate domain variants without a good reason.
- [ ] Export identity rules are expressed once and reused.
- [ ] CSV behavior remains correct and tested.

---

## Phase 4 — Import boundary refactor

### Goal

Turn assessment import into a stricter, clearer, validated pipeline.

### Candidate focus areas

- `src/import/types.ts`
- `src/import/saveAssessments.ts`
- related import parsing/normalization helpers

### Checklist

#### 4.1 Row typing

- [ ] Separate broad parsed row shape from validated row shape.
- [ ] Add validated row types after header checks.
- [ ] Keep the importer strict about required columns and unknown columns.

#### 4.2 Normalization helpers

- [ ] Add helpers for extracting required columns from validated rows.
- [ ] Add helpers for converting row cells into domain-ready assessment inputs.
- [ ] Reduce direct string-key indexing in downstream logic.

#### 4.3 Naming cleanup in import types

- [ ] Reassess names like `ImportedSubmission` if they do not reflect actual lifecycle role.
- [ ] Keep names aligned with raw, validated, or normalized responsibilities.

### Phase 4 exit criteria

- [ ] Import row contracts are meaningfully stronger.
- [ ] Import logic is stricter and clearer.
- [ ] Errors remain understandable and useful.

---

## Phase 5 — Naming and local type cleanup

### Goal

Remove ambiguous local names and low-value overlap.

### Checklist

- [ ] Rename UI-local `Question` in `src/questions/QuestionList.tsx` to a purpose-specific name.
- [ ] Rename any other local DTO types whose names collide with domain concepts.
- [ ] Remove stale type aliases made obsolete by the migration.

### Phase 5 exit criteria

- [ ] Local UI and boundary types no longer create obvious naming confusion.

---

## Phase 6 — Consistency pass and docs refresh

### Goal

Finish the migration by removing residual drift and synchronizing docs.

### Checklist

- [ ] Replace remaining unjustified duplicated discriminant logic where worthwhile.
- [ ] Remove obsolete intermediate types.
- [ ] Update `docs/type-audit-report.md` to reflect what was actually changed.
- [ ] Update this migration plan with completed work and any scope changes.
- [ ] Document any deliberate non-goals or deferred items.

### Phase 6 exit criteria

- [ ] The codebase reflects the intended domain-first architecture.
- [ ] The audit and migration plan are aligned with reality.

---

## Validation checklist

This checklist applies throughout all phases.

### Diagnostics and correctness

- [ ] Run diagnostics after meaningful changes.
- [ ] Fix or consciously document new type errors.
- [ ] Use focused tests when changing import/export/domain behavior.

### DB safety

- [ ] Validate write behavior after domain or persistence changes.
- [ ] Validate read behavior after mapping changes.
- [ ] Treat DB-integrity-sensitive changes as hard checkpoints.

### Behavior and regression checks

- [ ] Keep export header and row behavior verified.
- [ ] Keep import accept/reject behavior verified.
- [ ] Reassess any behavior fix when a type refactor exposes inconsistencies.

## Working notes / decision log

This section should be updated iteratively during execution.

### Open decisions

- Submission architecture after usage investigation: pending
- Ordinal export representation strategy: pending
- Import staging shape and naming: pending

### Confirmed decisions

- Domain-first architecture
- `Rubric` and `AssessmentRubricValue` are canonical unions
- Prefer `switch` + `assertNever`
- No visitor abstraction without a concrete need
- Strict import behavior
- Large refactors and renames are acceptable
- DB changes are allowed if validated safely

### Non-goals unless evidence justifies them

- Introducing a generalized visitor framework for discriminated unions
- Over-abstracting query result typing
- Extracting broad shared type utility modules without clear reuse
