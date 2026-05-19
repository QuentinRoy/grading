## Summary

<!-- Briefly describe what this PR changes and why. -->

## Related issue

<!-- Use `Fixes #...` or `Closes #...` when this PR completes the issue. Use `Related to #...` for partial work or supporting documentation. -->

Related to #

## Plan

<!-- For code-change tasks, link the plan file required by AGENTS.md unless the user explicitly opted out. Documentation-only changes may use "not applicable". -->

- Plan file:
- User validated plan: yes / explicit bypass / not applicable

## Changes

<!-- List the main changes. Keep this focused on reviewer-relevant information. -->

## Validation

<!-- Adapt this checklist to the PR. Documentation-only PRs do not need code validation commands unless they touch executable examples, workflow files, or other checked artifacts. -->

- [ ] `pnpm run check --fix`
- [ ] `pnpm run check-types`
- [ ] Focused tests:
- [ ] Integration tests if DB/import/export/routing behavior changed:

## Risk review

<!-- Check or remove items that do not apply. Add notes for any non-trivial risk. -->

- [ ] No existing migration was modified
- [ ] Project isolation considered
- [ ] Data-loss/destructive behavior considered
- [ ] User-visible errors remain actionable
- [ ] Docs/import/export contracts updated if affected

## Labels

<!-- Apply existing labels to issues and PRs when useful. Do not introduce new labels lightly; prefer existing labels when they describe the work well enough. -->

## Notes

<!-- Add residual risks, follow-ups, or reviewer guidance. -->
