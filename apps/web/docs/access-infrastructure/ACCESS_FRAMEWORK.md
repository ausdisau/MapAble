# ACCESS Framework principles

**Status:** foundational doctrine  
**Public claim:** none

## A — Agency and autonomy

The person decides:

- what their access requirements are;
- what is essential versus preferred;
- who can see them;
- when they apply;
- whether they want assistance;
- who may support their decision-making.

A support person, family member or provider must never automatically become the person's voice.

Aligned with NDIS Code of Conduct expectations around self-determination, decision-making and accessible communication.

## C — Capability requirements

Prefer functional capability statements over diagnosis labels for matching:

```text
Mobility: Power wheelchair
Route: Step-free required
Door: Minimum clear opening requirement
Communication: Speak directly to me; text fallback; allow response time
Transport: Wheelchair-accessible vehicle; remain seated; driver assistance
Toilet: Accessible toilet required
```

Diagnosis may remain **optional** profile information where the person wants it.  
Diagnosis must **never** be required for compatibility matching.  
Inference from diagnosis into requirements is prohibited (`PERMANENT_DENY_FLAGS.diagnosisInference`).

## C — Context

Every `AccessRequirement` carries context properties:

| Property | Values |
| --- | --- |
| Criticality | `required` / `strong_preference` / `preference` |
| Context | `always` / `activity_specific` / `journey_specific` |
| Timing | `permanent` / `temporary` / `fluctuating` |
| Assistance | `independent` / `optional` / `required` |
| Disclosure | attribute-level scopes (private, provider, worker, employer, emergency, …) |
| User confidence | `confirmed` / `tentative` |
| Adjustment | participant-defined acceptable alternatives |

MapAble does not decide what access means for somebody; it applies the person's declared requirements in context.

## E — Environment capability

Environments and services publish machine-readable capabilities (evidence-backed), not a single “accessible” boolean.

Accreditation tiers (Gold / Silver / Bronze) are a **summary presentation** of evidence — they do not replace feature-level evidence and must not be used as the sole access decision.

## S — Supports and adjustments

Compatibility is four-state (decision vocabulary for product surfaces):

| State | Meaning |
| --- | --- |
| `compatible` | All mandatory requirements have sufficiently reliable matching evidence |
| `compatible_with_adjustment` | A barrier exists; an agreed adjustment can address it |
| `uncertain` | Relevant information missing or stale — **unknown ≠ inaccessible and ≠ accessible** |
| `incompatible` | A mandatory requirement is contradicted by reliable evidence |

The person — not an algorithm — decides whether to proceed.

Richer proof-carrying states (`AccessConclusionState` in Access Intelligence Next) remain available for compilers; product UI maps them into these four states via `lib/access/infrastructure/compatibility.ts`.

## S — Source, safety and assurance

Every capability claim needs provenance. Observation statuses:

`verified` · `observed` · `venue_reported` · `community_reported` · `unknown` · `outdated` · `disputed`

Universal accessibility scores for consequential decisions are permanently denied.

## Separation from standards compliance

Rights (DDA), buildings (Premises Standards), transport (DSAPT), and digital (WCAG 2.2 AA) live in a **separate standards engine**. Compatibility matching must not silently equate “meets a standard” with “works for this person.”
