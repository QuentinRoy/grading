# Ordinal Rubric Selected Label Validation — DB Constraint

**Date:** 2026-05-14

## Goal

Add a database-level constraint so that `ordinal_rubric_assessment.selected_label` must exist as a label in `ordinal_rubric_value` for the corresponding rubric.

## Why a trigger

Same reason as the numerical score bounds constraint: a `CHECK` constraint cannot span tables.

## Join chain

```
ordinal_rubric_assessment.rubric_assessment_id
  → rubric_assessment.rubric_id
  → ordinal_rubric.rubric_id
  → ordinal_rubric_value.ordinal_rubric_id  (label must match selected_label)
```

## Plan

1. Create a new migration file:
   `src/db/migrations/20260514000002_enforce_ordinal_label_valid.ts`

2. **`up`**: Add a PL/pgSQL trigger function `enforce_ordinal_label_valid()` and attach it as `trg_ordinal_label_valid` on `BEFORE INSERT OR UPDATE OF selected_label, rubric_assessment_id` on `ordinal_rubric_assessment`.

   The function will:
   - Resolve `rubric_id` via `rubric_assessment`
   - Check that a matching row exists in `ordinal_rubric_value` (via `ordinal_rubric`) with `label = NEW.selected_label`
   - `RAISE EXCEPTION` if no matching label is found

3. **`down`**: Drop the trigger and function.

## No application-layer changes

`saveAssessment` in `src/db/assessments.ts` already validates the label at the app level. The DB constraint is additive.
