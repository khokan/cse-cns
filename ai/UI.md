# UI Constitution

## Philosophy

Professional enterprise software.
Prioritize clarity over decoration.
Every screen should be immediately understandable.

## Design

- Modern and minimal.
- Consistent spacing (8px grid).
- Consistent typography.
- Consistent colors using design tokens.
- High information density without clutter.
- Responsive by default.
- Accessible (WCAG AA).

## Components

- Reusable components only.
- Feature-based organization.
- No duplicated UI.
- Composition over large components.
- Shared component library.

## UX

- Minimize clicks.
- Keep common actions visible.
- Progressive disclosure for advanced options.
- Confirm destructive actions.
- Keyboard accessible.
- Loading, empty and error states required.
- Skeleton loaders preferred.
- Helpful validation messages.

## Tables

- Sticky headers.
- Sticky action column.
- Server pagination.
- Filtering.
- Sorting.
- Bulk actions.
- Export support.
- Row selection.
- Status badges.

## Forms

- Client + server validation.
- Inline validation.
- Required fields obvious.
- Disable submit while processing.
- Prevent duplicate submission.

## Performance

- Lazy loading.
- Code splitting.
- Memoize expensive rendering.
- Virtualize large lists.
- Optimistic updates where appropriate.

## Animation

- Subtle.
- Under 200ms.
- Never block interaction.

## Dark Mode

Supported by design.