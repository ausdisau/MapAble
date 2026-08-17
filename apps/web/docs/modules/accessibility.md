# Accessibility module

## Access as Infrastructure

Functional access matching is owned by the **Access as Infrastructure** framework — not by presentation preferences alone.

- Doctrine + ontology + schema: [`docs/access-infrastructure/`](../access-infrastructure/)
- Passport (C-010): participant-controlled functional requirements
- Compatibility: evidence + requirement + context — never a universal score

## Phase 1 (presentation profile)

- `AccessibilityProfile` model with mobility, communication, sensory, cognitive, transport, and digital preference JSON fields
- Participant pages: `/dashboard/accessibility`, `/dashboard/accessibility/edit`
- Admin view: `/admin/participants/[id]/accessibility` (audit logged)
- API: `GET/PATCH /api/accessibility-profile`
- Reusable `AccessibilityProfileForm` and `AccessibilityPreferenceCard` components

`AccessibilityProfile` remains the **presentation / digital preference** SoT. It may seed an Access Passport draft with explicit consent; it must not silently become diagnosis-driven matching.

## Sharing

Participants control provider sharing via consent scopes `care.accessibility_share` and `transport.accessibility_share`, or explicit confirmation during booking. Access Passport disclosure is attribute-level (see Access Infrastructure schema).

## Phase 2

Provider-scoped filtered views, AAC/Auslan workflow hooks, and interface theme application from digital preferences.

## Infrastructure APIs (flag-gated)

- `GET /api/access-infrastructure/ontology`
- `GET /api/access-infrastructure/domains`

