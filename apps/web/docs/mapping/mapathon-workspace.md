# MapAble Signal - Community Mapathon Workspace

Status: **UI prototype, committed to a draft feature branch; not released or verified in production.**

## Outcome

Add an interactive mapping-day participation experience at `/mapping-days` in canonical `ausdisau/MapAble`, reusing the existing MapAble marketing shell and brand tokens.

- Five MapAble Signal challenge themes: journeys, entrances, facilities, sensory/communication access, and re-verification.
- Fictional precinct with accessible list and optional illustrative map.
- Flexible participation: remote, on location, or with chosen support. Optional roles: observe, research, check.
- Feature-specific and source-aware observation form. Unknown and unassessed are valid.
- Optional direct doorway measurement in millimetres, with source/number validation.
- Review panel, in-memory practice drafts, deletion and user-controlled reset.
- Personal practice target only, never a leaderboard or purported team metric.

## Constraints and boundaries

The UI does **not** create, verify, publish or score actual accessibility observations. All events and places are fictional; no live events are advertised. No GPS, uploads, account, team registration, backend, leaderboard, AI inference, or external observation API is connected. Drafts are confined to the current browser React session and disappear on refresh. No production RAGU rating, place, evidence or accreditation record changes.

The existing `/add-access-info` route also uses demo-handled submissions. This change does not connect or duplicate that route's submission store.

Legacy `ausdisau/mapableau-new` Access Signals PR #680 is a **separate draft**. Before any persistence-backed launch, agree canonical ownership and reuse MapAble Core consent, identity, audit and publication controls rather than creating competing data authorities.

## Accessibility and product acceptance

- Keyboard-only completion: theme, participation mode, role, place list/map, feature and source selection, review/save/remove.
- Screen-reader labels, legends, radio controls, errors, status announcements and map/list equivalence.
- 200–400% zoom and responsive reflow, 44px targets and visible focus; no colour-only status.
- Remote participation excludes unsupported direct-observation source. Validate negative, invalid and inapplicable measurements.
- AAC, switch, voice control, screen-reader, fatigue, low-bandwidth and support-person co-design testing required.
- No compulsory photography, fieldwork, public identity display or time-based rewards.
- Screen-reader, mobile and assistive-technology testing are **not yet independently performed**.

## Verification

In isolated source checks, TypeScript parsing passed for the four initial TS/TSX modules and strict compilation of the standalone data model passed. A Node assertion script passed seven data-model validation assertions. These checks do not replace repository type-check, targeted Vitest, eslint, Next build, axe/Playwright, or user testing. CI results must be verified at the current PR head.

## Conditions before live mapathon launch

1. Disability-led event design, hosting and risk management, including safe remote tasks.
2. Consent and revocation, anti-harassment and safe photo rules, data minimisation and retention/deletion.
3. A human evidence review and disputes/corrections queue.
4. Scoped, dated, explicitly provisional access claims and independent verification gates.
5. Safe volunteer participation, facilitator capacity, user support and incident escalation.
6. Canonical/legacy convergence review, deployment security controls and rollback procedure.

## Rollback

Revert the Mapping Days route/component, fictional fixture module and associated tests/doc. No database schema or public information was modified.
