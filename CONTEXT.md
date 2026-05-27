# Grading

This context defines the core domain language used in the grading product so contributors can distinguish stable public identifiers from internal database keys.

## Language

**Project ID**:
Stable public project identifier used in URLs and external-facing import/export references.
_Avoid_: public_id, internal project id, numeric project key

**Project Row ID**:
Internal surrogate database key for a project row, used for joins and foreign keys.
_Avoid_: project id (when meaning internal), public project id

**DB Boundary**:
Project Row ID stays inside database read/write functions and must not leave that layer.
_Avoid_: leaking row_id into routes, UI models, import/export contracts

**System-wide Row ID Boundary**:
For every feature, row identifiers are internal relational keys and must not leak beyond DB read/write boundaries.
_Avoid_: exposing any `rowId` in app-facing contracts unless an approved exception exists

**Schema Alignment Rule**:
App-level types that correlate to DB schema should derive from generated DB schema types whenever practical to prevent drift.
_Avoid_: manually duplicated enum/shape definitions that can diverge from generated schema

**Project Read Model**:
Project read outputs expose only Project ID for identity.
_Avoid_: exposing Project Row ID in read models

**Project Resolution Strategy**:
Database operations are built from Project ID directly, with in-query resolution to internal relational keys as needed.
_Avoid_: dedicated pre-resolution helper requests that add extra round trips

**Project ID Migration Default**:
DB-facing APIs should migrate to Project ID inputs by default.
_Avoid_: retaining Project Row ID API boundaries unless complexity or performance impact is clearly demonstrated and accepted

**Project Row ID Exception Bar**:
Keeping Project Row ID at a DB API boundary is allowed only when a measured regression exists, no reasonable query or index rewrite fixes it, and the exception remains DB-internal, documented, and tested.
_Avoid_: convenience-based exceptions without evidence

**Test Helper Boundary**:
Test helpers should expose Project ID by default; Project Row ID may remain internal only inside DB-facing cleanup or fixture plumbing that never leaves the helper.
_Avoid_: forcing fixture consumers to handle row IDs when the public identifier is sufficient

**Cutover Strategy**:
Boundary contract changes use hard cutover per module, not dual-accept signatures.
_Avoid_: temporary number-or-string APIs that prolong identifier ambiguity

## Flagged Ambiguities

- project id: previously overloaded in discussion and code. Resolution: Project ID means public identifier by default. Project Row ID must be named explicitly and is DB-internal only.

## Example Dialogue

Developer: Should this endpoint accept Project Row ID?

Domain expert: No. The API takes Project ID, because callers use the public project reference.

Developer: Then we resolve Project ID to Project Row ID before joining related tables?

Domain expert: Exactly. Project Row ID stays internal to persistence and joins.
