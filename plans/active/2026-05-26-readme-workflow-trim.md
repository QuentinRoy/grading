# README workflow trim

**Date:** 2026-05-26
**Status:** Completed
**Related:** docs/investigations/agent-instruction-architecture-audit.md, README.md, AGENTS.md, docs/contributing/issue-and-pr-conventions.md, docs/index.md

## Goal

Apply the medium-priority recommendations from the agent instruction architecture audit:

- shorten the README issue / PR / label sections
- keep README focused on project overview, setup, and entry-point navigation
- link the workflow details to `docs/contributing/issue-and-pr-conventions.md`
- strengthen the doc links from `AGENTS.md` where they help agents find the canonical references quickly
- keep durable architecture guidance in the right doc types instead of spreading it across instruction files

## Scope

Included:

- `README.md`
- `AGENTS.md` if link strengthening needs a small wording adjustment
- `docs/contributing/issue-and-pr-conventions.md` only if a wording tweak is needed to support README linking

Not included:

- broad reorganization of docs beyond the README and a small link cleanup
- new ADRs or design docs
- changes to plan-location policy
- implementation code changes

## Proposed change set

1. Trim README workflow content.
   - Keep the README’s overview, setup, commands, and import-format basics.
   - Replace detailed issue / PR / label guidance with a short pointer to `docs/contributing/issue-and-pr-conventions.md`.

2. Strengthen agent doc entry points.
   - Make sure `AGENTS.md` points directly to the relevant canonical docs for workflow conventions, reference docs, and the docs index.
   - Avoid expanding the agent file with duplicated durable guidance.

3. Verify consistency.
   - Confirm README, AGENTS, and the contributor conventions all point to the same canonical workflow source.
   - Check that no stale workflow guidance remains duplicated in the README.

## Risks

- README may become too terse if too much content is removed.
- Link changes could leave a doc path ambiguous if wording is not kept explicit.
- Durable guidance should remain available in the canonical docs; avoid removing it without a replacement pointer.

## Validation

- Read back the edited docs for consistency and link targets.
- Run `pnpm run check --fix` and `pnpm run check-types` after edits if any markdown or config updates are made.
- If the README wording changes materially, verify that the resulting document still reads as a clear entry point for contributors.

## Status

- [x] Audit scope identified
- [x] Draft plan created
- [x] User validated plan
- [x] Implement README trim and link cleanup
- [x] Validate edited docs
- [x] Summarize results

## Validation

- `pnpm run check --fix`
- `pnpm run check-types`

## Notes

- README now points to `docs/contributing/issue-and-pr-conventions.md` for detailed workflow guidance and to `AGENTS.md` / `docs/index.md` for agent and doc-navigation context.
