# MapAble design system

This document describes the shared visual language for MapAble Core, module apps, marketing surfaces, and maps. **Source of truth is always the code** — when in doubt, read the files linked below rather than copying hex values from older screenshots.

## Design tokens

CSS custom properties live in `app/index.css`:

| Token | Role |
| --- | --- |
| `--primary` | Brand teal (`#005B7F`) — primary actions, links, map provider pins |
| `--secondary` | Brand green (`#00A979`) — success, secondary emphasis, user location pins |
| `--accent` | Gold highlight (`#F8C51C`) — focus rings, marketing accents |
| `--destructive` | Errors, selected/highlight map pins |
| `--background`, `--foreground`, `--muted`, `--border` | Surfaces and typography |

Tailwind maps these in `tailwind.config.js` (`bg-primary`, `text-muted-foreground`, etc.).

Marketing-specific aliases (`--mapable-brand`, `--mapable-navy`, …) are also defined in `app/index.css` for public pages.

## Class recipes

Reusable Tailwind groups: `lib/brand/styles.ts`

- Headers: `mapableHeaderClass`
- Nav links: `mapableNavLinkClass`, `mapableNavLinkActiveClass`
- Section cards: `mapableSectionCardClass`
- Eyebrow badges: `mapableEyebrowBadgeClass`, `mapableEyebrowBadgeSecondaryClass`
- Search fields: `mapableSearchInputClass`

## Module accents (carousel / marketing)

Do **not** assign arbitrary hex colors per module. Use semantic accents from `lib/brand/module-accents.ts`:

| Accent | Use |
| --- | --- |
| `primary` | Care, Moves |
| `secondary` | Transport, Foods, Kids |
| `brand` | Jobs, Marketplace, main hub |

Module metadata: `app/lib/modules.ts` — each module has an `accent` field, not `color` / `gradient`.

## UI primitives

| Component | Path | Notes |
| --- | --- | --- |
| Button | `components/ui/button.tsx` | Use `<Button asChild><Link …>` for link CTAs |
| Card | `components/ui/card.tsx` | Variants: `default`, `elevated`, `interactive`, `gradient`, `outlined` |
| Badge | `components/ui/badge.tsx` | Base chip; pair with status tone classes when needed |
| Hub link card | `components/core/CoreHubCard.tsx` | **Canonical** dashboard/core/module hub tile |

## Layout patterns

| Surface | Shell / nav |
| --- | --- |
| Core hub | `components/core/CoreShell.tsx`, `CorePageHeader`, `CoreHubCard` |
| Dashboard | `components/layout/DashboardNav.tsx` — hub tiles use `CoreHubCard` |
| Module apps | `components/layout/ModuleShell.tsx`, `ModuleNav.tsx` (when present) |
| Billing / safety sub-nav | `BillingCentreNav`, `SafetyCentreNav` — pill active state |

**Spacing convention**

- Page stack: `space-y-8` (`mapableHubPageStackClass` when exported)
- Section headings: `font-heading text-xl font-semibold` (`mapableSectionHeadingClass`)
- Main content width: `max-w-6xl px-4 py-8`

Always include `SkipToContent` (`components/core/SkipToContent.tsx`) on authenticated shells.

## Maps

Map markers must use brand tokens, not hardcoded blues/greens/reds.

| Layer | Implementation |
| --- | --- |
| Leaflet divIcons | `lib/map/leaflet-markers.ts` + `.map-marker*` classes in `app/index.css` |
| MapLibre circles | `lib/map/map-colors.ts` → `getProviderCirclePaint()` |

Marker semantics:

- **Primary** — provider / default pin
- **Secondary** — user location
- **Destructive** — selected / highlighted provider

## Status badges

Prefer token-based badges (`components/ui/status-badge.tsx` or domain wrappers like `BillingStatusBadge`) over raw Tailwind palette classes (`bg-blue-100`, etc.).

## Adding new UI

1. Check for an existing primitive in `components/ui/` or `components/core/`.
2. Use CSS variables / Tailwind token classes — avoid new hex literals.
3. For module marketing, pick `primary`, `secondary`, or `brand` accent only.
4. Hub navigation tiles → `CoreHubCard`.
5. Primary actions → `Button` with focus ring and `min-h-11` touch target.

## Related docs

- Combined-care marketing tokens: `styles/mapable-care.css`
- Brand constants (URLs, logos): `lib/brand/constants.ts`
