# Question DnD Animation Audit

Date: 2026-05-16
Scope: src/questions/QuestionTable.tsx, src/db/questions.ts, src/questions/actions.ts, app/questions/page.tsx
Goal: explain the observed "jumping"/"clunky" drop behavior and propose fixes without changing code.

## Findings (ranked)

1. High confidence: UI order is not updated optimistically on drop
- Evidence:
  - QuestionTable renders directly from props (questions) coming from server data.
  - onDragEnd sends reorderQuestionsAction(updates), but does not update a local ordered state first.
  - QuestionsManagementClient does not refresh after reorder; only save/delete paths trigger router.refresh().
- Why this creates jumpy motion:
  - dnd-kit animates while dragging using transforms.
  - On drop, the underlying rendered list order is still the old order until server data eventually catches up.
  - The active item can visually settle from a stale layout, then the list updates later, producing a second movement/jump.

2. High confidence: filtered reorder payload can create conflicting global positions
- Evidence:
  - Current logic builds updates only from filtered items and assigns positions 0..N-1.
  - Backend reorderQuestions updates only submitted ids.
  - Non-filtered rows keep previous positions, which can overlap submitted positions.
- Why this creates "other elements also do things":
  - After save and reload, ORDER BY position can have ties/collisions.
  - Rows with identical positions may appear reordered unpredictably, so unrelated items seem to move.

3. Medium confidence: drag feedback model mismatch with expectations
- Evidence from dnd-kit docs:
  - Sortable lists usually either move the active item directly (no overlay) or use DragOverlay with a presentational clone.
  - Overlay usage must avoid rendering a second sortable hook with same id.
- Why this matters:
  - If the visual feedback is not aligned with state updates, the drop animation can feel like "item teleports then snaps".
  - For this specific page, DragOverlay is not required and adds complexity/risk without clear benefit.

4. Low-medium confidence: pointer activation and click interactions can add perceived lag
- Evidence from docs/issues:
  - Sensor configuration affects how soon drag starts and can reduce accidental click/drag conflicts.
- Why this matters:
  - Not the primary jump cause, but can worsen perceived responsiveness.

## Online references reviewed

- dnd-kit issue 926 (hydration id mismatch): passing DndContext id via useId addresses hydration mismatch, not ordering/animation jitter by itself.
- dnd-kit sortable docs:
  - items order in SortableContext must match rendered order.
  - Recommended pattern is local items state update onDragEnd (arrayMove) for immediate visual consistency.
  - DragOverlay is mainly helpful in specific cases (e.g. scroll/clipping constraints) and requires a presentational component pattern.
- dnd-kit issue 845:
  - Common jump-on-drop symptom when index/order bookkeeping is inconsistent.

## Most likely explanation of your current behavior

What you described (active element seems to come from original location, then things move quickly and unexpectedly) matches a two-phase mismatch:

1) Drag phase is transform-based in the client.
2) Drop phase computes and sends server update, but rendered order is not immediately updated in local state.
3) Server-backed data eventually rehydrates/re-renders with a different order.
4) If filtered reorder was used, global position collisions can also reorder non-dragged items.

Result: perceived snap-back + second jump + unrelated item motion.

## Suggested fixes (no code changes applied here)

### Option A (recommended): optimistic local order + full deterministic persistence

- Keep a local list state in QuestionTable for rendered order.
- On drag end:
  - Update local order immediately with arrayMove-style logic.
  - Fire server action in transition.
- Persist a complete, collision-free global position mapping (all items, contiguous positions).
- If server call fails, rollback local state and show error.

Why this is best:
- Eliminates stale-layout snap on drop.
- Prevents position collisions.
- Gives deterministic behavior every time.

### Option B: disable reordering while a filter is active

- Allow drag only when filter is empty.
- Or keep filter but map reorder to full dataset deterministically before save.

Why this helps:
- Avoids ambiguous global ordering when only a subset is visible.

### Option C: enforce deterministic ordering in reads

- Always sort by position then id when loading questions.

Why this helps:
- Reduces unpredictable tie behavior if any equal positions exist.
- This is defensive; it does not replace Option A.

### Option D: only after A is done, tune UX details

- Keep no transparency if preferred.
- Add PointerSensor activation constraints only if accidental drags are observed.
- Keep DragOverlay removed by default in this screen.
- Reintroduce DragOverlay only if there is a demonstrated need (for example, scroll container clipping), and only with the presentational clone pattern.

## Proposed implementation order

1. Fix data flow: optimistic local order on drop.
2. Fix persistence: submit full contiguous positions globally.
3. Guard filtered mode (disable reorder or deterministic full-map transform).
4. Add deterministic fallback sort in DB reads.
5. Optional UX tuning (sensors/overlay).

## Quick validation checklist

- Drag item A between B and C: it should follow pointer and settle once.
- On drop: no second jump after network completes.
- With filter active: either reorder disabled, or reorder remains stable after refresh.
- After multiple reorders: no unrelated items change position.
- Reload page repeatedly: order remains identical.

## Notes

- The hydration warning path (issue 926) and the animation/jump path are related but distinct problems.
- Using DndContext id from useId is correct for hydration stability, but it is not a complete fix for ordering animation glitches.
- Practical decision for this feature: no DragOverlay unless a concrete, reproducible requirement appears.
- Cleanup is required: the implementation has accumulated complexity across iterations, which increases the chance of regressions and makes behavior harder to reason about.
- Recommendation: consider a focused restart from a minimal baseline (single-list sortable, local optimistic reorder, deterministic persistence), then reintroduce only necessary features.
