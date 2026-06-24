# Agent instruction layer hardening

- **Status:** Active
- **Created:** 2026-06-23
- **Origin:** Gap analysis of this repo against current web best practices for agent-facing documentation; implements the "Still open" item in `docs/investigations/2026-05-19-repo-documentation-architecture.md` (AGENTS.md size tension) and a verification-enforcement gap.
- **Tracked by:** none yet

## Guidance consulted

- `AGENTS.md` (the file being trimmed), `CONTEXT.md` (glossary checked — no domain-language change here), `docs/index.md`.
- `docs/investigations/2026-05-19-repo-documentation-architecture.md` — rationale companion; its "Still open" section flags trimming styling/code-style out of `AGENTS.md`.
- `docs/investigations/2026-05-26-agent-instruction-architecture-audit.md` — accepted ownership: `AGENTS.md` is canonical for operational rules; tool-specific files are thin pointers; local skill-loading guidance lives in `AGENTS.md`.
- `.agents/skills/simplify/SKILL.md` (post-edit pass), `docs/guides/issue-and-pr-conventions.md`, `docs/guides/commit-message-conventions.md`.
- ADRs: none directly govern this; if "always-loaded `AGENTS.md` carries only operate/route/precedence/safety" is treated as a durable decision, a short ADR may be warranted (see Validation).

## Rationale (from the gap analysis)

The repo's documentation architecture already matches or exceeds best practice (two-layer model, thin tool pointers, ADRs, 14 skills, a `CONTEXT.md` glossary). The remaining gaps are in the always-loaded layer and in enforcement:

1. **Layer-1 carries conditionally-relevant policy.** `AGENTS.md` is 181 lines; roughly half (the **Styling** section, plus parts of **Architecture** / **Performance** / **Database migrations**) is only relevant when touching UI/DB, yet loads on every turn. Field guidance ("move sometimes-relevant knowledge into skills"; empirical evidence that non-essential always-loaded content lowers task success and raises cost) says demote it.
2. **Verification is advisory, not enforced.** `AGENTS.md` tells the agent to run `check` / `check-types` / targeted tests, but nothing guarantees it. Hooks are the recommended mechanism for "must happen every time."
3. **Minor drift surface.** ~22 concrete paths appear in the always-loaded file; the `src/...` code paths (e.g. `src/db/cacheTags.ts`, `src/utils/logger.ts`) are the drift-prone ones.

## Decisions to confirm before implementing

1. **Destination for the extracted styling content — recommend a skill.** A `ui-styling` skill under `.agents/skills/` fits the repo's "load skills only when the task touches that domain" model and keeps it agent-facing + on-demand. Alternative: `docs/guides/ui-styling.md` (human-facing; only loaded when routed). Recommendation: skill.
2. **Hook strategy — recommend PostToolUse + optional Stop.** A `PostToolUse` hook on `Edit`/`Write` running `biome check --write` on the changed file (fast, immediate), plus an optional `Stop` hook running `pnpm run check-types` (slower, whole-project gate). Must compose with the existing global RTK hooks in user settings — do not override them. Hooks are Claude-Code-only, so the advisory `AGENTS.md` line stays as the cross-tool fallback for Codex/Copilot.

## Scope

In scope:

- Extract UI **Styling** conventions (and any clearly UI/DB-only blocks) out of `AGENTS.md` into a skill (or guide) and route to it.
- Add a deterministic verification hook in project `.claude/settings.json`.

Out of scope:

- Restructuring `AGENTS.md`'s operating protocol, instruction precedence, or routing table (these match the 2026-05-26 audit's accepted ownership).
- `CONTEXT.md` changes (no domain-language change).
- Generating reference docs (routes / env vars / schema) — a separate "Still open" investigation item, deferred.
- Nested `AGENTS.md` (single-app repo; not a monorepo — N/A).
- Introducing `SPEC.md` / spec-kit (`plans/` already serves plan-before-code).

## Steps

### Workstream A — minimize the always-loaded layer

1. [ ] Audit `AGENTS.md` sections for "conditionally relevant" vs "near-universal." Clear extract: **Styling**. Review **Architecture** / **Performance** / **Database migrations** for UI/DB-only content. Keep universal one-liners in `AGENTS.md` (no `as`, JS `#private` not TS `private`, flat structure, narrow scope, Project ID vs Row ID).
2. [ ] Create the destination per decision 1 (recommend `.agents/skills/ui-styling/SKILL.md`); move the styling content verbatim (bottom-spacing-only / `mb` not `mt` / `gap`, theme tokens over pixels).
3. [ ] Replace the extracted section in `AGENTS.md` with a single entry in the **Guidance routing** table pointing to the new home.
4. [ ] Re-check `AGENTS.md` for internal consistency (routing table, precedence list, no dead cross-references); confirm `CLAUDE.md` and `.github/copilot-instructions.md` still resolve (they point at `AGENTS.md`, so no change expected).
5. [ ] (Optional, minor) Replace drift-prone raw `src/...` references in the routing table with the owning ADR/doc where one exists.

### Workstream B — deterministic verification gate

6. [ ] Implement the hook per decision 2 in project `.claude/settings.json` (committed), composing with existing global hooks.
7. [ ] Keep the advisory `check` / `check-types` / tests line in `AGENTS.md` as the cross-tool fallback.
8. [ ] Verify the hook fires: edit a file → confirm `biome` runs; trigger `Stop` → confirm `check-types` runs/gates. Capture evidence.

## Validation

- [ ] `AGENTS.md` line count meaningfully reduced; remaining content is near-universal.
- [ ] New skill/guide discoverable from the `AGENTS.md` routing table (and `docs/index.md` if a guide).
- [ ] `pnpm run check --fix` clean; `pnpm run check-types` clean.
- [ ] Hook demonstrably runs (evidence captured in the PR).
- [ ] Docs decision recorded: no `CONTEXT.md` change; decide whether the "always-loaded layer holds only operate/route/precedence/safety" rule deserves a short ADR or is adequately captured by this plan + the investigation.

## Non-goals

- No change to `AGENTS.md` precedence/protocol/routing structure.
- No `CONTEXT.md` edit.
- No generated reference docs.
- No nested `AGENTS.md`, no `SPEC.md`/spec-kit.
- Not weakening any rule — content is relocated, not deleted.
