# Plan: Resolve PR merge conflicts for issue template docs

## Goal
Resolve merge conflicts in PR branch `fix/github-issue-template-forms` against `origin/main` with the smallest possible change set.

## Scope
- Conflict resolution only for files touched by this PR and `origin/main`.
- Preserve intended PR behavior:
  - valid GitHub issue forms
  - dedicated templates for bug / feature / task-investigation
  - blank issues enabled

## Checklist
- [x] Fetch full history and `origin/main`
- [ ] Identify exact conflicting files/hunks against `origin/main`
- [ ] Resolve conflicts while preserving intended template semantics
- [ ] Run repository checks relevant to touched files
- [ ] Confirm clean merge state and minimal diff
- [ ] Reply to PR comment with commit hash

## Risks
- Concurrent edits in `origin/main` to issue templates may alter labels/descriptions.
- YAML merge conflict markers can accidentally break template schema if not validated.

## Validation plan
- `corepack pnpm run check --fix`
- `corepack pnpm run check-types`
- If needed, quick schema sanity check by inspecting final `.github/ISSUE_TEMPLATE/*.yml` structure.

## Notes
- Per repository instructions, wait for plan validation before applying code edits.
