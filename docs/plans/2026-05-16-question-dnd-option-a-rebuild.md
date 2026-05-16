# Question DnD Option A Rebuild Plan

Date: 2026-05-16
Goal: Rebuild question reordering with a minimal, deterministic implementation.

## Scope

- Rework QuestionTable drag-and-drop flow from scratch (minimal code path).
- Keep DragOverlay removed.
- Keep hydration-safe DndContext id via useId.
- Implement optimistic local ordering.
- Persist full, contiguous positions for all questions.

## Steps

1. Simplify local state model in QuestionTable
- Introduce local ordered list state initialized from props.
- Sync local state from props when server data changes.

2. Rebuild drag-end algorithm
- Resolve active/over indices from local visible order.
- Apply array move locally immediately (optimistic UI).
- Build full global position payload (all items, no gaps, no collisions).
- Persist through reorderQuestionsAction in transition.
- On error, rollback local order and surface minimal error state.

3. Filter-safe behavior
- Reordering while filtered remains deterministic:
  - move inside filtered subset
  - recombine with non-filtered items preserving relative order
  - submit full contiguous positions for complete list

4. Keep rendering simple
- Single draggable item component + useSortable.
- No overlay, no custom drag cloning path.
- No transparency changes beyond default (1.0 unless dragging style needed by dnd-kit).

5. Validation
- Run typecheck and biome formatting.
- Manual behavior checks:
  - dragged item settles once
  - no post-drop jump
  - no unrelated row movement
  - order stable after refresh

## Acceptance criteria

- Smooth drop with no second jump.
- No position collisions in DB updates.
- Drag behavior remains stable with and without filter.
- Code complexity reduced versus previous iteration.
