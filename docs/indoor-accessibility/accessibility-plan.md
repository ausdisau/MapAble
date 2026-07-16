# Accessibility plan (indoor platform)

## Keyboard

- Floor plan viewer: arrow pan, +/- zoom, Tab between features (existing toolbar).
- Authoring API supports numeric coordinate entry (full canvas editor pending).
- Route planner: native `<select>` controls, no drag-only workflow.

## Screen reader

- Live region for floor changes and route selection.
- Text view is complete alternative to visual plan.
- Trust and freshness labels on selected features.

## Multimodal

- Guidance mode toggle: standard, large text, plain language, high contrast, reduced detail.
- Audio instructions: optional browser speech (not auto-play) — scaffold pending.
- 3D/AR: disabled by default; never required.

## Reduced motion

Respect `prefers-reduced-motion` in existing viewer; 3D auto-rotation disabled when flag enabled.
