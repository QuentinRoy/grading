---
name: react-patterns
description: React/Next.js DOM-id (`useId`) and page-composition conventions for this repository. Use whenever generating DOM ids for `aria-controls`/label pairs, or deciding whether code belongs in an `app/` route file versus a reusable `src/` component.
---

# React patterns

## DOM IDs

- For elements that require DOM IDs, such as `aria-controls` / target `id` pairs or form inputs / labels, prefer React `useId()` over hard-coded global IDs to avoid collisions.
- Derived IDs are acceptable when multiple related IDs are needed, for example `${id}-name` and `${id}-email`.
- Do not use `useId()` for:
  - React list keys
  - database IDs
  - persisted identifiers
  - IDs that must remain stable across sessions

## Page composition

- Keep page-level composition in `app/` route files.
- Avoid `src/` components that are full pages; `src/` components should stay focused and independently reusable and testable.
