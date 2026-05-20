# Replace SwipeableDrawer with standard Drawer

**Date:** 2026-05-20
**Status:** Ongoing

## Context

Issue: #91  
Title: Prevent side menu from opening during iPad back-swipe navigation

The app shell currently uses MUI `SwipeableDrawer` in `src/shared/AppShellNavigationShell.tsx`.

The implementation attempts to disable swipe behavior on iOS:

```ts
const iOS =
  typeof navigator !== "undefined" &&
  /iPad|iPhone|iPod/.test(navigator.userAgent);

disableDiscovery={iOS}
disableSwipeToOpen={iOS}
```

This is fragile because modern iPadOS can expose desktop-like user agents and may bypass detection.

The app already exposes an explicit drawer interaction path through the hamburger button in `AppShellTopBar`. Swipe opening is therefore optional rather than required.

Rather than improving platform detection, this change removes the swipe gesture entirely and uses a standard MUI `Drawer`.

Expected benefits:

- Fixes iPad/Safari back gesture conflict.
- Removes platform-specific logic.
- Removes device detection heuristics.
- Simplifies component behavior.
- Reduces future maintenance burden.
- Makes behavior easier to test.

---

## Scope

Included:

- Replace `SwipeableDrawer` with `Drawer`
- Remove iOS detection logic
- Remove swipe-specific props
- Remove unused `topSpace` prop
- Keep existing open/close interaction behavior
- Keep Storybook interaction tests passing
- Add documentation explaining why swipe behavior is intentionally absent

Not included:

- Navigation redesign
- Responsive drawer variants
- Desktop persistent drawer behavior
- Renaming unrelated component APIs

---

## Implementation plan

### 1. Replace SwipeableDrawer

File:

```txt
src/shared/AppShellNavigationShell.tsx
```

Replace:

```ts
import SwipeableDrawer from "@mui/material/SwipeableDrawer";
```

with:

```ts
import Drawer from "@mui/material/Drawer";
```

Replace:

```tsx
<SwipeableDrawer
```

with:

```tsx
<Drawer
```

---

### 2. Remove iOS detection

Delete:

```ts
const iOS =
  typeof navigator !== "undefined" &&
  /iPad|iPhone|iPod/.test(navigator.userAgent);
```

No replacement required.

---

### 3. Remove swipe-specific behavior

Remove:

```tsx
onOpen={onOpenDrawer}
disableBackdropTransition={!iOS}
disableDiscovery={iOS}
disableSwipeToOpen={iOS}
```

Keep:

```tsx
anchor="left"
open={drawerOpen}
onClose={onCloseDrawer}
ModalProps={{ keepMounted: true }}
slotProps={...}
```

Reason:

- Drawer opening already comes from:
  - hamburger button
  - `onToggleDrawer`

No functionality should be lost.

---

### 4. Remove dead prop

Remove from:

```ts
type AppShellNavigationShellProps
```

Delete:

```ts
topSpace?: number;
```

Remove:

```ts
topSpace = 0,
```

Remove from all call sites if any exist.

Expected outcome:

- Smaller API surface
- Fewer misleading props
- Less dead code

---

### 5. Add intent documentation

Near drawer component:

```ts
// Intentionally use non-swipeable Drawer.
// Swipe gestures conflict with browser navigation
// on iPad/Safari and opening via the hamburger
// button is the intended interaction path.
```

Goal:

Prevent future reintroduction of swipe behavior without context.

---

### 6. Verify Storybook behavior

File:

```txt
src/shared/AppShellNavigationShell.stories.tsx
```

Existing tests should continue passing unchanged.

Expected behavior:

DrawerOpens:

- hamburger button exists
- aria-expanded changes
- dialog appears

DrawerOpenCloseFlow:

- open through button
- close through button
- dialog disappears

---

### 7. Manual validation

Desktop:

- [ ] Open drawer through hamburger button
- [ ] Close drawer through hamburger button
- [ ] Click navigation item closes drawer
- [ ] Export actions still work
- [ ] Accessibility attributes remain correct

iPad Safari:

- [ ] Browser back gesture no longer opens drawer
- [ ] Hamburger button still opens drawer
- [ ] Drawer closes normally

---

## Risks

### Loss of swipe convenience

Impact: Low

Reason:

The application already uses explicit navigation controls and swipe interaction is not critical functionality.

---

### Hidden dependence on SwipeableDrawer behavior

Impact: Low

Possible examples:

- animation differences
- backdrop behavior differences
- portal behavior differences

Mitigation:

Existing Storybook interaction tests already cover visible behavior.

---

## Acceptance criteria

- [ ] iPad browser back gesture no longer opens navigation drawer
- [ ] Drawer still opens via hamburger button
- [ ] Drawer still closes correctly
- [ ] Existing Storybook tests pass
- [ ] iOS detection code removed
- [ ] Swipe-specific drawer configuration removed
- [ ] Unused `topSpace` prop removed
- [ ] Intent documented in code

---

## Progress

- [ ] Replace component
- [ ] Remove iOS detection
- [ ] Remove swipe props
- [ ] Remove dead prop
- [ ] Add comments
- [ ] Run Storybook tests
- [ ] Manual validation