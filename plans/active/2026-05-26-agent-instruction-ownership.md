# Agent instruction ownership cleanup

**Date:** 2026-05-26
**Status:** Completed
**Related:** docs/investigations/agent-instruction-architecture-audit.md, AGENTS.md, .github/copilot-instructions.md, docs/contributing/issue-and-pr-conventions.md, docs/index.md

## Goal

Apply the high-priority recommendations from the agent instruction architecture audit:

- centralize repository workflow ownership in `AGENTS.md`
- reduce `.github/copilot-instructions.md` to Copilot-specific glue
- move local skill-loading guidance into `AGENTS.md`
- add explicit source precedence to `AGENTS.md`
- resolve the plan-path conflict before changing plan-related instructions
- remove duplicated validation, migration, label, and error-handling policy from `.github/copilot-instructions.md`

## Scope

Included:

- `AGENTS.md`
- `.github/copilot-instructions.md`
- `docs/contributing/issue-and-pr-conventions.md`
- `docs/index.md` if needed to resolve the plan-path conflict or keep references aligned

Not included:

- broad README reorganization
- unrelated workflow taxonomy changes
- new ADRs or design docs unless the instruction ownership cleanup requires one
- implementation code changes outside the instruction and workflow docs

## Proposed change set

1. Update `AGENTS.md`.
   - Add explicit source precedence accepted by the audit.
   - Add conditional local skill-loading guidance.
   - Keep only always-relevant operational guidance.

2. Simplify `.github/copilot-instructions.md`.
   - Remove repository-wide workflow, validation, migration, and label policy duplicates.
   - Keep only Copilot/tool-specific glue and a short pointer back to `AGENTS.md`.

3. Resolve the plan-location conflict.
   - Pick one canonical plan path convention.
   - Update any affected doc references so plan guidance is consistent.
   - Prefer the smallest change that makes the convention unambiguous.

4. Align contributor conventions if they still conflict with the canonical plan path.
   - Update `docs/contributing/issue-and-pr-conventions.md` only as needed.

## Risks

- Instruction drift if one doc is updated without the others.
- Accidentally narrowing guidance too much and making agent behavior less reliable.
- Plan-path edits may require careful wording because the repository currently has conflicting references.

## Validation

- Run focused checks on any edited markdown files by reading them back for consistency.
- Run `pnpm run check --fix` and `pnpm run check-types` after edits if the repo content or tooling expects it.
- If instruction behavior changes affect tests or docs rendering, run the smallest relevant verification available.

## Status

- [x] Audit scope identified
- [x] Draft plan created
- [x] User validated plan
- [x] Implement instruction ownership edits
- [x] Validate edited docs
- [x] Summarize results

## Validation

- `pnpm run check --fix`
- `pnpm run check-types`

## Notes

- The plan remains stored under `plans/active/` for now because only the plan content was updated in this turn.
