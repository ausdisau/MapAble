# Indoor accessibility — rollout status

Last updated: 2026-07-16

| Iteration | Feature flag(s) | Status | Notes |
|-----------|-----------------|--------|-------|
| 1 Floor plan viewer | — | **Complete** | Existing viewer at `/accessibility-map` |
| 2 Authoring studio | `floorPlanAuthoring`, `floorPlanReviewWorkflow` | **Partial** | API + admin entry; full canvas editor not yet built |
| 3 Verification & corrections | `floorPlanCommunityCorrections` | **Partial** | Trust badges, correction API, moderation page |
| 4 Personal fit | `personalAccessibilityFit` | **Partial** | Deterministic engine + viewer panel |
| 5 Indoor routing | `verifiedIndoorRouting` | **Partial** | Dijkstra engine + panel; demo route graph on ground floor |
| 6 Live status | `operationalStatus` | **Partial** | Incident API + panel; demo incident on library |
| 7 Door-to-destination | `doorToDestinationJourneys` | **Scaffold** | Journey planner service only |
| 8 Visit plans | `sharedVisitPlans` | **Partial** | API + share resolution; no full UI |
| 9 Offline packs | `offlineVenuePacks` | **Partial** | IndexedDB manager + save panel |
| 10 Checkpoints | `indoorCheckpoints` | **Partial** | Token validator + resolve API + manual entry UI |
| 11 Multimodal guidance | `multimodalGuidance` | **Partial** | Mode toggle (text sizing/contrast); audio scaffold pending |
| 12 3D / AR | `spatialPreview3D`, `webArPreview` | **Disabled** | Flags default off |
| 13 Accreditation | `accreditationConsole` | **Scaffold** | Uses existing `AccessAccreditationAssessment` models |
| 14 Partner API & embed | `partnerApi`, `partnerEmbeds` | **Partial** | v1 venues + floor-plans endpoints; embed script |

## Production configuration required

- `INDOOR_CHECKPOINT_SECRET` — checkpoint HMAC secret
- Partner API clients in `partner_api_clients` table
- Prisma migration for new indoor tables
- `INDOOR_FLAG_*` overrides for gradual rollout

## Known limitations

- Full visual authoring canvas (drag, zones, route graph editor) not implemented
- Outdoor routing provider not connected for door-to-destination journeys
- 3D/AR and accreditation console UIs not built
- Webhook delivery worker not implemented
- Status subscriptions (`statusSubscriptions`) disabled by default
