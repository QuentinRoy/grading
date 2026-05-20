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

Future work and discoveries are expected.

---

## Current working model

Status: Working assumption
Confidence: Medium
Decision owner: TBD

Question -> Rubric -> Mark -> Question grade -> Final grade

Current understanding:
- Question appears to be the main container
- Rubric appears to represent a single grading dimension
- Marks contribute to grades
- Grades can exist at multiple levels

Open questions:
- Is question always the correct term?
- Should users see question for reports, peer review and project grading?
- Is rubric understandable enough for users?

Avoid introducing:
- criterion
- criteria
- rubric row
- rubric item

unless an actual hierarchy exists.

Reasoning:
Many systems use:
Rubric -> Criterion

Current project understanding appears different.
Introducing conventional terminology without a matching structure risks confusion.

---

## User-facing versus developer terminology

Status: Investigation
Confidence: Medium
Decision owner: TBD

Goal:
Prefer alignment between developer and user terminology where practical.

Potential principle:

If terminology differs between UI and implementation, the difference should be intentional and documented.

Potential examples:

Developer:
- ProjectId
- ImportedStudentIdentifier
- RubricAssessment

User:
- Course
- Student number
- Evaluation

Audit questions:
- Where do UI and implementation vocabulary diverge?
- Which divergences help users?
- Which divergences create confusion?

---

## Project terminology

Status: Investigation
Confidence: Low
Decision owner: TBD

Open questions:
- Does project mean workspace?
- Can project conflict with student projects?
- Should users see project, course, grading session, assignment or something else?

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

Potential direction:
Student -> Group -> Assessment

Open questions:
- Are there future cases where group and team become distinct?
- Are imported Moodle groups the same concept?

---

## Individual versus grouped assessment

Status: Investigation
Confidence: Low
Decision owner: TBD

Current UI distinguishes them.

Potential direction:
Persistence:
AssessmentTarget = Group

Presentation:
Group size 1 -> individual assessment UI
Group size >1 -> grouped assessment UI

Guiding principle:
Do not force workflow distinctions into persistence unless they represent stable domain invariants.

Open questions:
- Which queries require distinct persistence?
- Is distinction mostly workflow driven?

---

## Mark versus grade

Status: Proposed
Confidence: Medium
Decision owner: TBD

Current concern:
Boolean and ordinal rubrics directly produce grading values while numerical rubrics introduce score.

Potential direction:
All rubric types produce Mark.
Score becomes optional.

Definitions:

Mark:
- value produced by a rubric
- may be positive, negative or asymmetric

Question grade:
- aggregation of rubric marks

Final grade:
- overall result

Raw score:
- optional measured value used internally by some rubric implementations

Reasoning:
Avoid numerical rubrics behaving fundamentally differently.

---

## Weighting and scaling

Status: Investigation
Confidence: Low
Decision owner: TBD

Potential direction:
Rubric results expose:
- mark
- weight

Question grade becomes weighted aggregation.

Open questions:
- handling negative/asymmetric rubrics
- whether weighting belongs at rubric or question level
- whether normalization is useful
- whether normalization should remain derived only

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

Potential examples:
- internal IDs
- imported Moodle identifiers
- future URL identifiers

---

## Candidate deliverables

- docs/domain-glossary.md
- ADRs where needed
- terminology decisions
- candidate refactors
- agent guidance

## Notes

This document captures current thinking, not decisions.

When discussions evolve, update this investigation rather than growing issue #99 indefinitely.