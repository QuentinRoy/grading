# Assessments Page Revalidation After Import

## Goal
Ensure the Assessments page shows freshly imported questions/students/submissions on the first navigation, without requiring a manual browser refresh.

## Scope
- Investigate current caching/revalidation behavior for:
  - Questions import
  - Students import
  - Assessments page data load
- Apply a minimal cache-tagging/revalidation fix so import actions invalidate the Assessments page output cache.
- Keep existing import behavior and UI unchanged.

## Root Cause (identified)
The Assessments page content function in app/assessments/page.tsx uses "use cache" but does not register a cache tag. Import actions revalidate tags (including "assessments"), yet the page-level cached output is not attached to that tag, so first navigation can render stale page content until a manual refresh.

## Implementation Steps
1. Update app/assessments/page.tsx:
   - import cacheTag from next/cache
   - register cacheTag("assessments") inside the cached page content function
2. Keep existing tag invalidations in import actions unchanged (they already call revalidateTag("assessments", "max") where relevant).
3. Run formatting/types checks required by repo standards.

## Validation
- Reproduce flow: import questions + students, navigate to Assessments page, verify data is up to date on first load.
- Run:
  - pnpm run check --fix
  - pnpm run check-types

## Risks
- Low risk: targeted cache metadata change only.

## Rollback
- Revert app/assessments/page.tsx change.

## Progress
- [x] Root cause identified.
- [x] Plan validated by user.
- [x] Implementation completed.
- [x] Checks completed.
