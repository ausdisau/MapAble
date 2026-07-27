# CareOS clinical boundaries

CareOS clinical boundaries inherit and extend `docs/clinical-boundaries.md` for the intelligence layer.

## Permitted (L0–L2)

- Retrieve authorised support-plan versions with provenance
- Explain operational steps in plain language
- Identify missing evidence for a planned service
- Prepare questions for qualified clinicians or coordinators
- Route items to human clinical review queues

## Prohibited (never AI-automated)

- Diagnosis or differential diagnosis
- Prescription or medication change
- Treatment authorisation
- Restrictive practice decisions
- Emergency treatment decisions
- Capacity determinations
- Safeguarding findings or risk ratings

## Support-plan handling

Support-plan versions retain author, authority, effective/review dates, limitations, and supersession history. Workers receive only current, minimum-necessary instructions for a **confirmed** service — never speculative clinical guidance.

## High-intensity eligibility

Worker eligibility for high-intensity supports requires current verified competency evidence and participant-specific orientation where required. Missing, expired, or revoked evidence produces `requires_human_review`; it never becomes automatic assignment.

## CareOS-specific enforcement

- Capability registry blocks `clinical_diagnosis` and related tools (`tests/careos/foundation.test.ts`)
- Notification cloud strips clinical/health content from previews (`lib/notifications/notification-cloud.ts`)
- Home & Living clinical categories map to `prohibited_ai_decision` or `requires_qualified_clinical_review` (`lib/home-living/home-living-service.ts`)

## Human queues

Safeguarding and clinical review records are human-owned. Incident and complaint services remain canonical record systems.
