---
name: error-handling-ux
description: User-facing error message conventions for this repository - meaningful, actionable messages with a recovery path, and never leaking framework/internal control-flow errors. Use whenever writing or reviewing error messages, error boundaries, or catch blocks that surface to a user.
---

# Error handling UX

- User-facing error messages must be meaningful and actionable.
- Never surface framework/internal control-flow errors, for example `NEXT_REDIRECT`, to users.
- Every user-visible error should include a clear recovery path.
