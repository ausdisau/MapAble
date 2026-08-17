# MapAble accessible ride-sharing strategy

## Problem

People with disabilities need transport that matches mobility equipment, trained drivers, and safeguarding—not generic ride-hail where matching optimises for speed and price alone.

## Approach

MapAble delivers **managed accessible transport** on the existing `TransportTrip` domain: scheduled rides, verified fleet, human dispatch, consent-gated access, and optional **ride pooling** (`RideRun`) for community providers.

## Users

| Role | Need |
|------|------|
| Participant | Book with profile-driven mobility needs; confirm or dispute trips; report safety issues |
| Family / nominee | Summary trip view with `transport.trip_access` consent |
| Provider dispatcher | Accept trips, see match suggestions, assign eligible driver/vehicle |
| Driver | Status updates, pre-start checks, handover records |

## Non-goals

- Autonomous dispatch or driver assignment (see `lib/platform/av-framework/governance.ts`)
- Automatic NDIS payment approval or Commission submission
- Unverified peer-to-peer drivers

## Success metrics

- Safety event acknowledgement time; handover completion rate
- Eligibility reject rate at assign (target: low when suggestions used)
- Participant trip confirmation rate; recurring trip adoption
- Phase 2: passengers per locked `RideRun`

## Documentation

- Product spec: [docs/accessible-ride-share.md](docs/accessible-ride-share.md)
- Transport APIs: [README_TRANSPORT_SCHEDULING.md](README_TRANSPORT_SCHEDULING.md)
