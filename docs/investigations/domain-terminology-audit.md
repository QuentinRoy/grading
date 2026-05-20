# Domain terminology investigation

Related issue: #99

## Status

This document captures current investigation results around terminology and domain modeling.

This document is intentionally not exhaustive or final.

Purpose:
- preserve rationale
- track evolving thinking
- avoid issue descriptions becoming design documents
- provide a reference for contributors and coding agents
- distinguish ideas, assumptions and decisions
- record rejected or deferred alternatives so the same discussions do not need to be repeated

Future work and discoveries are expected.

---

## How to read this document

Status labels:
- Working assumption: currently useful model, not yet formally decided
- Proposed: likely direction, but not yet implemented or recorded as an ADR
- Investigation: open area requiring more evidence
- Rejected for now: intentionally avoided unless future evidence changes

Confidence labels:
- High: strong evidence and low expected churn
- Medium: reasonable current direction, but still needs validation
- Low: speculative or incomplete

This document is not an ADR. When a direction becomes stable enough, extract it into a focused decision record.

---

## Current working model

Status: Working assumption
Confidence: Medium
Decision owner: TBD

Question -> Rubric -> Mark -> Question grade -> Final grade

Current understanding:
- Question appears to be the main container.
- Rubric appears to represent a single grading dimension.
- A rubric produces a mark.
- Marks contribute to grades.
- Grades can exist at multiple levels.

Potential interpretation:

Question
- contains several rubrics
- receives a question grade after aggregating rubric marks

Rubric
- evaluates one grading dimension
- can be boolean, ordinal, numerical, etc.
- produces one mark

Mark
- rubric-level result

Grade
- aggregate result

Open questions:
- Is question always the correct term?
- Should users see question for reports, peer review, project grading or other non-exam workflows?
- Is rubric understandable enough for users?
- Should the UI use terms like grille, barème, critère d'évaluation or note depending on context?

### Conventional model intentionally avoided for now

Status: Rejected for now
Confidence: Medium

Many grading systems use:

Rubric -> Criterion -> Level

or:

Rubric -> Rubric row -> Rubric item

Current project understanding appears different:

Question -> Rubric

In this project, a rubric may already be what many systems call a criterion, row or grading item.

Avoid introducing these terms unless an actual additional hierarchy exists:
- criterion
- criteria
- rubric row
- rubric item
- rubric entry

Reasoning:
Introducing conventional terminology without a matching structure risks creating an artificial hierarchy and confusing contributors, users and coding agents.

Future reconsideration:
If nested grading dimensions or a true rubric container appear later, revisit the terminology.

---

## User-facing versus developer terminology

Status: Investigation
Confidence: Medium
Decision owner: TBD

Goal:
Prefer alignment between developer and user terminology where practical.

Principle:
If terminology differs between UI and implementation, the difference should be intentional and documented.

Helpful divergence may be acceptable:

Developer term -> User-facing term
- ImportedStudentIdentifier -> Student number
- RubricAssessment -> Evaluation
- InternalId -> not shown

Unhelpful drift should be avoided:

Same concept described as:
- code: project
- UI: assignment
- help text: workspace
- docs: grading session

This kind of drift makes it harder for users, future contributors and agents to know whether terms refer to the same concept or subtly different concepts.

Audit questions:
- Where do UI and implementation vocabulary diverge?
- Which divergences help users?
- Which divergences create confusion?
- Which terms should be canonical in code?
- Which terms should be canonical in the UI?
- Which terms should be documented as legacy or discouraged synonyms?

---

## Glossary structure

Status: Proposed
Confidence: Medium
Decision owner: TBD

A future `docs/domain-glossary.md` should not be a vague dictionary. It should encode decisions and discourage ambiguous usage.

Suggested entry structure:

Term: Mark

Developer term:
Mark

Preferred user-facing term:
TBD, possibly note depending on language/context

Definition:
Value produced by a rubric.

Use for:
- rubric-level grading value
- value that contributes to question grade

Do not use for:
- raw observed value before rubric conversion
- final aggregate grade

Discouraged synonyms:
- score, when referring to a rubric-produced grading value
- grade, when referring to a rubric-level value

Examples:
- Numerical rubric maps 12 identified networks to mark 4.
- Boolean rubric maps true to mark 2.

Incorrect examples:
- Final mark = 15/20, if the project uses grade for final aggregate results.

Each glossary entry should ideally include:
- canonical developer term
- preferred user-facing term, when relevant
- discouraged or legacy synonyms
- definition
- correct examples
- incorrect examples
- notes about intentionally different UI terminology

---

## Project terminology

Status: Investigation
Confidence: Low
Decision owner: TBD

Open questions:
- Does project mean app workspace?
- Can project conflict with student projects?
- Should users see project, course, grading session, assignment or something else?
- Is project too generic once auth, sharing or multiple courses exist?

Potential risk:
A user might understand project as the students' submitted project, while the app may use project as the grading workspace.

Potential alternatives:
- Course
- Assignment
- Grading project
- Grading session
- Workspace

No recommendation yet.

---

## Group terminology

Status: Proposed
Confidence: Medium
Decision owner: TBD

Working direction:
Prefer group over team.

Reasons:
- naturally represents one or many students
- avoids implying persistent collaboration
- aligns with educational workflows
- singleton groups work naturally
- covers binômes, trinômes, lab groups and ad hoc assessment groups
- may align better with imported Moodle groups

Potential direction:
Student -> Group -> Assessment

Singleton-group rationale:
A group of size 1 can represent an individual assessment target.

This may avoid persistent branching such as:
- StudentAssessment versus GroupAssessment
- individual target versus team target
- isStudent / isGroup checks in core grading logic

Instead:
Assessment targets a group.
The UI can present singleton groups as individual assessments.

Future-proofing examples:
- individual grading
- pair grading
- peer-review groups
- temporary evaluation groups
- imported Moodle groups
- anonymous review groups

Open questions:
- Are there future cases where group and team become distinct?
- Are imported Moodle groups the same concept as assessment groups?
- Should group be a core persistence concept or a derived assessment target?

---

## Individual versus grouped assessment

Status: Investigation
Confidence: Low
Decision owner: TBD

Current UI distinguishes individual and grouped assessments.

This distinction appears useful at the workflow/presentation layer:
- display
- search
- lookup
- organization
- imports
- labels
- actions

Potential persistence direction:
AssessmentTarget = Group
Group = one or more students

Potential presentation direction:
Group size 1 -> individual assessment UI
Group size greater than 1 -> grouped assessment UI

Guiding principle:
Do not force workflow distinctions into persistence unless they represent stable domain invariants.

This principle may apply beyond this specific case. UI modes and workflow affordances do not always need separate database models.

Examples:
- individual assessment UI
- grouped assessment UI
- anonymous assessment UI
- peer-review assessment UI

These may be presentation/workflow variants over a simpler assessment target model.

Open questions:
- Which queries require distinct persistence?
- Is the distinction mostly workflow driven?
- Would a unified persistence model simplify imports, exports, sharing and grading logic?
- Where should the distinction be reintroduced for user clarity?

Rejected or deferred:
- Separate persistence-level individual and group assessment models, unless evidence shows this distinction is a stable domain invariant.

---

## Mark versus grade

Status: Proposed
Confidence: Medium
Decision owner: TBD

Current concern:
Boolean and ordinal rubrics directly produce grading values while numerical rubrics currently introduce score.

Potential direction:
All rubric types produce Mark.
Score becomes optional.

Examples:

Boolean:
true -> mark = 2

Ordinal:
Très bien -> mark = 4.5

Numerical:
12 identified networks -> mark = 4

Motivating numerical example:
A numerical rubric may ask how many subnetworks were correctly identified.
The observed value might be 12.
The rubric then maps that observed value to a mark of 4 out of 4.

Flow:
raw score 12 -> mark 4 -> question grade -> final grade

Definitions:

Mark:
- value produced by a rubric
- may be positive, negative or asymmetric
- contributes to a question grade

Question grade:
- aggregation of rubric marks for a question

Final grade:
- overall result

Raw score:
- optional measured value used internally by some rubric implementations
- should not become the general term for rubric-produced grading values

Reasoning:
Avoid numerical rubrics behaving fundamentally differently from boolean and ordinal rubrics.

Rejected or deferred:
- Using score as the common output of all rubrics.
- Treating score and mark as interchangeable.
- Treating rubric-level mark and aggregate grade as the same concept.

Open questions:
- Should user-facing terminology use note, mark, grade, score or context-specific labels?
- Should the code use finalGrade only when intermediate grades exist?
- Is question grade the right term, or should it be assessment grade?

---

## Weighting and scaling

Status: Investigation
Confidence: Low
Decision owner: TBD

Problem:
Changing grading importance currently risks becoming rubric-specific.

Examples:
- modify numerical score mappings
- modify ordinal label values
- modify boolean marks

Potential direction:
Rubric results expose:
- mark
- weight

Question grade becomes weighted aggregation.

Potential aggregation:
Question grade = sum(mark * weight)

Potential benefits:
- consistent behavior across rubric types
- post-assessment tuning becomes more generic
- avoids special handling for numerical rubrics
- supports analytics and exports more consistently

Normalization concern:
Do not make normalization foundational too early.

Problem examples:
Human-readable mark ranges may be:
- 0..4
- -2..0
- -1..2

Normalizing these to 0..1 or -1..1 may obscure meaning and make UI/debugging harder.

Potential direction:
Keep mark and weight primary.
Treat normalization as derived if needed for analytics.

Open questions:
- handling negative/asymmetric rubrics
- whether weighting belongs at rubric or question level
- whether normalization is useful
- whether normalization should remain derived only
- whether weighted aggregation is compatible with malus-style rubrics

Rejected or deferred:
- Normalization-first model.
- Forcing all rubrics into 0..1 or -1..1 as the primary representation.

---

## Identifiers

Status: Investigation
Confidence: Medium
Decision owner: TBD

Open questions:
- Which identifiers are internal?
- Which identifiers are imported?
- Which identifiers are public?
- Which identifiers should users see?

Potential categories:
- internal database IDs
- imported Moodle identifiers
- imported student identifiers
- future public URL identifiers
- natural keys scoped to a project/group/course

Principle:
Avoid using `id` names for imported or external identifiers when they can be confused with database primary keys.

Potential examples:
- StudentId: internal database identifier
- ImportedStudentIdentifier: external identifier from imported data
- PublicProjectId: URL-safe public identifier, if introduced later

Open questions:
- Which identifiers should appear in exports?
- Which identifiers should appear in URLs?
- Which identifiers should appear in user-facing conflict resolution screens?

---

## Agent implications

Status: Proposed
Confidence: High
Decision owner: TBD

Coding agents may import conventional assumptions when terminology is underspecified.

Observed failure mode:
The term rubric led to the assumption of a conventional hierarchy:
Rubric -> Criterion

This does not appear to match the current project model.

Other likely assumptions:
- team means a persistent collaborative team
- score, mark and grade are synonyms
- project means a submitted student project
- question always means exam question
- imported identifiers are database IDs

Implication:
Terminology should be explicit enough to reduce inferred assumptions.

Recommended future agent guidance:
- check the glossary before introducing a domain term
- do not introduce conventional terms unless the project model uses them
- distinguish raw observations, rubric marks and aggregate grades
- distinguish internal IDs from imported identifiers
- distinguish UI wording from persistence concepts

---

## Rejected or deferred alternatives

Status: Working assumption
Confidence: Medium
Decision owner: TBD

Rejected or deferred for now:

- criterion as a project term
- rubric row
- rubric item
- rubric entry
- team as canonical terminology
- score as the generic rubric output
- score and grade as interchangeable terms
- normalization-first weighting model
- persistence-level individual/group split, unless proven necessary

These are not permanently rejected. They should be reconsidered if the domain model changes.

Reason for preserving this list:
It prevents future contributors and agents from reintroducing discarded terminology without revisiting the rationale.

---

## Candidate deliverables

- docs/domain-glossary.md
- ADRs where needed
- terminology decisions
- candidate refactors
- agent guidance
- possible AGENTS.md updates

## Notes

This document captures current thinking, not final decisions.

When discussions evolve, update this investigation rather than growing issue #99 indefinitely.