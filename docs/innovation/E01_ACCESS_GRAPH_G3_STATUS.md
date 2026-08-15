# Epic 01 — Access Graph: G0 / G3 status

**Epic:** `mapable-epic-01-access-graph`  
**Claim state:** In development (not Verified live; not production-ready)  
**Date:** 2026-08-12

---

## Human gates still required

| Gate | Status | Notes |
|------|--------|-------|
| Portfolio review | Pending human | Review `docs/innovation/` |
| Azure DevOps import | Blocked | `AZURE_DEVOPS_PAT` / org unset — use import JSON after authorisation |
| G0 Problem Evidence | Draft below | Needs DRO/support ticket corroboration for formal pass |
| G1 Co-design | Not started | Required before participant-facing UI |
| G2 Rights review | Partial | Engineering controls landed; formal G2 sign-off pending |
| **G3 Technical Proof** | **Engineering complete** | Flag-gated observation→store→read with provenance + freshness |
| G4 Controlled Pilot | Not started | Needs cohort + monitoring + rollback drill |

---

## G0 — Problem evidence (draft)

Sources already in repository (de-identified / programmatic):

1. Access Infrastructure doctrine (`docs/access-infrastructure/`) states access information must carry provenance — current discovery map does not expose feature-level verification states to participants as a graph product.
2. Capability honesty docs (`docs/productisation/CAPABILITY_REGISTRY.md`, AI CURRENT_STATE) mark Living Access Fabric / AccessCast as synthetic or flag-gated — participants cannot rely on national verified coverage.
3. Starting Work / indoor / transport pilots surface journey failures when destination access evidence is missing or stale (pilot dependency graphs).

**Formal G0 pass** still requires Product to attach ≥1 DRO or support-ticket corroboration per [PORTFOLIO_STAGE_GATES.md](./PORTFOLIO_STAGE_GATES.md).

---

## G3 — Technical proof (landed)

End-to-end path behind flags:

```
MAPABLE_ACCESS_INFRASTRUCTURE_ENABLED=true
MAPABLE_ACCESS_GRAPH_ENABLED=true
```

| Step | Implementation |
|------|----------------|
| Create observation | `POST /api/access-infrastructure/observations` |
| Store with provenance | `AccessObservationRecord` + `createAccessObservation` |
| Freshness / expiry | `reviewDue` from feature policy; evaluated on read |
| Read with labels | `GET /api/access-infrastructure/observations` |
| Place graph | `GET /api/access-infrastructure/graph/places/[placeId]` |
| AI guard | AI-inferred cannot be stored as `verified` |
| Audit | `access_graph.observation_created` AuditEvent |
| Tests | `tests/access/access-graph-*.test.ts` (14 passing) |

### Provenance rules enforced

- Community → `community_reported` (unverified)
- Organisation/venue → `venue_reported` (unverified until verification workflow)
- Assessor → `observed` or `verified` when explicitly requested
- AI → always `observed` + display **AI inferred — unverified**
- Expired → display source class `expired`, status `outdated`
- Unknown ≠ inaccessible (envelope flag)

### Explicit non-claims

- No national coverage claim
- No accreditation decision from this API
- No participant Access Passport exposure
- `productionClaim: "none"` on all responses

---

## Code anchors

- `lib/access/infrastructure/flags.ts` — `graph` / `graphApisEnabled`
- `lib/access/infrastructure/provenance.ts`
- `lib/access/infrastructure/freshness.ts`
- `lib/access/infrastructure/observation-service.ts`
- `app/api/access-infrastructure/observations/**`
- `app/api/access-infrastructure/graph/places/[placeId]/route.ts`

---

## Exact next actions

1. **Human:** Review portfolio + authorise ADO import (still blocked on credentials).
2. **Human:** Complete G0 formal evidence pack + G1 co-design for Access Graph contributor UX.
3. **Engineering:** G4 pilot runbook for a limited place cohort; dispute/correction workflow Feature; wire verification promotion only via E06 (never CV alone).
