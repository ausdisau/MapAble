# Temporal Evidence and Change Review (Wave 4 / PR 2)

## Temporal Access Engine

- Feature-specific TTL (geometry long; lift/ops short).
- States: current, scheduled, temporarily_unavailable, historically_unreliable, stale, expired, disputed, superseded, unknown.
- Invariants: stale remains stale; disputed remains disputed; unknown remains unknown.
- Static geometry never proves current lift operation.

## Change detection

Outcomes: matches_existing, possible_change, new_candidate, temporary_change, conflicts_with_existing, source_stale, cannot_compare, human_review_required.

Every detection produces an `AccessChangeReview` with `autoOverwriteBlocked: true`.

## Operating mode

Shadow / synthetic only. In-memory review store. No Prisma. No public publish. No Twin writer mutation.
