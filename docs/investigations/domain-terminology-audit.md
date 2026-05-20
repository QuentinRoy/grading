# Domain terminology investigation

Related issue: #99

## Status

This document captures current investigation results around terminology and domain modeling.

This document is intentionally not exhaustive or final. Future work and discoveries are expected.

## Current working model

Question -> Rubric -> Mark -> Question grade -> Final grade

Current understanding: a rubric itself appears to represent a single grading dimension.

Avoid introducing criterion or rubric row terminology unless an actual hierarchy exists.

## Group terminology

Working direction: prefer group over team.

Reasons:
- naturally represents one or many students
- avoids implying persistent collaboration
- aligns with educational workflows
- supports singleton groups

Potential direction:
Student -> Group -> Assessment

## Individual versus grouped assessment

Current UI distinguishes them.

Potential direction:
Persistence uses Group as the assessment target.
UI can distinguish singleton groups from multi-student groups.

Guiding principle:
Do not force workflow distinctions into persistence unless they represent stable domain invariants.

## Mark versus grade

Current concern:
Boolean and ordinal rubrics directly produce grading values while numerical rubrics introduce score.

Potential direction:
All rubric types produce Mark.
Score becomes an optional internal concept.

Mark:
- value produced by a rubric
- may be positive, negative, or asymmetric

Question grade:
- aggregation of rubric marks

Final grade:
- overall result

Raw score:
- optional measured value for some rubric implementations

## Weighting

Potential direction:
Rubric results provide mark and weight.
Question grade becomes an aggregation of weighted marks.

Open questions:
- handling negative or asymmetric rubrics
- whether weighting belongs at rubric or question level
- whether normalization is useful

## Notes

This document represents current thinking, not decisions.