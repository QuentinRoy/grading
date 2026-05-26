# Investigation: agent instruction architecture audit

Status: Current investigation
Date: 2026-05-26
Related: PR #71, PR #82, issue #97, PR #119, AGENTS.md, .github/copilot-instructions.md, README workflow conventions

## Question

How should repository instructions be organized so that coding agents reliably follow repository conventions without introducing duplicated or conflicting guidance?

## Executive summary

The repository currently contains overlapping instruction and guidance sources:

- `AGENTS.md`
- `.github/copilot-instructions.md`
- `README.md`
- `docs/guides/issue-and-pr-conventions.md`
- `docs/index.md`
- domain-specific documentation under `docs/*`
- skill metadata in `skills-lock.json`

The overall direction is good, but responsibility boundaries are blurred.

Main recommendation:

```txt
AGENTS.md
  -> short operational rules and navigation

README.md
  -> onboarding and contributor workflow overview

.github/copilot-instructions.md
  -> tool glue only

docs/*
  -> durable knowledge
```

Avoid duplicating workflow rules, issue taxonomy, planning conventions, validation policy, architecture rules, and local skill-loading rules across multiple files.

## Context

The repository is developed by a solo maintainer with heavy use of coding agents.

PR #71 established a documentation architecture emphasizing:

- small operational agent files;
- documentation separated by purpose;
- navigational rather than encyclopedic context.

PR #82 introduced structured issue templates and workflow guidance updates.

Issue #97 accepted the following ownership direction:

- `AGENTS.md` is the canonical source for operational agent rules.
- `.github/copilot-instructions.md` is limited to tool-specific glue.
- `AGENTS.md` contains only always-relevant operational guidance.
- Durable architecture and repository knowledge belongs in `docs/*`.
- Agent instruction files should not duplicate architecture knowledge beyond short operational guidance and links.
- Local skill-loading guidance belongs in `AGENTS.md`, not `.github/copilot-instructions.md`.
- README or contributor documentation owns human-facing workflow overviews.
- Issue and PR templates own detailed structure and checklist prompts.
- `docs/*` owns durable rationale and conventions.

These changes make instruction ownership more important because agents increasingly create:

- issues;
- plans;
- pull requests;
- documentation;
- implementation changes.

## Current audit for PR #119

### PR #119 status update

PR #119 has implemented several recommendations from this audit. The sections below preserve the audit findings that motivated the cleanup, but some findings now describe the pre-cleanup state rather than remaining issues.

Implemented in PR #119:

- `.github/copilot-instructions.md` was reduced to Copilot-specific glue that points to `AGENTS.md`.
- Local skill-loading guidance was moved into `AGENTS.md`.
- Explicit instruction precedence was added to `AGENTS.md`.
- README workflow guidance was shortened and now links to `docs/guides/issue-and-pr-conventions.md`.
- Plan-path guidance was aligned around `plans/active/` and `plans/completed/`.
- The issue and PR conventions guide was updated to use `plans/active/` for active plan documents.

Remaining follow-up items:

- Decide which architecture reminders should remain in `AGENTS.md` and which should move to focused docs.
- Remove unrelated README command duplication if desired.
- Keep this investigation as historical context unless remaining recommendations are promoted into focused follow-up issues, ADRs, reference docs, or direct implementation changes.

This section records the audit findings that PR #119 used to align the instruction files and adjacent guidance. Some findings describe the state before the PR cleanup and are kept as rationale.

### Audited sources

| Source | Current role | Audit result |
| --- | --- | --- |
| `AGENTS.md` | Repository-level operational agent guidance | Correct place for always-relevant agent rules. After PR #119, remaining review is mainly whether some architecture and implementation reminders should be linked out or reduced. |
| `.github/copilot-instructions.md` | Copilot/custom-agent instruction file | Previously too broad. PR #119 reduced it to Copilot-specific glue that points to `AGENTS.md`. |
| `README.md` | Human onboarding and project overview | Previously duplicated detailed issue, PR, and label workflow guidance. PR #119 shortened this section and now links to `docs/guides/issue-and-pr-conventions.md`. |
| `docs/guides/issue-and-pr-conventions.md` | Focused collaboration guide | Best canonical home for detailed issue, PR, template, and label conventions. |
| `docs/index.md` | Documentation navigation and document-type ownership | Useful canonical navigation file. It should be linked from `AGENTS.md` instead of duplicated. |
| `skills-lock.json` | Skill dependency metadata | Not an instruction file. It should not carry policy, but its presence reinforces that skill-loading policy belongs in `AGENTS.md`, not Copilot-specific instructions. |

### Duplicated workflow guidance

#### Issue, PR, template, and label workflow

Duplicated across:

- `AGENTS.md`, which points agents to `docs/guides/issue-and-pr-conventions.md` and gives operational rules for issue and PR work.
- `README.md`, which includes detailed issue template, PR body, validation checklist, risk review, and label taxonomy guidance.
- `docs/guides/issue-and-pr-conventions.md`, which already defines template use, draft PR behavior, labels, and typical combinations.
- `.github/copilot-instructions.md`, which repeats label handling constraints and output expectations for PR/task summaries.

Assessment:

- `docs/guides/issue-and-pr-conventions.md` should own detailed workflow conventions.
- `AGENTS.md` should only tell agents when to consult that document and how to avoid unsafe metadata changes.
- `README.md` should summarize and link, not duplicate the full taxonomy or PR checklist.
- `.github/copilot-instructions.md` should not define repository-wide issue/PR policy.

#### Planning workflow

Duplicated or conflicting across:

- `.github/copilot-instructions.md`, which requires a plan markdown file before code edits and specifies `docs/plans/[date]-[name].md`.
- `README.md`, which says code-change tasks should create and validate a plan markdown file before editing unless explicitly bypassed.
- `docs/index.md`, which says active plans live in `plans/active/` and completed plans move to `plans/completed/`.
- `docs/guides/issue-and-pr-conventions.md`, which says plan documents should live under `plans/*.md`.

Assessment:

- This is both duplication and a direct path conflict.
- The canonical plan location should be decided once, then referenced from agent and contributor guidance.
- Based on the current documentation architecture, `plans/active/` and `plans/completed/` appear to be the intended durable convention, while `docs/plans/[date]-[name].md` appears stale.

#### Validation workflow

Duplicated across:

- `AGENTS.md`, which requires `pnpm run check --fix` and `pnpm run check-types` after changes.
- `.github/copilot-instructions.md`, which repeats those commands and adds focused tests where available.
- `README.md`, which lists quality commands and repeats validation checklist items in the PR template guidance.

Assessment:

- Keep mandatory agent validation expectations in `AGENTS.md`.
- Keep human-facing command reference in `README.md`.
- Keep PR checklist prompts in the PR template or contributor convention document.
- Reduce `.github/copilot-instructions.md` to referring to `AGENTS.md` unless Copilot needs a tool-specific validation behavior.

### Duplicated policy guidance

#### Error handling policy

Duplicated across:

- `AGENTS.md`, under error handling UX.
- `.github/copilot-instructions.md`, under constraints and approach.
- `README.md`, in the PR risk review checklist.

Assessment:

- Keep the operational rule in `AGENTS.md`.
- Keep checklist prompts in PR templates or contributor docs.
- Remove from Copilot-specific instructions unless needed as a short reminder linked to `AGENTS.md`.

#### Migration safety policy

Duplicated across:

- `AGENTS.md`, under database migrations.
- `.github/copilot-instructions.md`, under constraints and approach.
- `README.md`, in the PR risk review checklist and database notes.
- `docs/reference/database-migrations.md`, which is already linked from `AGENTS.md`.

Assessment:

- `docs/reference/database-migrations.md` should own detailed migration conventions.
- `AGENTS.md` should keep only the always-relevant safety rule and link to the reference doc.
- `.github/copilot-instructions.md` should not duplicate migration policy.

#### Skill-loading policy

Currently located in:

- `.github/copilot-instructions.md`, which tells the agent to discover and integrate relevant local skills from `.agents/skills/*`.
- Issue #97 accepted that this policy belongs in `AGENTS.md`.
- `skills-lock.json` lists available skill dependencies but does not define loading policy.

Assessment:

- Move skill-loading policy into `AGENTS.md`.
- Keep wording conditional and domain-driven: load relevant skills only when the task touches the skill domain.
- `.github/copilot-instructions.md` should only point to `AGENTS.md` and avoid restating skill-loading policy.

### Duplicated architecture guidance

Architecture and implementation facts appear in instruction files:

- `AGENTS.md` includes React `useId()` guidance, app/src composition guidance, Context7 usage, performance guidance, dotenvx/package-script guidance, and migration guidance.
- `.github/copilot-instructions.md` includes import/export paths, rubric/data-shape contracts, route handlers, export builders, import saves, rubric assessment mapping, migrations, and audit-doc synchronization.
- `README.md` includes tech stack, app workflow, import formats, database notes, and Storybook/testing notes.
- `docs/reference/*`, `docs/design/*`, and `docs/adr/*` are intended to hold durable system knowledge.

Assessment:

- Some short operational reminders in `AGENTS.md` are useful when always relevant, especially styling, validation, and safety rules.
- Durable architecture knowledge should move to or be linked from `docs/reference/*`, `docs/design/*`, or ADRs.
- `.github/copilot-instructions.md` should not specialize itself as a broad grading refactor manual if it is meant to be Copilot glue only.

### Conflicts and stale guidance

- Plan file location guidance was previously inconsistent across `.github/copilot-instructions.md`, `docs/index.md`, and the issue and PR conventions guide. PR #119 aligns the active-plan convention around `plans/active/` and completed plans around `plans/completed/`.
- Source precedence was accepted in issue #97 and added to `AGENTS.md` in PR #119.
- The issue and PR conventions now live under `docs/guides/`, and `docs/index.md` lists them with the other procedural guides.
- Remaining architecture guidance in `AGENTS.md` should be reviewed to decide what is always-relevant operational guidance and what should move to `docs/reference/`, `docs/design/`, or an ADR.

## Findings

### Finding 1: planning rules are duplicated

Current examples:

- planning gates exist in `.github/copilot-instructions.md`;
- workflow guidance exists in `README.md`;
- repository rules exist in `AGENTS.md`;
- plan locations are also described in `docs/index.md` and the issue and PR conventions guide.

Risk:

- workflow changes require updates in multiple locations;
- instructions can silently diverge;
- agents may create plan files in stale locations.

Recommendation:

Move repository workflow policy into `AGENTS.md` and focused contributor docs.

Keep `.github/copilot-instructions.md` minimal.

Example:

```md
- Follow AGENTS.md as mandatory repository context.
- Apply only Copilot-specific behavior here.
```

### Finding 2: local skill loading belongs in AGENTS.md

The current Copilot instructions mention loading relevant local skills from `.agents/skills/*`.

This instruction is not Copilot-specific. Other agents should benefit from the same behavior.

Recommendation:

Move the local skill-loading rule to `AGENTS.md`.

Use conditional wording rather than requiring all skills to be loaded.

Example:

```md
Load relevant local skills from `.agents/skills/*` when the task touches that domain. Do not load every skill by default.
```

Then `.github/copilot-instructions.md` can simply point to `AGENTS.md` and avoid duplicating repository workflow behavior.

### Finding 3: README scope is expanding

README currently includes:

- onboarding;
- development commands;
- issue workflow;
- PR workflow;
- labels;
- import formats.

Risk:

README becomes an operational manual rather than an entry point.

Recommendation:

Eventually move workflow content into contributor documentation and link to it from README.

README should mainly:

- explain the project;
- explain setup;
- link to deeper docs.

### Finding 4: procedural instructions can become brittle

Current instructions sometimes encode exact sequences.

Example:

```txt
1. Read issue
2. Read AGENTS
3. Create plan
...
```

Risk:

Agents may over-apply workflows to:

- typo fixes;
- documentation-only changes;
- metadata updates.

Recommendation:

Prefer conditional rules.

Example:

```md
For non-trivial code changes:
- create or update a plan

For documentation-only changes:
- plans usually unnecessary
```

### Finding 5: source precedence is implicit in files, despite being accepted in issue #97

Risk:

Agents may over-trust stale investigations, README workflow snippets, or local implementation details over accepted issue decisions.

Recommendation:

Introduce the explicit source precedence accepted in issue #97 into `AGENTS.md`:

```txt
1. User request / issue instructions
2. AGENTS.md
3. Relevant local skills from .agents/skills/*
4. Accepted ADRs
5. Current design and reference docs
6. README / contributor docs
7. Current investigations
8. Active plans
9. Existing implementation
```

Investigations and active plans may guide work, but they are not final decisions unless promoted into an ADR, design doc, issue decision, or implemented behavior.

### Finding 6: issue workflow behavior should be explicit, but not duplicated

Issue taxonomy itself should not be duplicated outside the templates and contributor conventions.

Recommendation:

Add operational guidance only:

```md
When creating issues:
- prefer issue templates
- use blank issues only as an escape hatch
- avoid creating labels unless reusable
```

Detailed taxonomy and examples should remain in the issue and PR conventions guide or templates.

## PR #119 implementation status

Implemented in PR #119:

- simplify `.github/copilot-instructions.md` to Copilot-specific glue;
- centralize workflow policy ownership in `AGENTS.md` and contributor docs;
- move local skill-loading guidance to `AGENTS.md`;
- add accepted source precedence to `AGENTS.md`;
- align plan-path guidance around `plans/active/` and `plans/completed/`;
- remove repeated validation, migration, label, and error-handling policy from `.github/copilot-instructions.md`;
- shorten README issue/PR/label sections and link to `docs/guides/issue-and-pr-conventions.md`.

Remaining follow-up:

- decide which architecture reminders are always relevant enough to remain in `AGENTS.md`;
- reduce README operational content further only where it duplicates a more focused canonical document.

## Open questions

- Which short architecture reminders are always relevant enough to remain in `AGENTS.md`?
- Should remaining recommendations from this investigation become follow-up issues, or is the current lightweight cleanup sufficient?
