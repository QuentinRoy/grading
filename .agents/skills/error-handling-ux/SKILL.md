---
name: error-handling-ux
description: User-facing error message conventions for this repository - meaningful, actionable messages with a recovery path, and never leaking framework/internal control-flow errors. Use whenever writing or reviewing error messages, error boundaries, or catch blocks that surface to a user.
---

# Error handling UX

- User-facing error messages must be meaningful and actionable.
- Never surface framework/internal control-flow errors, for example `NEXT_REDIRECT`, to users.
- Every user-visible error should include a clear recovery path.
- A recognized domain/validation error keeps its specific message. Anything else (an unexpected throw — a dropped DB connection, an unhandled exception) gets logged once (`docs/adr/0009-server-side-logging-with-pino.md`) and returns a generic, actionable fallback — never the raw `error.message`.

## Examples

```ts
// Bad: leaks the raw error to the client, no recovery path.
catch (error) {
	return { success: false, error: error.message };
	// e.g. "duplicate key value violates unique constraint
	// \"assessments_submission_id_criterion_id_key\""
}
```

```ts
// Bad: vague, no path forward, and doesn't tell the user anything happened to their work.
catch (error) {
	return { success: false, error: "Something went wrong." };
}
```

```ts
// Good: recognized domain error keeps its specific, actionable message
// (src/assessments/assessmentMutations.ts).
criterionChanged:
	"This grading criterion changed while you were grading. Reload and try again.",
invalidScore: "Enter a valid score and try again.",
```

```ts
// Good: truly unexpected error — log it once, return a generic but
// actionable fallback instead of the raw message (src/assessments/saveAssessment.ts).
catch (error) {
	logger.error({ err: error }, "Unexpected error saving an assessment");
	return { success: false, error: assessmentErrors.unexpected };
	// "Something went wrong saving this grade. Reload and try again.
	// If this keeps happening, report this issue."
}
```
