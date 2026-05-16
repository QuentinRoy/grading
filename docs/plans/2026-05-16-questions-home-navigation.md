# Questions Home Navigation

## Goal
Add a clear way to navigate from Questions management back to the home screen.

## Scope
- Update the Questions management UI header to include a visible "Back to home" action.
- Keep existing layout, behavior, and data flow intact.
- No routing logic changes beyond linking to the existing home route.

## Plan
1. Add a secondary header action in QuestionsManagementClient that links to /. 
2. Place the action near the page title/description so it is always visible.
3. Keep spacing/style aligned with existing Material UI patterns in the file.
4. Run formatting and type checks for the change.

## Verification
1. pnpm run check --fix
2. pnpm run check-types
3. Manual check: from /questions, click "Back to home" and confirm it opens /

## Risks
- Minimal: slight visual layout shift in the header area.

## Rollback
- Revert the Questions management client header change.

## Progress
- [x] Plan drafted
- [x] Plan validated with user
- [x] Header action added
- [x] Formatting/type checks passed
- [ ] Manual navigation verified
