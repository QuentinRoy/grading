# Type System Audit (Overlap + Derivation Opportunities)

Date: 2026-05-13
Scope: `app/**`, `src/**` (focus on domain types, import/export boundaries, DB mapping, and UI-facing contracts)
Related execution plan: `docs/type-system-migration-plan.md`


## Executive Summary

The repo still has a strong type foundation:

- generated DB types from Kysely codegen (`src/db/generated/db.ts`)
- domain-level discriminated unions in `src/db/types.ts`
- Zod-backed import validation in `src/import/schemas.ts`

Since the previous report, some of the earlier high-value cleanup opportunities are still present, and the current codebase now makes a few of them easier to confirm concretely:

1. Export planning types are still parallel to domain rubric types rather than derived from them.
2. Submission export identity is still a standalone shape instead of being derived from domain submission semantics.
3. Assessment import rows are still modeled as fully dynamic string maps, even though the importer now validates a known set of required columns.
4. A UI-local `Question` type still overlaps in name with the domain `Question` type.
5. The `Submission` union still contains an asymmetric `studentId?: undefined` field on the team branch.

Compared with the previous version of this report, the notable update is that some suspected issues can now be classified more precisely:

- the export layer definitely reconstructs rubric variants in `src/db/submissionExport.ts`
- the assessment importer already performs runtime header validation, so strengthening the post-validation row type is now a low-risk improvement
- the earlier concern about broad rubric/assessment duplication across many modules appears less urgent than the export/import boundary duplication that is visible in the current code

## Findings

## 1) `ExportRubricPlan` still duplicates domain rubric variants

### Where

- `src/export/submissionExportCsv.ts`
- `src/db/submissionExport.ts`
- `src/db/types.ts`

### Current State

`ExportRubricPlan` is still handwritten as a discriminated union with the same variant tags as domain `Rubric`:

- `boolean`
- `ordinal`
- `numerical`

The export shape is close to the domain shape, with the main intentional difference being ordinal marks represented as `marksByLabel` instead of `marks`.

### Why it matters

This is still one of the clearest drift points in the codebase:

- if a shared rubric field changes, export types must be updated manually
- `loadQuestionPlan()` reconstructs every branch locally, which increases maintenance cost
- variant logic is duplicated across type definitions and data mapping code

### Updated Assessment

This remains a top refactor candidate. The overlap is no longer theoretical; it is directly visible in the export plan type and the DB-to-export projection logic.

### Recommended Direction

Derive export variants from `Rubric` first, then layer on export-only transformations.

Example direction:

- `type ExportRubricBase = Pick<Rubric, "id" | "type"> & { label: string }`
- boolean and numerical variants can largely be derived via `Extract<Rubric, { type: ... }>`
- ordinal can be derived with an explicit remap from `marks` to `marksByLabel`

### Priority

High.

---

## 2) `SubmissionIdentity` is still parallel to `Submission`

### Where

- `src/export/submissionExportCsv.ts`
- `src/db/submissionExport.ts`
- `src/db/types.ts`

### Current State

`SubmissionIdentity` is still defined as:

- `id`
- `type`
- `teamName?: string | null`
- `studentId?: string | null`

This mirrors submission ownership semantics already encoded in the domain `Submission` union, but in a weaker form.

### Why it matters

The current arrangement pushes invariants into runtime checks in `getSubmissionExportIdentifier()` instead of expressing more of them in the type system.

That is workable, but it means:

- export code uses a looser identity shape than the domain model
- ownership rules are partially re-expressed rather than reused
- future submission-model changes can drift from export assumptions

### Updated Assessment

This is still worth addressing, but the best payoff is probably a shared assertion/helper rather than forcing the entire export stream into the exact `Submission` domain type.

### Recommended Direction

A balanced improvement would be:

- derive the base identity fields from domain types where practical
- keep nullable join fields for streaming rows
- centralize invariant enforcement in a shared assertion/helper that returns a narrowed validated identity

### Priority

Medium-high.

---

## 3) `ImportedAssessmentRow` is still too broad, but now the runtime validation path is clearer

### Where

- `src/import/types.ts`
- `src/import/saveAssessments.ts`

### Current State

`ImportedAssessmentRow` is still:

- `Record<string, string>`

At the same time, `saveAssessments()` clearly depends on known required columns:

- `submission_type`
- `submitter`
- optionally recognized rubric/question-derived columns
- `grand_total_marks`

It also validates header columns up front against a recognized column set.

### Why it matters

Because header validation already exists, the current broad row type is now more obviously wider than necessary.

This weakens compile-time help in the most important importer path:

- required columns are not reflected in the type
- downstream indexing stays stringly-typed
- typo resistance is lower than it needs to be after validation has already succeeded

### Updated Assessment

This is now a lower-risk improvement than before. The runtime guardrails are already there, so the type system can safely tighten around the validated state.

### Recommended Direction

Split the notion of row shape into two phases:

- raw parsed CSV row: still broad
- validated assessment row: stronger type used after header checks

A pragmatic next step would be something like:

- known required columns plus `Record<string, string>`
- optionally a dedicated `ValidatedAssessmentRow` alias returned after header validation

### Priority

High.

---

## 4) UI-local `Question` still collides with domain `Question`

### Where

- `src/questions/QuestionList.tsx`
- `src/db/types.ts`

### Current State

`src/questions/QuestionList.tsx` still defines a local type named `Question` with fields:

- `id`
- `label`
- `href`

This is distinct from the domain `Question` type, which contains rubric and solution data.

### Why it matters

This is a naming-only problem, but it still creates friction:

- imports are more mentally expensive
- code review requires extra context to know which `Question` is meant
- the UI type is really a navigation/view-model item, not a domain question

### Updated Assessment

Still a small but worthwhile cleanup.

### Recommended Direction

Rename it to something purpose-specific such as:

- `QuestionListItem`
- `QuestionNavItem`

### Priority

Low, but easy.

---

## 5) `Submission` still has an asymmetric team-branch field

### Where

- `src/db/types.ts`

### Current State

`Submission` is still defined with:

- individual branch: `studentName: string; teamName?: undefined`
- team branch: `studentId?: undefined; teamName: string`

The team variant uses `studentId?: undefined`, even though the individual variant uses `studentName`, not `studentId`.

### Why it matters

This looks inconsistent and may represent either:

- a typo left over from an earlier shape
- an intentional exclusion field that no longer matches the actual branch structure

Either way, it makes the union harder to reason about.

### Updated Assessment

This still looks suspicious and should be confirmed. It is not necessarily causing active breakage, but it is a real clarity issue in a foundational domain type.

### Recommended Direction

Confirm intended semantics, then either:

- remove the field if it is accidental, or
- redesign the branches so they exclude the correct counterpart fields consistently

### Priority

Medium.

---

## 6) Query/result mapping is still manually shaped in export and import paths

### Where

- `src/db/submissionExport.ts`
- `src/import/saveAssessments.ts`

### Current State

The current code still defines and builds several intermediate data shapes manually:

- `rubricsByKey` value objects in the importer
- export question/rubric plans in `loadQuestionPlan()`
- streaming submission state reconstructed from joined rows

### Why it matters

These are not necessarily wrong, but they are places where selected columns and local types can diverge over time.

### Updated Assessment

This remains a valid architectural observation, but it is less urgent than the concrete boundary issues above. The code is understandable today; the main opportunity is reducing long-term drift and making helper return types more reusable.

### Recommended Direction

Prefer deriving intermediate types from helper return values or extracting typed loader helpers where the same shapes are reused.

### Priority

Medium-low.

---

## 7) Earlier rubric/assessment duplication concern should be re-prioritized

### Where

Previously suspected across:

- `src/db/types.ts`
- `src/assessment/assessment.ts`
- `src/db/assessments.ts`
- `src/db/questions.ts`
- `src/db/submissionExport.ts`
- `src/export/submissionExportCsv.ts`
- `src/import/saveAssessments.ts`

### Updated Assessment

After checking the current code surfaced by this audit pass, the strongest confirmed duplication is not a broad cross-repo repetition of shared discriminant utility types, but rather these narrower boundary issues:

- export plan duplication
- submission identity duplication
- broad import row typing

That means the previous recommendation to prioritize a new shared `src/types/rubric.ts` utility module is still reasonable, but it should no longer be treated as obviously the first thing to do unless a wider search confirms repeated discriminant helpers are actively causing friction.

### Priority

Revised from very high to medium.

## Updated Prioritized Refactor Plan

1. Tighten assessment import typing in `src/import/saveAssessments.ts` by introducing a validated row type after header checks.
2. Refactor `ExportRubricPlan` in `src/export/submissionExportCsv.ts` to derive as much as possible from domain `Rubric`.
3. Add a shared submission export assertion/helper so export identity invariants are expressed once.
4. Confirm and clean the `Submission` union field inconsistency in `src/db/types.ts`.
5. Rename the UI-local `Question` type in `src/questions/QuestionList.tsx`.
6. Optionally revisit shared rubric discriminant utility aliases if broader duplication is confirmed in a deeper pass.

## Suggested Type Utilities

These are still useful, but they should now be framed as optional enablers rather than assumed immediate requirements:

```ts
export type RubricOf<T extends RubricType> = Extract<Rubric, { type: T }>;
export type AssessmentOf<T extends RubricType> = Extract<
  AssessmentRubricValue,
  { type: T }
>;
export type AssessmentPayloadOf<T extends RubricType> = Omit<
  AssessmentOf<T>,
  "rubricId" | "type"
>;

export type WithRequired<T, K extends keyof T> = T & {
  [P in K]-?: Exclude<T[P], undefined | null>;
};
```

## Rationale Summary

The biggest current type-system opportunities are at import/export boundaries, not in the core existence of domain models. The repo already has good domain unions; the next gains come from deriving boundary types from those unions more consistently and from making post-validation importer code operate on stronger row contracts.

## Implementation Strategy Matrix

- Conservative: tighten validated assessment row typing, rename UI-local `Question`, and confirm `Submission` branch consistency.
- Balanced (recommended): conservative steps + derive `ExportRubricPlan` from `Rubric` where practical + add a shared submission identity assertion helper.
- Aggressive: balanced steps + broader extraction of rubric/assessment discriminant utility types after a deeper repo-wide pass confirms enough duplication to justify centralization.
