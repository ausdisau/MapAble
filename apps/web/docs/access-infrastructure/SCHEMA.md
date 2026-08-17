# Access Infrastructure schema

**Status:** canonical model + Prisma foundation  
**Public claim:** none — tables may exist behind flags; no production partner API claims  
**Code:** `lib/access/infrastructure/types.ts` · `prisma/schema.prisma` (Access Infrastructure block)

## Design rules

1. **No second place SoT** — place identity remains `AccessPlace` (C-011).
2. **Passport owns functional requirements** — not `AccessibilityProfile` (presentation) (C-010).
3. **Evidence is append-only** — observations and envelopes do not silently overwrite published place features.
4. **Compatibility is contextual** — never persist a universal venue score as truth.
5. **Unknown ≠ inaccessible** — uncertain states are first-class.

## Six core objects

### 1. `AccessRequirement`

Participant-selected functional need on an Access Passport.

```typescript
interface AccessRequirement {
  id: string;
  passportId: string;
  ontologyConceptId: string;
  domain: AccessDomain;
  attribute: string;
  comparator?: "eq" | "neq" | "gte" | "lte" | "gt" | "lt" | "includes";
  value?: string | number | boolean;
  unit?: string;
  criticality: "required" | "strong_preference" | "preference";
  contextScope: "always" | "activity_specific" | "journey_specific";
  timing: "permanent" | "temporary" | "fluctuating";
  assistance: "independent" | "optional" | "required";
  disclosureScopes: DisclosureScope[];
  userConfirmed: boolean;
  acceptableAdjustmentIds?: string[];
}
```

### 2. `AccessCapability`

Published capability of an entity (venue, path, vehicle, workplace, provider, digital service, …).

```typescript
interface AccessCapability {
  id: string;
  entityType: AccessEntityType;
  entityId: string;
  placeId?: string; // when entity is/backed by AccessPlace
  ontologyConceptId: string;
  attribute: string;
  value: string | number | boolean;
  unit?: string;
  availabilityJson?: unknown;
  evidenceObservationId: string;
  status: AccessProvenanceStatus;
}
```

### 3. `AccessObservation`

Who observed a claim, when, how, and with what evidence artefacts.

Maps onto / extends `AccessEvidenceEnvelopeRecord` for place-linked evidence. Typed observation rows are the infrastructure SoT for attribute-level provenance.

### 4. `AccessAdjustment`

An alternative arrangement that can move a match from barrier → `compatible_with_adjustment`.

Examples: table service when counter is high; staff-assisted entrance when automatic door unavailable; quieter visit window.

### 5. `AccessCompatibility`

Persisted or computed match result for a requirement set against an entity or journey.

```typescript
type AccessCompatibilityState =
  | "compatible"
  | "compatible_with_adjustment"
  | "uncertain"
  | "incompatible";
```

### 6. `AccessJourney`

Whole-of-journey evaluation connecting segments from preparation through return. One failed **required** segment may fail the journey.

## Access Passport

Participant-owned container for requirements + attribute-level disclosure. Not a risk score, vulnerability score, or provider-controlled clinical profile.

| Field | Notes |
| --- | --- |
| `userId` | Owner |
| `visibilityDefault` | Default disclosure posture |
| `requirements` | Child `AccessRequirement` rows |
| `containsDiagnosis` | Always false for matching payloads |

## Prisma models

Added in the Access Infrastructure block of `prisma/schema.prisma`:

- `AccessPassport`
- `AccessRequirementRecord`
- `AccessCapabilityRecord`
- `AccessObservationRecord`
- `AccessAdjustmentRecord`
- `AccessCompatibilityRecord`
- `AccessJourneyRecord`
- `AccessJourneySegmentRecord`

Enums: `AccessDomain`, `AccessCriticality`, `AccessContextScope`, `AccessTiming`, `AccessAssistanceMode`, `AccessProvenanceStatus`, `AccessCompatibilityState`, `AccessEntityType`, `AccessJourneySegmentKind`.

## Relationship to existing models

| Existing | Relationship |
| --- | --- |
| `AccessibilityProfile` | Presentation / digital prefs; may seed passport drafts with explicit consent |
| `AccessPlace` / `AccessPlaceFeature` | Capability surface for places; features remain discovery aids |
| `AccessEvidenceEnvelopeRecord` | Continues as envelope JSON provenance; observations may reference envelope ids |
| `AccessAccreditation*` | Discovery presentation over evidence — not decision SoT |
| `lib/access/fit` | Client-side discovery scorer; projects toward compatibility vocabulary over time |
| Intelligence-next compiler | Compiles passport requirements → AQL / proof-carrying results |

## Migration posture

Schema is additive. Writers remain flag-gated. No automatic migration of diagnosis fields into requirements. No overwrite of `AccessPlace` from observations without human change review.
