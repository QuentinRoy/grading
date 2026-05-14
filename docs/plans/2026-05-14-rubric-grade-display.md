# Plan: Show (grade/max) for each rubric

**Date:** 2026-05-14  
**Status:** Done

## Goal

Display the current calculated grade alongside the max for each rubric row in the assessment UI:
- If no assessment: `(?/max)`
- If assessed: `(grade/max)`
- Special case: if max is 0, display min instead (possibly negative): `(?/min)` or `(grade/min)`

## Affected Files

| File | Change |
|------|--------|
| `src/rubrics/rubric.ts` | Add `getRubricMinMarks` export |
| `src/rubrics/RubricGradeRow.tsx` | Update grade display from `(max)` to `(grade/bound)` |
| `src/rubrics/RubricGradeRow.stories.tsx` | Add stories covering no-assessment and zero-max cases |

## Steps

- [x] Add `getRubricMinMarks` to `src/rubrics/rubric.ts` — mirrors `getRubricMaxMarks`
- [x] Update `src/rubrics/RubricGradeRow.tsx`:
  - Import `markRubric` and `getRubricMinMarks`
  - Compute `maxMarks`, `minMarks`, `rubricBound` (`maxMarks === 0 ? minMarks : maxMarks`)
  - Compute `currentMarks` (`assessment != null ? markRubric(rubric) : null`)
  - Replace `({rubricMarks})` with `({currentMarks != null ? currentMarks : "?"}/{rubricBound})`
- [x] Add Storybook stories for edge cases (zero max / negative min)
- [x] Run `pnpm run check --fix`
- [x] Run `pnpm run check-types`

## Decisions

- No assessment → `?`, not `0`, to clearly distinguish "not yet graded" from "scored zero"
- Zero max → show `getRubricMinMarks` as the bound (e.g. `(?/-1)`)
- Grade formatting: raw computed number, no special rounding (matches existing display style)
