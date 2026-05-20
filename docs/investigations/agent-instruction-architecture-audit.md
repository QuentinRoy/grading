# Investigation: agent instruction architecture audit

Status: Current investigation
Date: 2026-05-20
Related: PR #71, PR #82, AGENTS.md, .github/copilot-instructions.md, README workflow conventions

## Question

How should repository instructions be organized so that coding agents reliably follow repository conventions without introducing duplicated or conflicting guidance?

## Executive summary

The repository currently contains three partially overlapping instruction sources:

- `AGENTS.md`
- `.github/copilot-instructions.md`
- `README.md`

The overall direction is good, but responsibility boundaries are becoming blurred.

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

Avoid duplicating workflow rules, issue taxonomy, planning conventions, and local skill-loading rules across multiple files.

## Context

The repository is developed by a solo maintainer with heavy use of coding agents.

PR #71 established a documentation architecture emphasizing:

- small operational agent files;
- documentation separated by purpose;
- navigational rather than encyclopedic context.

PR #82 introduced structured issue templates and workflow guidance updates.

These changes make instruction ownership more important because agents increasingly create:

- issues;
- plans;
- pull requests;
- documentation;
- implementation changes.

## Findings

### Finding 1: planning rules are duplicated

Current examples:

- planning gates exist in `.github/copilot-instructions.md`;
- workflow guidance exists in `README.md`;
- repository rules exist in `AGENTS.md`.

Risk:

- workflow changes require updates in multiple locations;
- instructions can silently diverge.

Recommendation:

Move repository workflow policy into `AGENTS.md`.

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

Eventually move workflow content into:

```txt
docs/guides/contributing.md
```

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

### Finding 5: source precedence is implicit

Risk:

Agents may over-trust stale investigations or local implementation details.

Recommendation:

Introduce explicit source precedence:

```txt
1. User request
2. AGENTS.md
3. README workflow conventions
4. ADRs
5. Design docs
6. Investigations
7. Existing implementation
```

### Finding 6: issue workflow behavior should be explicit

Issue taxonomy itself should not be duplicated outside the templates and README conventions.

Recommendation:

Add operational guidance only:

```md
When creating issues:
- prefer issue templates
- use blank issues only as an escape hatch
- avoid creating labels unless reusable
```

## Recommended future changes

High priority:

- simplify `.github/copilot-instructions.md`;
- centralize workflow policy ownership;
- move local skill-loading guidance to `AGENTS.md`;
- define source precedence.

Medium priority:

- move contribution workflow into `docs/guides/contributing.md`;
- add `docs/index.md`.

Low priority:

- reduce README operational content further.

## Open questions

- Should completed plans be archived or deleted?
- Should issue creation rules live in `AGENTS.md` or contributor docs?
- Should source precedence become a mandatory convention?
- Should local skill discovery remain optional and domain-driven, or should some skills always be loaded?
