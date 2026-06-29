---
name: react-patterns
description: React/Next.js DOM-id (`useId`) and page-composition conventions for this repository, plus the "outer placement is the parent's responsibility" rule for component spacing and positioning. Use whenever generating DOM ids for `aria-controls`/label pairs, deciding whether code belongs in an `app/` route file versus a reusable `src/` component, or writing/reviewing a component that applies `margin`/`mb`/`mt`/`my`, borderless/backgroundless `padding`, or page placement (`position: fixed`/`absolute`, `top`/`right`/`bottom`/`left`, overlay `zIndex`) to its own outermost element (including in an `sx` prop).
---

# React patterns

## Outer placement is the parent's responsibility

**Goal: a component owns how it looks inside its own boundary, never where it sits relative to anything outside that boundary.** Outer spacing *and* page placement are the parent's job. A component that decides its own position breaks encapsulation: it assumes a layout context it doesn't control, so every place that reuses it in a different context (a different sibling order, a grid instead of a stack, a different corner of the screen) needs a compensating override to undo it.

This covers two things on a component's outermost element:

- **Outer spacing.** Keep spacing inside the component's boundary. `padding` is fine on a root with a visible `border` or `background-color` — it's genuinely internal. But never `m`, `mt`, `mb`, `my`, or a hardcoded `margin` on the root, and never `padding` on a transparent/borderless root, which behaves identically to outer margin from the outside.
  - Let the parent control spacing between siblings, normally via `gap` on a flex/grid container (see `.agents/skills/ui-styling/SKILL.md`'s "prefer `gap` over margins on children").
  - If a component is rendered inside something that does not support `gap` (e.g. plain text flow), the *call site* — not the component — adds the spacing, for example by wrapping the usage in a `Box` with `mb`.

- **Page placement.** Never put the component *itself* in a fixed/overlay position. No `position: "fixed"` / `"absolute"`, no `top`/`right`/`bottom`/`left` offsets, and no page-level overlay `zIndex` on the root. Where a toast, banner, or floating panel anchors on screen is the call site's decision; the component only renders its own content. Internal arrangement of the component's *own* children — `display: flex`, `flexDirection`, `gap`, `maxWidth` — stays inside the component, because that describes what's within its boundary, not where the boundary lands.
  - The call site that knows the layout context wraps the component to place it, e.g. `<Box sx={{ position: "fixed", bottom: 16, left: 16, zIndex: 2000 }}><SaveErrorsDisplay /></Box>`.

```tsx
// Bad: SubmissionCard owns its own outer margin.
function SubmissionCard({ submission }: SubmissionCardProps) {
	return (
		<Card sx={{ mb: 2 }}>
			<CardContent>{submission.title}</CardContent>
		</Card>
	);
}

// Every caller that doesn't want that margin has to compensate:
<SubmissionCard submission={first} sx={{ mb: 0 }} /> // a compensating prop just to undo it
```

```tsx
// Good: SubmissionCard only manages its own internal spacing.
function SubmissionCard({ submission }: SubmissionCardProps) {
	return (
		<Card>
			<CardContent>{submission.title}</CardContent>
		</Card>
	);
}

// The parent that lays out multiple cards owns the spacing between them:
<Stack gap={2}>
	{submissions.map((submission) => (
		<SubmissionCard key={submission.id} submission={submission} />
	))}
</Stack>
```

```tsx
// Good: a one-off usage in prose, where the parent isn't a gap container,
// adds spacing at the call site instead of inside the component.
<Box sx={{ mb: 2 }}>
	<SubmissionCard submission={submission} />
</Box>
```

```tsx
// Bad: borderless, backgroundless padding acts just like outer margin —
// it pushes siblings away even though there's no visible boundary to contain it.
function SubmissionCard({ submission }: SubmissionCardProps) {
	return (
		<Box sx={{ p: 2 }}>
			<Typography>{submission.title}</Typography>
		</Box>
	);
}
```

```tsx
// Good: padding is fine once it's contained inside a visible boundary —
// it's genuinely internal spacing, not a stand-in for outer margin.
function SubmissionCard({ submission }: SubmissionCardProps) {
	return (
		<Card sx={{ p: 2 }}>
			<Typography>{submission.title}</Typography>
		</Card>
	);
}
```

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
