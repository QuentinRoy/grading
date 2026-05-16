# Ordinal Rubric Row Layout Update

## Goal
Improve ordinal rubric readability by preventing line wraps inside each grade option and by placing the rubric label/description directly to the right of the control.

## Scope
- Update the ordinal control option content so the label is left-aligned and the numeric grade is right-aligned on one line.
- Update rubric row layout so:
  - a fixed leading marker slot keeps all rows aligned,
  - control occupies only the width it needs,
  - label + description are immediately to the right of the control with a small gap,
  - marks summary remains right-aligned.
- Show a light gray dot when unassessed, a gently pulsing blue dot while saving, and a green dot once assessed and saved.
- Keep existing behavior for boolean and numerical controls.

## Planned Changes
1. Edit src/rubrics/OrdinalGradeControl.tsx
- Render each toggle option as a two-column row (label left, score right).
- Add no-wrap safeguards and a minimum width so options do not break onto two lines.

2. Edit src/rubrics/RubricGradeRow.tsx
- Change row structure so marker + control + text are grouped in one flexible area.
- Replace the inline status indicator beside the control with a fixed leading marker slot.
- Keep right marks column right-aligned.
- Render the marker as a dot with a subtle pulse when saving.

3. Add a reusable marker component
- Create a small component with one `status` prop so the marker logic is isolated from the row layout.
- Reuse the same fixed-width slot for all rubric rows.

4. Validate
- Run pnpm run check --fix.
- Run pnpm run check-types.

## Risks
- Tight widths on very small screens could compress long labels; we will allow text truncation before wrapping in control buttons to preserve row height and readability.
