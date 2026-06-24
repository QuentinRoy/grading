# Investigation: repository documentation architecture

Status: Completed — structure adopted; agent-instruction parts superseded
Date: 2026-05-19
Resolution: The docs-as-code structure recommended here was adopted in PR #103 (initial documentation architecture migration). The agent-instruction specifics — `AGENTS.md` shape, plan-path policy, and instruction precedence — were later revised by the [agent instruction architecture audit](2026-05-26-agent-instruction-architecture-audit.md) and PR #119. The `plans/active/`/`plans/completed/` split described below was itself superseded by a flat `plans/` directory with `Status`-based lifecycle and [plans/index.md](../../plans/index.md) (see issue #218); `docs/index.md` is canonical for the current convention.
Follow-up: None. Retained as the rationale companion to [docs/index.md](../index.md).
Related: PR #71 (origin), PR #103 (migration), [agent instruction architecture audit](2026-05-26-agent-instruction-architecture-audit.md), [AGENTS.md](../../AGENTS.md), [CONTEXT.md](../../CONTEXT.md), [docs/index.md](../index.md)

> **Read first — this is a historical investigation, not live instructions.**
> The structure proposed here is already in place and has evolved since. Where this document and the current repository disagree, the repository wins. Follow [docs/index.md](../index.md) for the documentation map and lifecycle rules, [AGENTS.md](../../AGENTS.md) for agent operating rules and instruction precedence, and [CONTEXT.md](../../CONTEXT.md) for domain language. This document is kept for the *reasoning* behind those conventions and for the per-document-type templates, which the canonical files only summarise. Paths in the examples below have been corrected to match real files so they cannot mislead an agent.

## Question

How should this repository organize technical documentation, architecture notes, investigations, and implementation plans so that they remain useful for a solo developer working heavily with coding agents?

The goal is not a documentation bureaucracy. The goal is to make the repository easier to maintain, easier for agents to navigate, and safer to change.

## Executive summary

Use docs-as-code, but separate documents by purpose, and make each document's type, lifecycle, and status explicit.

Adopted structure:

```txt
README.md          # human onboarding
AGENTS.md          # short operating rules + routing + precedence for agents
CLAUDE.md          # thin, tool-specific; @-imports AGENTS.md
CONTEXT.md         # canonical domain glossary

docs/
  index.md         # the documentation map and lifecycle rules
  adr/             # accepted/proposed architecture decisions
  investigations/  # audits, comparisons, open-ended exploration
  design/          # chosen implementation designs
  reference/       # durable facts about the current system
  guides/          # human-oriented how-to docs

plans/
  index.md         # active plans only — see "Plans" below
  YYYY-MM-DD-*.md  # one flat directory; lifecycle tracked via Status, not a move
```

Rule of thumb:

- `README.md` — project onboarding.
- `AGENTS.md` — short operational instructions, a routing table, and instruction precedence for coding agents.
- `CONTEXT.md` — the canonical domain glossary; read before touching domain terms, identifiers, or contracts.
- `docs/index.md` — the map: where each document type lives and how its lifecycle is tracked.
- `docs/adr/` — accepted or proposed architectural decisions.
- `docs/investigations/` — audits, comparisons, and open-ended technical exploration.
- `docs/design/` — a chosen design, before or during implementation.
- `docs/reference/` — durable facts about the current system.
- `docs/guides/` — human-oriented how-to documentation.
- `plans/` — temporary execution plans, flat, with `Status` tracking lifecycle; `plans/index.md` lists active ones.

The most important principle: **each document should have a clear type, lifecycle, and status.** Stale docs are worse than missing docs, because an agent will trust them.

## Why this matters for this repository

This project is developed by a solo maintainer with heavy use of coding agents. That changes the documentation problem.

The docs need to help:

- the maintainer recover context after interruptions;
- agents understand project conventions without reading the whole repository;
- future PRs link design intent to implementation;
- architectural decisions survive refactors;
- temporary plans stay separate from durable documentation;
- stale exploratory notes not get mistaken for accepted decisions.

Agents are sensitive to context quality. Too little context causes incorrect changes. Too much context causes irrelevant constraints, token waste, and stale assumptions. Empirical work on repository-level context files points the same way: a minimal, essential `AGENTS.md` can lower agent runtime and token use, while padding it with non-essential requirements can *reduce* task success and raise cost (see [References](#references-and-further-reading)). Documentation should therefore be structured so agents can read only the relevant artifacts.

## Principles for agent-friendly documentation

These are the practices that make the structure above actually work for agents. They are the spine of every recommendation that follows.

1. **Progressive disclosure.** Keep one short always-loaded file (`AGENTS.md`), have it route to a map (`docs/index.md`), and let the map route to focused docs loaded on demand. An agent should be able to answer "where do I look for X?" in one hop and load only X. This is the single highest-value pattern for agents and the reason `AGENTS.md` and `docs/index.md` exist.
2. **Explicit type and lifecycle.** Every non-trivial document declares its type (by folder) and its status + date near the top. An agent treats a `Status: Accepted` ADR very differently from a `Status: Active` investigation — but only if the status is stated.
3. **A routing table beats a flat list.** Humans skim a list of links; agents do better with "for topic X, read doc Y." `AGENTS.md` carries an explicit guidance-routing table for exactly this reason.
4. **Instruction precedence.** When sources disagree, an agent cannot arbitrate without a stated order. The repository defines an explicit precedence (user request → `AGENTS.md` → `CONTEXT.md` → skills → ADRs → design/reference → guides → investigations → active plans → existing code). Investigations and active plans guide work; they do not override accepted decisions.
5. **Document *why*, not *what*; generate the *what*.** Hand-written docs should capture intent, constraints, and trade-offs. Mechanical facts (route lists, table lists, command lists) should be generated or linked to their source of truth, because duplicated facts drift and agents over-trust them.
6. **Tie durable decisions to a source of truth.** A decision is most trustworthy when an agent can check it against code, tests, or an ADR. Link the implementation/test that enforces a decision so the doc can be verified, not just believed.
7. **Defend against staleness.** Use status + date metadata, date-prefixed filenames for time-bound docs, explicit "superseded by" pointers, and a bias toward deleting or extracting stale execution artifacts rather than letting them linger.
8. **One canonical home per fact.** Avoid duplicating substantial guidance across files; prefer a single owner and point other files to it. Duplication across `AGENTS.md`, tool-specific files, and `README.md` was a real drift source here (see the [agent instruction architecture audit](2026-05-26-agent-instruction-architecture-audit.md)).

## Workflow

A document type is produced only when it earns its keep:

```txt
Issue
  -> investigation, if the question is open-ended
  -> ADR, if a significant decision is made
  -> design doc, if implementation details need to be stabilised
  -> plan, if code changes need to be coordinated
  -> PR
```

Not every issue needs every artifact. Use the smallest artifact that captures the missing context. This is a lightweight convention, not a rigid process.

## Document types

### README

Path: `README.md`

Purpose:

- help a new human understand what the project is;
- explain how to install, run, test, and use the app;
- link to deeper docs.

Good README content: project purpose; quick start; common commands; required environment variables; a link to [docs/index.md](../index.md); short, stable development notes.

Avoid putting deep architecture audits or active plans in the README. Keep it navigational and onboarding-oriented. (The earlier README had drifted toward an operational manual; PR #119 trimmed it back.)

### AGENTS.md

Path: `AGENTS.md`

Purpose:

- give coding agents short, almost-always-relevant operating rules;
- route them to the right canonical doc for everything else;
- state instruction precedence so conflicts resolve deterministically;
- encode repository-specific safety constraints.

`AGENTS.md` is the entry point for progressive disclosure (principle 1). It should *route*, not *contain*. Its core moving parts in this repository are:

- an operating protocol (read `AGENTS.md`, use `docs/index.md` to locate guidance, read only the focused docs needed);
- a guidance-routing table mapping topics to their canonical docs;
- an explicit instruction-precedence list;
- pointers to `CONTEXT.md` (domain language) and to local skills;
- a few durable safety reminders (e.g. do not rewrite committed migrations; do not silently discard grading data).

#### Why keep AGENTS.md short — and the tension to watch

Repository-level context files are now a cross-tool convention, with `AGENTS.md` emerging as the de facto standard. The evidence on size is directional: a minimal, essential file is associated with lower runtime and token use, while non-essential requirements can reduce task success and raise cost (see [References](#references-and-further-reading)). The practical rule:

> Use an agent context file, but keep it minimal, operational, and navigational. Do not turn it into an architecture manual.

**Honest tension (option for the maintainer).** The current `AGENTS.md` has grown past "minimal": alongside operating rules, routing, and precedence, it carries styling and code-style policy. That content is valuable, but it is the kind of always-loaded detail the studies caution about. An option worth considering is to move the long styling/code-style rules into a focused `docs/guides/` or `docs/reference/` doc and have `AGENTS.md` route to it — keeping the always-loaded surface to *operate + route + precedence + safety*. This is a judgement call, not a defect; flagged here so the trade-off stays visible.

### CONTEXT.md

Path: `CONTEXT.md`

Purpose:

- define the canonical domain language so humans and agents use the same terms;
- distinguish look-alike concepts that are dangerous to confuse (e.g. **Project ID** vs **Project Row ID**);
- record contract boundaries (e.g. row IDs must not leak past the DB boundary).

`CONTEXT.md` exists because naming mistakes are some of the most expensive an agent can make: they pass review, then leak an internal key into a public URL or an export contract. A short glossary that names the right term and explicitly lists the wrong ones (`_Avoid_:`) prevents a whole class of errors. Read it before changing domain terminology, identifiers, public/API contracts, database boundaries, or import/export formats. It sits high in instruction precedence for this reason.

### Documentation index

Path: `docs/index.md`

Purpose:

- provide a map of the documentation set so humans and agents find the right document quickly;
- own the lifecycle rules (status vocabulary, date-prefix convention, metadata fields);
- reduce the temptation to read every Markdown file.

The live index ([docs/index.md](../index.md)) is the source of truth. It groups documents by type, separates active investigations from completed ones, and defines the lifecycle metadata (`Status: Active | Completed | Superseded | Archived`, plus `Date`, `Resolution`, `Follow-up`). Do not re-create a competing index inside other docs; link to the real one.

### ADRs

Path: `docs/adr/`

ADR means Architecture Decision Record.

Purpose: record a significant decision; explain why it was made; list alternatives considered; preserve consequences and trade-offs.

ADRs should be short. They are not design docs and not investigations.

Good ADR topics (the repo's real ADRs are good live examples):

- centralise project-slug canonicalisation;
- `src/db` is infrastructure; features own persistence;
- avoid barrel files;
- prefer flat module structure;
- cache tags, lifetimes, and invalidation.

Bad ADR topics: fix a typo; rename a local variable; add a loading spinner; refactor one helper; document every small PR.

Filename format — stable numeric prefixes, never renumbered:

```txt
docs/adr/0001-centralise-slug-canonicalisation.md
docs/adr/0004-avoid-barrel-files.md
docs/adr/0006-prefer-flat-module-structure.md
```

If a decision changes, create a new ADR and mark the older one `Superseded` (ADR 0001 → 0005 is a real example). Do not rewrite history.

Template:

```md
# ADR 000X: Title

Status: Proposed
Date: YYYY-MM-DD
Related: #issue, PR #number

## Context

What forces this decision?

## Decision

What are we deciding?

## Alternatives considered

- Option A
- Option B

## Consequences

Positive:

- ...

Negative:

- ...

## Follow-ups

- ...
```

Statuses: `Proposed`, `Accepted`, `Superseded`, `Deprecated`, `Rejected`.

Prefer the concise Nygard-style structure for a small project. Empirical comparison of ADR templates found Nygard scoring well on comprehension and ease of adoption, with MADR favouring structural detail — so reach for a heavier MADR-like template only when a decision has many constraints or stakeholders (see [References](#references-and-further-reading)).

### Investigations

Path: `docs/investigations/`

Purpose: explore an open technical or product question; compare options; document trade-offs; make a recommendation without pretending a final decision has been made.

Good investigation topics: offline grading support; repository documentation architecture; authentication/passkey strategy; local search options; export format options; testing strategy audits.

Investigations can be long, but must be skimmable.

Filename format — date-prefixed, descriptive kebab-case:

```txt
docs/investigations/2026-05-19-offline-support.md
docs/investigations/2026-05-19-repo-documentation-architecture.md
```

Template (metadata fields match the lifecycle vocabulary in [docs/index.md](../index.md)):

```md
# Investigation: Topic

Status: Active            # Active | Completed | Superseded | Archived
Date: YYYY-MM-DD
Related: #issue, PR #number
Resolution: ...           # fill in when the investigation concludes
Follow-up: None | ...

## Question

What are we trying to learn?

## Executive summary

What is the short answer?

## Context

Why does this matter?

## Options considered

### Option A

Pros / Cons

### Option B

Pros / Cons

## Recommendation

What seems best for now?

## Non-goals

What should not be done yet?

## Open questions

- ...

## References

- ...
```

An investigation can later produce an ADR — for example, the offline-support investigation feeding an ADR on the offline assessment outbox. When an investigation's direction is implemented, mark it `Completed`, record the `Resolution`, and move its entry to the completed section of [docs/index.md](../index.md). (This very document is an example.)

### Design docs

Path: `docs/design/`

Purpose: describe how an accepted or likely approach will be implemented — interfaces, data flow, failure modes, rollout, testing — with enough detail for one or more implementation PRs.

A design doc is more concrete than an investigation, less permanent than an ADR. When it is tied to a specific implementation effort, date-prefix it (e.g. `docs/design/2026-06-10-import-parse-prepare-write-seams.md`).

Good design doc topics: offline sync v1; import pipeline; assessment data model; grading export flow; authentication flow.

Template:

```md
# Design: Feature or subsystem

Status: Proposed
Date: YYYY-MM-DD
Related: #issue, ADR 000X

## Goal

## Constraints

## Proposed design

## Data model

## API / interface

## UI behavior

## Failure modes

## Testing strategy

## Migration / rollout

## Open questions
```

Statuses: `Draft`, `Proposed`, `Accepted`, `Implemented`, `Superseded`.

### Reference docs

Path: `docs/reference/`

Purpose: describe durable facts about the current system; serve as lookup material; spare agents from inferring stable contracts out of scattered code.

Good reference docs (real examples): testing conventions; database migrations; the cache-invalidation map. Other natural candidates: the YAML grading format; environment variables; database schema overview; public URL conventions; API routes; import/export file formats.

Keep reference docs close to the code they describe. If a reference doc would duplicate generated information, generate it or link to the source of truth instead (principle 5). Avoid reference docs that constantly drift from implementation.

### Guides

Path: `docs/guides/`

Purpose: explain how to do a task; target humans more than agents; provide procedures rather than architectural reasoning.

Good guide topics (real examples): commit message conventions; issue and PR conventions; TypeScript API design; running integration tests. Others: how to create a grading project; how to import Moodle submissions; how to reset the local development database.

Guides should be procedural and concise.

> The `adr` / `design` / `reference` / `guides` split maps cleanly onto the [Diátaxis](https://diataxis.fr/) quadrants (explanation / — / reference / how-to). Diátaxis is a useful sanity check when you are unsure which folder a doc belongs in: ask whether the reader wants to *understand*, *do*, or *look up*.

### Plans

Path: `plans/` (flat — no `active/`/`completed/` subdirectories)

Purpose: coordinate implementation work; give agents an explicit checklist; make work auditable before code changes; keep temporary execution notes out of durable docs.

Plans are working artifacts, not architecture docs. Date-prefix them and include the issue number when there is one:

```txt
plans/2026-06-23-some-task.md
plans/2026-06-22-numerical-rubric-bounds.md
```

A plan's path never changes — lifecycle is tracked by editing its `Status` field, not by moving the file. This avoids the backlink rot that a directory-based `active`/`completed` split causes whenever durable docs cite a plan by path. `plans/index.md` lists every `Status: Active` plan; an entry is removed (not moved) once the plan completes. See [docs/index.md](../index.md#plans) for the canonical metadata block (`Status`, `Created`, and the optional `Origin`/`Tracked by`/`Implemented by` fields) — defined there, not duplicated here, so it has one place to drift from.

Statuses: `Active`, `Completed`, `Abandoned`. Plans do not need to remain pristine once completed; delete them if they hold no reusable information.

#### Abandoned plans

A `plans/abandoned/` directory was considered but **not adopted** — the repository uses a single flat `plans/` directory, with abandonment recorded as `Status: Abandoned` rather than a location. When a plan is abandoned, prefer the lightest useful outcome:

- delete it if it contains no reusable information;
- close the related issue or PR as not planned or superseded, with a short explanation;
- extract durable findings into an investigation, design doc, or ADR if the work revealed real constraints or trade-offs.

The default is to extract durable knowledge, then remove the execution plan. A failed checklist is usually less useful than a short note in the relevant issue, PR, or investigation — and a lingering plan risks being mistaken for current instructions. Do not create an ADR for an abandoned plan unless the abandonment itself is a durable architectural decision; an investigation section such as "Rejected approaches" is usually the right home.

## Tool-specific instruction files

`AGENTS.md` is the single canonical source of agent policy. Other tools support their own files:

```txt
CLAUDE.md                          # this repo: thin, @-imports AGENTS.md
.github/copilot-instructions.md    # reduced to a pointer to AGENTS.md
.cursor/rules/
```

Do not duplicate substantial instructions across these files. The repository resolved this by keeping one canonical `AGENTS.md` and making tool-specific files point to it (PR #119 reduced the Copilot instructions to a short pointer; `CLAUDE.md` `@`-imports `AGENTS.md`). If duplication is ever unavoidable, keep it very small. This matters more for agents than it looks: conflicting copies of a rule have no defined winner unless precedence says so.

## How documents relate to issues and PRs

A useful traceability graph:

```txt
Issue
  -> investigation   (what was considered)
  -> ADR             (what was decided)
  -> design doc      (how it will work)
  -> plan            (how the work will be done)
  -> PR              (what changed)
```

Example for optional offline grading:

```txt
Issue #64
  -> docs/investigations/2026-05-19-offline-support.md
  -> docs/adr/000X-<offline-outbox-decision>.md
  -> docs/design/<offline-sync-v1>.md
  -> plans/<offline-grading>.md
  -> implementation PRs
```

## Status and metadata

Every non-trivial document includes status metadata near the top. Use the vocabulary defined in [docs/index.md](../index.md) so the whole repository stays consistent:

```md
Status: Active | Completed | Superseded | Archived
Date: YYYY-MM-DD
Related: #issue, ADR 000X, PR #number
Resolution: ...        # for time-bound docs, once concluded
Follow-up: None | ...
```

Document-type-specific status words still apply where they add meaning (ADR: `Proposed`/`Accepted`/`Superseded`/`Deprecated`/`Rejected`; design: `Draft`/`Proposed`/`Accepted`/`Implemented`/`Superseded`; plan: `Draft`/`Active`/`Blocked`/`Completed`/`Abandoned`).

This matters because **stale docs are worse than missing docs**: an agent over-trusts an old document unless its status, date, and any "superseded by" pointer are explicit.

## Naming conventions

Names should encode purpose and time-boundedness.

Good:

```txt
docs/investigations/2026-05-19-offline-support.md
docs/investigations/2026-05-19-repo-documentation-architecture.md
docs/adr/0006-prefer-flat-module-structure.md
docs/design/2026-06-10-import-parse-prepare-write-seams.md
plans/2026-06-22-numerical-rubric-bounds.md
```

Avoid:

```txt
docs/offline.md
docs/architecture.md
docs/notes.md
docs/final.md
docs/final-v2.md
```

- ADRs use stable numeric prefixes (not dates).
- Stable canonical docs — guides and reference docs — are not date-prefixed.
- Time-bound docs — investigations, effort-tied designs, and plans — are date-prefixed (`YYYY-MM-DD-topic.md`), per [docs/index.md](../index.md).

## What should be documented?

Document things that are: hard to infer from code; likely to be revisited; architecturally significant; safety-critical; useful to agents before making changes; tied to important trade-offs; relevant across multiple PRs.

Examples: why project URLs use stable IDs and cosmetic slugs; why student rows use surrogate keys; how grading data must not be silently lost; how imports map to internal entities; how offline sync should handle conflicts; why one validation library or data-access layer was chosen.

Do **not** document things that are: obvious from code; duplicated from `package.json`; duplicated from tests; volatile implementation details; better generated; specific to a single trivial PR.

### Generate, don't hand-write, mechanical facts

Prefer generated or source-of-truth-driven documentation for: route lists; database table lists (derivable from migrations or schema types); API schemas (generated from typed validators); command lists (already in `package.json`).

Hand-written docs explain intent, constraints, and trade-offs. Generated docs list mechanical facts. Anything mechanically checkable (a link, a file path, a command) should ideally be checkable in CI, so drift fails loudly instead of misleading an agent silently.

## What was adopted

The recommendation in this investigation has been implemented. For the record:

1. This document lives at `docs/investigations/2026-05-19-repo-documentation-architecture.md`.
2. The offline grading audit lives at [docs/investigations/2026-05-19-offline-support.md](2026-05-19-offline-support.md).
3. [docs/index.md](../index.md) exists as the documentation map and lifecycle owner.
4. [AGENTS.md](../../AGENTS.md) carries short operational rules, a routing table, and instruction precedence.
5. [CONTEXT.md](../../CONTEXT.md) carries the canonical domain glossary.
6. `plans/` holds execution plans, flat, lifecycle tracked by `Status`; `plans/index.md` lists active ones.
7. ADRs are created only when a decision is accepted or seriously proposed (`docs/adr/0001`–`0009` at the time of writing).

The guidance is applied with restraint: not every change is forced through all document types — use the smallest artifact that captures the missing context.

## Recommended workflow for agent-assisted changes

This mirrors the operating protocol in [AGENTS.md](../../AGENTS.md); that file is canonical if the two ever diverge.

For non-trivial code changes:

```txt
1. Read the issue or user request.
2. Read AGENTS.md.
3. Use docs/index.md to locate task-relevant guidance.
4. Read only the focused docs that apply (ADRs, investigations, designs, reference).
5. Read CONTEXT.md before touching domain terms, identifiers, or contracts.
6. Implement the change; optionally track multi-step work in plans/.
7. Run a simplify pass over modified code, then targeted validation.
8. Update docs only if behavior, architecture, or decisions changed.
9. Link the issue, plan, and docs in the PR body.
```

For documentation-only investigations:

```txt
1. Create a branch.
2. Add or update a file under docs/investigations/ with explicit status metadata.
3. Link related issues/PRs.
4. Add the entry to docs/index.md.
5. Open a documentation PR.
```

For architectural decisions:

```txt
1. Start with an investigation if the decision is not obvious.
2. Create a short ADR once the decision is made or proposed.
3. Link the ADR from related design docs and PRs.
4. Mark older ADRs superseded instead of rewriting history.
```

## Failure modes to avoid

### Treating investigations as decisions

An investigation may recommend an approach, but it is not an accepted decision. Mitigation: keep it in `docs/investigations/`; set an explicit `Status`; extract an ADR when a decision is made.

### Letting an implemented investigation masquerade as current guidance

Once a recommendation is implemented, the investigation's "do this next" sections become traps: an agent reads executed work as open TODOs. Mitigation: mark the investigation `Completed`, record the `Resolution`, point to the canonical homes, and move its index entry to the completed section. (This document had this exact problem before being revised.)

### Turning AGENTS.md into a knowledge dump

A long agent-instruction file can make agents slower and less accurate. Mitigation: keep `AGENTS.md` short; link to docs instead of embedding them; include only stable, high-value operating rules, routing, and precedence.

### Keeping active plans forever

Plans are working artifacts. If completed checklists stay listed as active, agents may follow outdated tasks. Mitigation: set `Status: Completed` and remove the entry from `plans/index.md` as soon as a plan lands; delete or extract abandoned ones; link completed plans from PRs if useful.

### Duplicating source-of-truth information

Docs that duplicate code drift quickly. Mitigation: document *why*, not just *what*; generate mechanical references; keep reference docs close to source-of-truth files.

### Creating too many ADRs

ADRs lose value if they record every small change. Mitigation: create ADRs only for decisions with durable consequences; keep them short; use plans or PR descriptions for small implementation choices.

### Mixing public user docs and internal development docs

A user guide and an architecture investigation serve different audiences. Mitigation: use `docs/guides/` for human procedures; use `docs/investigations/`, `docs/design/`, and `docs/adr/` for development knowledge.

## Resolved since this investigation

The original "open questions" have largely been answered by subsequent work:

- **`docs/architecture/`?** Not used. The more specific `adr/`, `design/`, and `investigations/` categories replaced it.
- **Require a plan for every code change?** No. Plans are for non-trivial, multi-step work; PR #119 explicitly removed any claim that `AGENTS.md` requires a plan file.
- **Keep `plans/` long-term?** Yes — completed plans are archived there rather than deleted by default.
- **One agent instruction file, or tool-specific ones?** One canonical `AGENTS.md`; tool-specific files are thin pointers (resolved by the [agent instruction architecture audit](2026-05-26-agent-instruction-architecture-audit.md) / PR #119).
- **Free-text status or controlled vocabulary?** Controlled vocabulary, defined in [docs/index.md](../index.md).
- **Should PR templates ask whether docs/ADRs/plans were updated?** The PR template was clarified rather than expanded into a docs checklist.

### Still open

- Whether to trim styling/code-style policy out of `AGENTS.md` to keep the always-loaded surface minimal (see the tension noted under [AGENTS.md](#why-keep-agentsmd-short--and-the-tension-to-watch)).
- Whether any reference docs (routes, env vars, schema) are worth generating rather than hand-writing.

## References and further reading

- Michael Nygard, "Documenting Architecture Decisions": <https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions> — the concise ADR style this repo prefers.
- MADR project: <https://adr.github.io/madr/> — the heavier template for high-constraint decisions.
- Diátaxis documentation framework: <https://diataxis.fr/> — the understand/do/look-up split behind `adr` vs `guides` vs `reference`.
- GitHub Copilot custom instructions: <https://docs.github.com/en/copilot/customizing-copilot/adding-repository-custom-instructions-for-github-copilot>
- AGENTS.md: <https://agents.md/> — the cross-tool convention.
- "One Size Fits All? An Empirical Comparison of ADR Templates regarding Comprehension, Usability, and Ease of Adoption" (2026): <https://arxiv.org/abs/2604.27333> — Nygard scored well on comprehension and adoption vs MADR.
- "Configuring Agentic AI Coding Tools: An Exploratory Study" (2026): <https://arxiv.org/abs/2602.14690> — context files are the dominant configuration approach; `AGENTS.md` is emerging as a cross-tool standard.
- "Evaluating AGENTS.md: Are Repository-Level Context Files Helpful for Coding Agents?" (2026): <https://arxiv.org/abs/2602.11988> — non-essential context can reduce task success and raise cost; specify only essential requirements.
- "On the Impact of AGENTS.md Files on the Efficiency of AI Coding Agents" (2026): <https://arxiv.org/abs/2601.20404> — `AGENTS.md` associated with lower median runtime and reduced output-token use at similar completion rates.
