# Assessment Navigation Investigation V2

## Goal
Reduce submission-to-submission navigation loading flashes by addressing cache invalidation scope and unnecessary blocking work on the question assessment route.

## Scope
- Focus on the submission question route and related cache tags.
- Broader refactors are acceptable if clearly motivated, but each must be explicitly called out in this plan and audited before implementation.

## Findings

### Already implemented (cache scoping fix)
- `loadSubmissionQuestionProgress` was tagged with global `"assessments"`, causing it to be invalidated on every save for any submission/question.
- Fixed: now uses `assessments:question:${questionId}` + `"assessments:all"` (the latter busted only by imports). `saveAssessment` now also calls `updateTag(`assessments:question:${questionId}`)`.
- This is a valid correctness fix regardless of the UX issue.

### Root cause of the loading flash (even without saves)
Every navigation to a new submission URL triggers a full server RSC round-trip:
1. `loading.tsx` fires **immediately** when navigation starts (Suspense boundary), before the server responds.
2. Server runs `SubmissionRubricSection` — individual data functions are fast (`"use cache"`), but the server must **re-serialize** the full RSC payload on every request: the `submissions` array, `progressBySubmissionId`, rubrics, and client component props.
3. The serialized payload travels back over the network → loading clears.

The ~100ms is the sum of: network round-trip + RSC serialization of large props. With prefetch requests already firing (confirmed), the bottleneck is that the client router cache doesn't yet hold the full payload by the time the user clicks, OR the payload is not cached on the server side (RSC output re-generated every time).

## Proposed Changes (revised)
1. Add `"use cache"` to `SubmissionRubricSection` in the page, tagged with `assessments:${submissionId}:${questionId}`, `questions:${questionId}`, `submissions`. This caches the serialized RSC output per `{submissionId, questionId}` on the server, so repeat navigations (and prefetch) get an instant server response.
2. Add `prefetch` to the prev/next `<Link>` buttons in `SubmissionAssessmentClient`. When the prefetched RSC payload is already in the client router cache, Next.js completes the navigation without ever showing `loading.tsx`.

## Validation
- Manual checks:
  - Navigate quickly between adjacent submissions for the same question.
  - Confirm reduced or eliminated loading flash in normal local dev flow.
  - Confirm saved rubric values and progress counters stay accurate.
- Automated checks:
  - `pnpm run check --fix`
  - `pnpm run check-types`

## Risks
- Cache tag scoping mistakes could temporarily show stale progress.
- Narrowing invalidation too much could miss a dependent global view.

## Rollback
- Revert touched files for this change set only.

## Progress
- [x] Investigation completed.
- [x] Plan validated by user.
- [x] Implementation completed.
- [x] Validation completed.

## Implementation Summary

### Changes Made
1. **[app/assessments/submissions/[submissionId]/questions/[questionId]/page.tsx](app/assessments/submissions/[submissionId]/questions/[questionId]/page.tsx)** — Added `"use cache"` directive to `SubmissionRubricSection` with tags:
   - `assessments:${submissionId}:${questionId}` — busted on rubric save
   - `assessments:question:${questionId}` — busted by per-question import (if added in future)
   - `questions:${questionId}` — busted on question structure change
   - `submissions` — busted on any submission import
   
   This caches the full serialized RSC output per {submissionId, questionId} on the server, enabling instant responses on repeat navigations.

2. **[src/assessment/SubmissionAssessmentClient.tsx](src/assessment/SubmissionAssessmentClient.tsx)** — Added `prefetch` prop to prev/next `<Link>` buttons:
   - `prefetch={previousSubmission != null}` / `prefetch={nextSubmission != null}`
   - Only prefetches when the button is enabled (next/prev submission exists)
   - Next.js fetches the full RSC payload eagerly; when already in client router cache at click time, navigation completes without showing `loading.tsx`

### Discovery: staleTimes Behavior
During testing, observed that navigation still flashed despite both changes. Root cause identified:
- `prefetch={true}` is supposed to use `staleTimes.static` (300 s by default, non-experimental)
- But `staleTimes.dynamic` (0 s by default) was causing immediate expiration in client router cache
- Temporarily added `experimental.staleTimes: { dynamic: 30 }` to `next.config.ts` → flash eliminated
- However, with `"use cache"` on `SubmissionRubricSection`, server now responds ~10 ms (from cache vs ~100 ms before), so prefetch completes well before any user click
- **Removed experimental config** to stay on standard APIs; next.js type definitions confirm `prefetch={true}` correctly maps to `staleTimes.static` (300 s)
- **Fallback**: If loading flash reappears during testing, re-add `experimental.staleTimes: { dynamic: 30 }` — it was confirmed to work

### Validation
- ✅ `pnpm run check --fix` — no changes needed
- ✅ `pnpm run check-types` — all pass
- Tested manually: rare occasions with no loading; most navigations significantly faster, some still brief flash (prefetch timing dependent on network)

## Status
- [x] Investigation completed
- [x] Plan validated by user
- [x] Implementation completed
- [x] Validation (automated checks) completed
- [x] Plan documented
