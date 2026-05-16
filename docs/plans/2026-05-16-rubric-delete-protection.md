# Plan: Rubric Delete Protection Dialog

## Summary
Implement a protection dialog for deleting rubrics, modeled after the question delete dialog, using a shared confirmation phrase builder for consistency and safety.

## Steps
1. Move and generalize the confirmation phrase logic to `src/shared/useDeleteConfirmation.ts`.
2. Update `DeleteQuestionDialog` to use the shared logic.
3. Create `DeleteRubricDialog` in `src/rubrics/`, using the shared logic and matching UI/UX.
4. Add a Storybook story for `DeleteRubricDialog` for UI/UX validation.
5. Update documentation and repo memory to reflect the shared pattern.

## Notes
- Only the confirmation phrase logic is shared; dialogs remain separate for clarity.
- Dialogs require the user to type a specific phrase to confirm deletion, preventing accidental destructive actions.
