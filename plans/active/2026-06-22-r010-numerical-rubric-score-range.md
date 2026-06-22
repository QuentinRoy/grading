# R-010 — Numerical rubric bounds invariants (score range + marks ordering)

Status: Active
Created: 2026-06-22
Parent: `plans/active/2026-05-17-reliability-hardening.md` (risk R-010, Tier 1, issue [#23](https://github.com/QuentinRoy/grading/issues/23))
Branch: `r010-numerical-rubric-score-range`

## Purpose

R-010 began as "add characterization tests for `markNumericalRubric` boundaries."
Grilling (`/grill-with-docs`, 2026-06-22) found that a numerical rubric carries
two well-formedness rules that are enforced **inconsistently** across write
boundaries, so the task grew into enforcing both identically everywhere, plus
failing loudly in the marking function where an arithmetic breakdown exists.

The two rules:

1. **Score range** — `minScore < maxScore` (strict). A collapsed range
   (`minScore === maxScore`) breaks the marking math: `markNumericalRubric`
   (`src/rubrics/rubric.ts:36`) guards only `scoreRange < 0`, so for a collapsed
   range the score is forced to equal both bounds, `scoreOffset` is `0`, and the
   interpolation computes `0 / 0 = NaN`, returned **silently**. `markRubric`
   calls straight in, so `NaN` would reach export, the assessment summary, the
   rubric overview, and `RubricGradeRow`.
2. **Marks ordering** — `minMarks <= maxMarks` (non-strict; flat is allowed,
   inverted is not). This one has **no** arithmetic hazard:
   `markNumericalRubric` interpolates `minMarks > maxMarks` perfectly well (the
   `(maxMarks − minMarks)` term just goes negative, producing a descending
   mapping). It is purely a write-boundary well-formedness rule.

Current enforcement (before this task):

| Boundary | `minScore < maxScore` | `minMarks <= maxMarks` |
|---|---|---|
| Import zod (`src/import/schemas.ts:63`, `:60`) | ✅ | ✅ |
| Editor zod (`src/questions/schemas.ts`) | ❌ | ❌ |
| DB (`numerical_rubric`) | ❌ | ❌ |
| `markNumericalRubric` | partial (`< 0` only, `=== 0` → `NaN`) | tolerant (by design) |

`CONTEXT.md` already warns against exactly this ("enforced identically at every
write boundary"). This task closes the editor and DB gaps for both rules and
fixes the marking function's `NaN` hole for the score range.

## Decisions locked (do not re-litigate)

1. **Score range: collapsed range throws in the marking function.** The user
   considered returning `minMarks` (the `scoreOffset → 0` limit) but chose to
   **throw**. The guard in `src/rubrics/rubric.ts` becomes `scoreRange <= 0`
   (was `< 0`), message drops "or equal to":
   `Invalid rubric: maxScore (X) must be greater than minScore (Y)`. Deliberate
   behavior change (silent `NaN` → throw). It is an **invariant violation**
   error, not a user-facing recoverable one — keep it a plain `Error`, no
   actionable-recovery shaping, consistent with the `CONTEXT.md` *Rubric Subtype
   Invariant* fail-loudly stance.
2. **Marks ordering does NOT throw in the marking function.** `markNumericalRubric`
   keeps tolerating any marks ordering — there is no arithmetic basis to throw
   (no `NaN`), and a descending mapping is well-defined. Recorded explicitly so
   the implementer does not "helpfully" add a marks throw. The marks rule lives
   only at the write boundaries (editor, import, DB).
3. **Enforce both rules at every write boundary (defense in depth), because the
   user required these states to be "impossible":**
   - **Editor zod** (`src/questions/schemas.ts`): add both checks → close gaps.
   - **DB CHECK** (`numerical_rubric`): add both checks via one new migration.
   - **Import zod** (`src/import/schemas.ts`): already enforces both → leave it.
   Strictness matches the existing import rules and the marking math: score is
   strict (`>`), marks is non-strict (`>=`).
4. **Editor check placement.** Add both inside the existing `superRefine` on
   `questionDefinitionSchema` (`src/questions/schemas.ts:57`), where rubric-level
   cross-field validation already lives (id uniqueness). Iterate
   `question.rubrics`; for a `type === "numerical"` rubric:
   - `minScore >= maxScore` → issue at `["rubrics", index, "maxScore"]`, message
     `Max score must be greater than min score`.
   - `minMarks > maxMarks` → issue at `["rubrics", index, "maxMarks"]`, message
     `Max marks must be greater than or equal to min marks`.
   This sidesteps any `discriminatedUnion` + `.refine` friction and co-locates
   the rules with the other rubric validation.
5. **DB constraints are a new migration**, never a rewrite of the committed
   `20260513000000_init.ts`. One migration file
   `src/db/migrations/<timestamp>_enforce_numerical_rubric_bounds.ts` adding both:
   - `CHECK ("max_score" > "min_score")` (`numerical_rubric_score_range_check`)
   - `CHECK ("max_marks" >= "min_marks")` (`numerical_rubric_marks_range_check`)
   with a `down()` dropping both. Columns confirmed: `min_score`/`max_score`/
   `min_marks`/`max_marks`, all `numeric(10, 2)` notNull
   (`20260513000000_init.ts:201-204`). Follow
   `docs/reference/database-migrations.md`. Building both checks up across
   slices 4–5 in the same not-yet-applied local migration is allowed under the
   migration discipline's local-development exception.
6. **No ADR.** This applies the already-documented *Rubric Subtype Invariant* /
   fail-loudly pattern, precedented by R-002's DB enforcement on this exact
   table. Not hard-to-reverse, not surprising.
7. **Add a `CONTEXT.md` glossary entry, `Numerical Rubric Bounds`**, parallel to
   *Ordinal Marks Minimum*, covering both rules and their asymmetry. Land it in
   the same PR as the enforcement so the glossary never describes an unenforced
   rule. Proposed text:

   > **Numerical Rubric Bounds**:
   > A numerical **Rubric Definition** must satisfy `minScore < maxScore` (a
   > collapsed or inverted score range is not authorable) and
   > `minMarks <= maxMarks` (marks may be flat but not inverted). Both are
   > enforced identically at every write boundary — editor, import, and a DB
   > CHECK. The marking function additionally fails loudly on a violated score
   > range (`scoreRange <= 0`) rather than returning `NaN`; it tolerates any
   > marks ordering arithmetically, so the marks rule lives only at the write
   > boundaries.
   > _Avoid_: zero-width or inverted score ranges, inverted marks ranges,
   > tolerant `NaN` marks, per-boundary rules that disagree.

## TDD execution (behavior changes go red→green; characterization is a net)

Per `/tdd` (user instruction: "any behavior change must follow /tdd pattern for
the new boundaries"). The marking-function score-range throw and the two
write-boundary additions are the behavior changes and each get a failing test
first. The `markNumericalRubric` characterization tests pin **existing**
behavior, are green the moment written, and act as a golden-master net — they are
not TDD slices and writing them is not horizontal slicing.

Do the work as vertical slices, in this order. Run the targeted test after each
step; do not batch.

### Step 0 — Characterization net (green immediately), `src/rubrics/rubric.test.ts`

Before touching `rubric.ts`, add tests asserting today's behavior. Rename the
stale `describe("scoreToMarks")` / `describe("booleanToMarks")` blocks to the
actual function names. Cases (all pass against current code):

- non-reversed edge: `score === minScore → minMarks`.
- non-reversed edge: `score === maxScore → maxMarks`.
- reversed edge: `score === minScore → maxMarks`.
- reversed edge: `score === maxScore → minMarks`.
- mid-range interpolation with non-zero `minMarks` and/or negative marks
  (characterizes the linear formula beyond the `minMarks = 0` happy path).
- `score > maxScore` throws.
- `score < minScore` throws.
- `minScore > maxScore` (strictly inverted, `scoreRange < 0`) throws.
- **inverted marks are tolerated** (decision 2): `minMarks > maxMarks` does not
  throw and produces the expected descending mark (e.g. `minMarks: 5,
  maxMarks: 0`, mid-score → a value below `minMarks`). Pins the deliberate
  no-throw decision so a later change can't silently add a marks throw.

### Slice 1 — `markNumericalRubric` collapsed score range (behavior change)

- **RED:** `markNumericalRubric throws when minScore === maxScore`. Fails today
  (returns `NaN`, no throw).
- **GREEN:** change the guard to `scoreRange <= 0` and update the message
  (decision 1).

### Slice 2 — Editor zod: score range (new boundary), `src/questions/schemas.ts`

- **RED:** in `src/questions/schemas.test.ts`, `questionDefinitionSchema rejects a
  numerical rubric with minScore === maxScore` — `result.success === false`,
  issue at `rubrics.0.maxScore`, message `Max score must be greater than min
  score`. Fails today (parses fine). Use `safeParse` + `issue.path.join(".")`
  matching as in that file.
- **GREEN:** add the score-range `superRefine` check (decision 4).
- **Then (green after impl):** `rejects minScore > maxScore`; `accepts minScore <
  maxScore`.

### Slice 3 — Editor zod: marks ordering (new boundary), `src/questions/schemas.ts`

- **RED:** `questionDefinitionSchema rejects a numerical rubric with minMarks >
  maxMarks` — issue at `rubrics.0.maxMarks`, message `Max marks must be greater
  than or equal to min marks`. Fails today.
- **GREEN:** add the marks-ordering `superRefine` check (decision 4).
- **Then (green after impl):** `accepts minMarks === maxMarks` (flat marks are
  valid); `accepts minMarks < maxMarks`.

### Slice 4 — DB CHECK: score range (new boundary)

- **RED:** in `src/db/constraints.integration.test.ts`, a `numericalRubric`
  insert with `maxScore === minScore` is rejected and rolls back in a
  transaction (mirror the existing R-002 rollback assertions; the file already
  inserts into `numericalRubric` directly). Fails today.
- **GREEN:** new migration (decision 5) adding the
  `numerical_rubric_score_range_check`.
- **Then (green):** `maxScore < minScore` likewise rejected.

### Slice 5 — DB CHECK: marks ordering (new boundary)

- **RED:** a `numericalRubric` insert with `maxMarks < minMarks` is rejected and
  rolls back. Fails today.
- **GREEN:** add `numerical_rubric_marks_range_check` to the same migration.
- **Then (green):** `maxMarks === minMarks` is accepted (flat marks valid).

### Refactor / simplify pass

After all slices are green, run the simplify pass
(`.agents/skills/simplify/SKILL.md`) over the touched code only (`rubric.ts`,
`schemas.ts`, the migration, the three test files). Preserve behavior; no broad
refactors.

## Verified facts (checked against code 2026-06-22)

- **`markNumericalRubric` guards only `scoreRange < 0`** (`src/rubrics/rubric.ts:41`);
  `minScore === maxScore` reaches `0 / 0` and returns `NaN`. It applies no marks
  ordering constraint — `minMarks > maxMarks` interpolates fine (descending).
- **Interactive write path already rejects `maxScore <= minScore`**
  (`src/assessments/assessmentMutations.ts:225`) at assessment-save time, but
  does not stop a collapsed/inverted-bounds *rubric config* from being authored.
- **Import zod already enforces both rules:** `minScore < maxScore`
  (`src/import/schemas.ts:63`) and `minMarks <= maxMarks` (`:60`). Its other
  four numerical refinements (`:39`–`:50`) exist only because import makes the
  fields optional and defaults them via `.transform`; the editor types all four
  as required `z.number()`, so those have no editor analog and are not part of
  this parity work.
- **Editor zod enforces neither cross-field rule.**
  `numericalRubricDefinitionSchema` (`src/questions/schemas.ts:31`) only types
  the numbers; the `superRefine` (`:57`) checks only rubric-id uniqueness.
- **DB has no range/ordering checks.** `numerical_rubric` declares
  `min_score`/`max_score`/`min_marks`/`max_marks` as `notNull` `numeric(10, 2)`
  with no CHECK (`20260513000000_init.ts:197-204`). The only numerical DB guards
  are the assessment-score-bounds trigger (`20260514000001_…`) and the
  subtype-match trigger.
- **Callers of `markNumericalRubric` (via `markRubric`)**: `submissionExport.ts:195`,
  `assessmentSummary.ts:23`, `rubricOverviewBuilder.ts:250`,
  `RubricGradeRow.tsx:35`. All would surface `NaN` today on a collapsed-range
  rubric with a recorded assessment.

## Out of scope

- Import schema changes (already correct) and the interactive assessment write
  path (already correct).
- A marks throw in `markNumericalRubric` (decision 2 — deliberately not added).
- Reworking `markNumericalRubric`'s existing out-of-range / inverted-score
  throws — characterized, not changed.

## Acceptance (Tier 1 Definition of Done)

- [ ] `markNumericalRubric` throws on `scoreRange <= 0` with the updated message;
      keeps tolerating inverted marks; slice-1 RED test and the Step-0
      characterization net all green.
- [ ] `questionDefinitionSchema` rejects `minScore >= maxScore`
      (`rubrics.<i>.maxScore`) and `minMarks > maxMarks` (`rubrics.<i>.maxMarks`);
      slices 2–3 tests green, including the flat-marks accept case.
- [ ] New migration adds `numerical_rubric_score_range_check` and
      `numerical_rubric_marks_range_check` with a working `down()`; slices 4–5
      integration tests green; migration applies cleanly.
- [ ] `CONTEXT.md` gains the `Numerical Rubric Bounds` entry (decision 7).
- [ ] Regression check (TDD discipline): temporarily revert each GREEN change and
      confirm its RED test fails, then restore.
- [ ] `pnpm run check --fix`, `pnpm run check-types`, `pnpm test:unit rubric schemas`,
      `pnpm test src/db/` all green.
- [ ] R-010 promoted to Verified in
      `plans/active/2026-05-17-reliability-hardening.md`: rewrite the Risk/Next
      Action wording (it became multi-layer enforcement of both numerical bounds
      with a deliberate `NaN → throw` change — the prior "no behavior change
      expected" is now false), link the test files, refresh the Section 3
      dashboard (Tier 1: 0 open, 7 verified) and milestones (M4/M5), add a Change
      Log entry. PR body includes `Fixes #23`.
- [ ] Move this plan to `plans/completed/` on merge.
