#!/usr/bin/env python3
"""Generate MapAble Innovation Portfolio Epic markdown files."""

from __future__ import annotations

from pathlib import Path

EPICS_DIR = Path(__file__).resolve().parent.parent / "epics"

A11Y = """- WCAG 2.2 AA on all user-facing surfaces
- Semantic HTML; keyboard navigation; visible focus; skip links where applicable
- Screen-reader labels on all interactive controls; live regions for dynamic updates
- Zoom to 400%; reflow at 320px; contrast ≥ 4.5:1
- Reduced motion; accessible errors; non-drag map alternatives; touch targets ≥ 44×44px
- Switch access; voice-independent workflows; plain-language and Easy Read for consent/plans
- AAC-compatible text interfaces; predictable focus; accessible auth and session timeout
- Manual AT testing (NVDA/VoiceOver + keyboard) before G5 — automated alone insufficient"""

AI_EVAL = """| Case | Expected |
|------|----------|
| Normal success | Valid output within authority |
| Missing evidence | States unknown; no fabricated facts |
| Conflicting evidence | Surfaces conflict; asks participant |
| Stale information | Shows freshness; warns user |
| User refuses recommendation | Accepts; offers alternatives |
| User revokes consent | Stops processing scoped data |
| Delegate lacks authority | Blocks with accessible message |
| Required tool unavailable | Non-AI fallback offered |
| Unsafe requested action | Refuses; escalates |
| Disclosure attempt | Blocks; logs audit event |
| Hallucinated accessibility fact | Caught by eval; not shown as verified |
| Incorrect funding claim | Advisory wording only |
| Escalation required | Routes to human |
| Accessibility fallback required | Non-AI path completes task |
| Cohort disparity | Flagged in monitoring |"""

NO_AI = "Not applicable — deterministic/episodic only."


def gates(slug: str) -> str:
    rows = [
        ("G0", "problem-evidence", "Problem evidence from ≥3 sources"),
        ("G1", "co-design", "DRO co-design per co-design-protocol.md"),
        ("G2", "rights-review", "Rights, a11y, privacy, safeguarding review"),
        ("G3", "technical-proof", "End-to-end proof behind feature flag"),
        ("G4", "controlled-pilot", "Limited cohort; monitoring; rollback"),
        ("G5", "evidence-to-scale", "KPI + manual AT evidence"),
        ("G6", "continuous-assurance", "Ongoing monitoring active"),
    ]
    lines = ["| Gate | Feature key | Pass summary |", "|------|-------------|--------------|"]
    for g, name, summary in rows:
        lines.append(f"| {g} | `{slug}-gate-{g.lower()}-{name}` | {summary} |")
    return "\n".join(lines)


def feat_table(items: list[tuple[str, str, str]]) -> str:
    lines = ["| # | Feature | Classification | Repo anchor |", "|---|---------|----------------|-------------|"]
    for i, (name, cls, anchor) in enumerate(items, 1):
        lines.append(f"| {i} | {name} | {cls} | `{anchor}` |")
    return "\n".join(lines)


def render(e: dict) -> str:
    slug = e["slug"]
    journeys = "\n".join(f"{i+1}. {j}" for i, j in enumerate(e["journeys"]))
    caps = "\n".join(f"- {c}" for c in e["functional_caps"])
    features = feat_table(e["features"])

    ai_use = e.get("ai_use", NO_AI)
    ai_prohib = e.get("ai_prohibited", "N/A")
    ai_eval = e.get("ai_eval", "N/A — no AI in this Epic.")

    return f"""# Epic {e['num']} — {e['title']}

> **Azure DevOps Epic key:** `{slug}`  
> **Priority:** {e['priority']} | **Horizon:** {e['horizon']}  
> **Current claim state:** {e['claim']}

---

## 1. Epic title

{e['title']}

## 2. Epic ID / proposed slug

`{slug}`

## 3. Strategic outcome

{e['strategic']}

## 4. Participant outcome

{e['participant']}

## 5. Problem statement

{e['problem']}

## 6. Scope

{e['scope']}

## 7. Explicit non-goals

{e['non_goals']}

## 8. User groups

{e['users']}

## 9. Example user journeys

{journeys}

## 10. Functional capabilities

{caps}

## 11. Shared Core dependencies

{e['core_deps']}

## 12. Cross-Epic dependencies

{e['cross_deps']}

## 13. Data entities

{e['entities']}

## 14. APIs/events required

{e['apis']}

## 15. Permission model

{e['permissions']}

## 16. Consent requirements

{e['consent']}

## 17. Human approval gates

{e['approval_gates']}

## 18. Accessibility acceptance criteria

{A11Y}

## 19. Privacy requirements

{e['privacy']}

## 20. Safeguarding requirements

{e['safeguarding']}

## 21. AI use, if any

{ai_use}

## 22. AI prohibited decisions

{ai_prohib}

## 23. AI eval requirements

{ai_eval}

## 24. Audit requirements

{e['audit']}

## 25. Observability requirements

{e['observability']}

## 26. Complaints/correction path

{e['complaints']}

## 27. Feature flags

{e['flags']}

## 28. Failure and fallback behaviour

{e['fallback']}

## 29. Security requirements

{e['security']}

## 30. Definition of Ready

{e['dor']}

## 31. Definition of Done

{e['dod']}

## 32. MVP acceptance criteria

{e['mvp']}

## 33. Pilot acceptance criteria

{e['pilot']}

## 34. Scale acceptance criteria

{e['scale']}

## 35. KPIs

{e['kpis']}

## 36. Risks

{e['risks']}

## 37. Mitigations

{e['mitigations']}

## 38. Dependencies

{e['dependencies']}

## 39. Recommended owner/team

{e['owner']}

## 40. Delivery horizon

{e['horizon']}

## 41. Current claim state

**{e['claim']}**

## 42. Evidence required before claim-state promotion

{e['claim_evidence']}

---

## Azure DevOps Features

### Stage-gate Features

{gates(slug)}

### Product Features

{features}

---

## Stage-gate pass/fail (Epic-specific)

| Gate | Pass | Fail |
|------|------|------|
| G0 | {e['g0_pass']} | Problem un evidenced |
| G1 | Co-design sign-off recorded | Token consultation only |
| G2 | Sharing/rights boundaries approved | Blanket collection approved |
| G3 | {e['g3_pass']} | Duplicate SoT or unflagged code |
| G4 | Pilot cohort + rollback tested | Broad enablement |
| G5 | KPIs + manual AT met | Privacy/a11y incidents open |
| G6 | Monitoring dashboards live | Unaddressed drift |

---

*Generated as part of MapAble Innovation Portfolio documentation. Not a production-ready claim.*
"""


EPICS: list[dict] = [
    {
        "num": "01", "file": "01-access-graph.md", "slug": "mapable-epic-01-access-graph",
        "title": "MapAble Access Graph", "priority": "P0", "horizon": "Foundation Wave",
        "claim": "In development",
        "claim_evidence": "Promote to **Implemented, not independently verified** after G4 pilot with provenance on all pilot assertions. Promote to **Verified live** only after independent verification of regional coverage claims.",
        "owner": "Access Platform Team",
        "strategic": "Create the canonical evidence-backed accessibility data graph used across MapAble.",
        "participant": "Reliable, correctable accessibility information with transparent provenance — not vague labels or unverified guesses.",
        "problem": "Accessibility data is fragmented, stale, or missing provenance. Participants cannot distinguish measured, reported, inferred, or expired claims.",
        "scope": "Places, entrances, paths, doorways, thresholds, ramps, gradients, surfaces, stairs, lifts, toilets/Changing Places, parking, drop-off, kerb ramps, crossings, public transport access, sensory, hearing augmentation, lighting, acoustics, counters, seating, workplaces, vehicles, providers, accessibility services — each with source, timestamp, evidence type, verification state, confidence, expiry, dispute history.",
        "non_goals": "Universal accessibility score; legal compliance certification; passport exposure in public graph; AI-only verification; second place SoT; national live registry claim without G5.",
        "users": "Participants, community reporters, venue operators, assessors, transport operators, planners, admins.",
        "journeys": [
            "Community member reports broken ramp with photo; enters as community_reported pending verification.",
            "Assessor publishes measured doorway after accreditation with assessor_measured provenance and expiry.",
            "Participant disputes lift status; correction updates graph with audit trail.",
        ],
        "functional_caps": [
            "Ingest and store access assertions with full provenance taxonomy",
            "Distinguish community_reported, organisation_supplied, assessor_measured, sensor_observed, AI inferred, independently_verified, unknown, expired",
            "Freshness/expiry engine with automated stale marking",
            "Dispute/correction workflow with participant notification",
            "Internal read API with provenance in every response",
        ],
        "features": [
            ("Canonical accessibility taxonomy", "EXTEND", "docs/access-infrastructure/ONTOLOGY.md"),
            ("Place and feature schema", "EXTEND", "AccessPlace, AccessPlaceFeature"),
            ("Evidence provenance system", "EXTEND", "AccessObservationRecord"),
            ("Observation workflow", "NEW/EXTEND", "lib/access/import, moderation"),
            ("Verification workflow", "NEW", "E06 integration"),
            ("Freshness and expiry engine", "NEW", "—"),
            ("Correction/dispute workflow", "EXTEND", "AccessPlaceReview"),
            ("Access Graph read API (internal)", "NEW", "docs/developer-api/"),
        ],
        "core_deps": "Place, AccessFeature, AccessObservation, Verification, AuditEvent, Document, EvidenceItem, FeatureFlag.",
        "cross_deps": "Upstream: Shared Core. Downstream: E02–E07, E11–E14. Blocks flywheel.",
        "entities": "AccessPlace, AccessPlaceFeature, AccessObservationRecord, AccessEvidenceEnvelopeRecord, AccessCapabilityRecord, AccessPlaceReview.",
        "apis": "GET/POST /api/access/*; events: ObservationCreated, VerificationStateChanged, EvidenceExpired, DisputeOpened.",
        "permissions": "Public: published capabilities with provenance. Community: submit observations. Assessor/org: scoped corrections. Admin: moderation.",
        "consent": "Submission terms; no PII in public payloads; passport never in place records.",
        "approval_gates": "Verified status promotion; bulk imports; organisation corrections to verified facts.",
        "privacy": "Minimum necessary public fields; pseudonymous reporters; photo retention policy.",
        "safeguarding": "Hazard reports to moderation queue; no auto-block without review option.",
        "ai_use": "Optional tagging assist — outputs always AI_INFERRED — UNVERIFIED until verification.",
        "ai_prohibited": "Awarding accreditation; marking independently_verified; inferring disability.",
        "ai_eval": AI_EVAL,
        "audit": "Append-only provenance; AuditEvent on all state changes.",
        "observability": "Freshness, coverage, dispute queue, false report rate dashboards.",
        "complaints": "Dispute workflow; engagement complaints for sustained issues.",
        "flags": "MAPABLE_ACCESS_INFRASTRUCTURE_ENABLED; access intelligence flags default off until G4.",
        "fallback": "Unknown ≠ inaccessible; manual place browse; community report path.",
        "security": "Rate limits; upload scanning; RBAC on verify.",
        "dor": "G0–G2; ontology draft; no second place SoT.",
        "dod": "G3–G5; tests; manual AT on browse/report.",
        "mvp": "100 pilot places, ≥3 feature types each, provenance on every assertion.",
        "pilot": "500 places; 70% freshness SLA; 14-day correction SLA.",
        "scale": "Multi-region; partner ingestion; G6 monitoring.",
        "kpis": "Feature-level evidence %; freshness; verified observations; corrections; false report rate.",
        "risks": "R01 inferred as fact; R08 duplicate SoT.",
        "mitigations": "Provenance UI; architecture review; claim honesty.",
        "dependencies": "E06 verified pipeline; E09 assessor identity.",
        "g0_pass": "≥3 sources document fragmented/stale access data pain",
        "g3_pass": "End-to-end observation→store→read with provenance labels",
    },
    {
        "num": "02", "file": "02-personal-access-passport.md", "slug": "mapable-epic-02-personal-access-passport",
        "title": "Personal Access Passport", "priority": "P0", "horizon": "Foundation Wave",
        "claim": "Implemented, not independently verified",
        "claim_evidence": "Schema exists (AccessPassport). Promote after G4 proves recipient-type sharing, <60s revocation, and zero unauthorised disclosure in pilot.",
        "owner": "Participant Experience Team",
        "strategic": "Participant-controlled reusable access-needs profile without universal disability disclosure.",
        "participant": "Control sharing with venues, workers, drivers, providers, employers, assessors, AI, emergency, analytics — with receipts and revocation.",
        "problem": "People repeat access needs or over-disclose diagnosis. Providers accumulate unnecessary sensitive data.",
        "scope": "Wheelchair dimensions, step-free, doorways, transfer, AAC, sensory, support person, toilet, assistance animal, vehicle, fatigue/rest. Purpose-bound consent, disclosure receipt, expiry, revocation, access log, participant review.",
        "non_goals": "Universal disability record; diagnosis for matching; provider-owned passport; automatic employer disclosure.",
        "users": "Participants, delegates, workers, drivers, employers (scoped), assessors, AI (scoped).",
        "journeys": [
            "Share doorway minimum with driver for one trip; receive disclosure receipt.",
            "Revoke employer access after interview; caches invalidated.",
            "Delegate blocked from AI sharing without grant.",
        ],
        "functional_caps": [
            "CRUD access requirements on functional ontology (not diagnosis)",
            "Recipient-type sharing matrix with purpose and expiry",
            "Disclosure receipts and participant-visible access log",
            "Revocation with sub-60-second enforcement target",
            "Compatibility projection against Access Graph capabilities",
        ],
        "features": [
            ("Passport CRUD + requirement ontology", "EXTEND", "AccessPassport, lib/access/infrastructure/"),
            ("Granular disclosure scopes", "EXTEND", "ParticipantAccessReceipt"),
            ("Purpose-bound consent + receipts", "REUSE/EXTEND", "ConsentRecord, lib/consent/*"),
            ("Sharing controls by recipient type", "NEW", "venues/workers/drivers/employers/AI/emergency"),
            ("Access log + participant review", "EXTEND", "DataAccessLog, Trust Fabric"),
            ("Passport compatibility projection", "EXTEND", "lib/access/infrastructure/compatibility.ts"),
            ("Non-disclosure guardrails", "NEW", "containsDiagnosis=false enforced"),
        ],
        "core_deps": "ParticipantProfile, AccessPassport, ConsentRecord, DataPurpose, DisclosureReceipt, DelegateGrant, AuditEvent.",
        "cross_deps": "Soft: E01. Enables E03, E07, E11.",
        "entities": "AccessPassport, AccessRequirementRecord, ConsentRecord, ParticipantAccessReceipt.",
        "apis": "/api/access-infrastructure/passport; /api/consents; events: PassportShared, ConsentRevoked.",
        "permissions": "Participant owner; delegate per grant; recipients read consented scopes only.",
        "consent": "Purpose-bound; time-bound; Easy Read summaries for consequential sharing.",
        "approval_gates": "Emergency scope; analytics opt-in; delegate grants.",
        "privacy": "Minimum necessary; no diagnosis in matching payloads; participant access log.",
        "safeguarding": "Emergency scope narrow; break-glass audited separately.",
        "ai_use": "AI reads scoped requirements only with explicit AI disclosure consent.",
        "ai_prohibited": "Inferring diagnosis; employer sharing without scope; retention after revocation.",
        "ai_eval": AI_EVAL,
        "audit": "Every passport read logged with purpose and recipient.",
        "observability": "Revocation latency; unauthorised access alerts (target 0).",
        "complaints": "Privacy complaints; participant self-correction with audit.",
        "flags": "MAPABLE_ACCESS_INFRASTRUCTURE_ENABLED; MAPABLE_TRUST_FABRIC_*.",
        "fallback": "Per-journey manual requirements; export summary for offline use.",
        "security": "Encryption at rest; passkey for owner; session timeout.",
        "dor": "G0–G2; sharing matrix co-designed.",
        "dod": "Revocation tested; receipts; G5 participant KPIs.",
        "mvp": "Create passport; one-trip driver share; revoke; access log.",
        "pilot": "All recipient types; Easy Read consent; zero disclosure incidents.",
        "scale": "Delegates; emergency; analytics opt-in aggregation only.",
        "kpis": "Consent comprehension; revocation success; unauthorised disclosure = 0.",
        "risks": "R02 universal disclosure; R04 unauthorised sharing.",
        "mitigations": "Scope matrix; receipts; employer default off.",
        "dependencies": "E01 soft; blocks E03, E07, E11.",
        "g0_pass": "Participant interviews document repeat disclosure burden",
        "g3_pass": "Share→receipt→revoke→block re-read demonstrated",
    },
    {
        "num": "03", "file": "03-navigate.md", "slug": "mapable-epic-03-navigate",
        "title": "MapAble Navigate", "priority": "P1", "horizon": "Experience Wave",
        "claim": "In development",
        "claim_evidence": "Transport routing exists (mock/OSRM). Promote after G4 shows suitability routing with uncertainty UI on pilot journeys.",
        "owner": "Access Platform Team",
        "strategic": "Accessible routing optimising suitability, not shortest time alone.",
        "participant": "Journey options that respect my access requirements with honest uncertainty about evidence quality.",
        "problem": "Maps optimise distance/time and hide stairs, gradients, surfaces, lift outages, and sensory intensity.",
        "scope": "Gradients, surfaces, narrow paths, stairs, kerb ramps, crossings, lifts/outages, toilets, rest, shade, lighting, sensory intensity, PT interchange, recharge, temporary barriers, construction. Uncertainty and freshness visible.",
        "non_goals": "Presenting inferred access as verified; guaranteed accessible arrival; indoor routing at scale until E05 evidence.",
        "users": "Participants, support coordinators, drivers (read-only route context).",
        "journeys": [
            "Power wheelchair user requests route avoiding stairs and steep gradients; alternatives shown with evidence age.",
            "Lift outage reported; route recalculates with notification.",
            "Participant adds rest stop; route adjusts without penalty UX.",
        ],
        "functional_caps": [
            "Suitability-weighted routing using Access Graph + Passport",
            "Segment-level provenance and freshness display",
            "Rest/toilet/recharge waypoint insertion",
            "Temporary barrier ingestion from community/graph",
            "Non-AI manual step-by-step directions fallback",
        ],
        "features": [
            ("Suitability routing engine", "NEW/EXTEND", "lib/transport-routing/*"),
            ("Evidence-aware route segments", "EXTEND", "AccessJourneyRecord"),
            ("Uncertainty + freshness UI", "NEW", "provenance patterns"),
            ("Rest/toilet/recharge waypoints", "NEW", "graph features"),
            ("Temporary barrier ingestion", "NEW/EXTEND", "community reports"),
            ("Indoor/outdoor route stitching", "DEFER", "lib/access/indoor/*"),
            ("Navigate participant UI", "NEW", "WCAG 2.2 AA"),
        ],
        "core_deps": "Place, AccessFeature, AccessObservation, RouteEstimate, Trip, AccessJourneyRecord, ParticipantProfile.",
        "cross_deps": "Requires E01, E02. Enables E07, E11 commute, E14 heatmaps.",
        "entities": "AccessJourneyRecord, RouteEstimate, TransportTrip (reuse), AccessCompatibility.",
        "apis": "/api/access/navigate/route; events: RouteComputed, BarrierReported, LiftOutageDetected.",
        "permissions": "Participant routes own journeys; operators see assigned trip segments only.",
        "consent": "Passport scopes for routing; no sharing route history to employers without consent.",
        "approval_gates": "Publishing default routes for public landmarks.",
        "privacy": "Journey history participant-controlled; aggregate only for Observatory.",
        "safeguarding": "Night routing warnings; escalation to human support.",
        "ai_use": "Optional natural-language route explanation — must cite evidence states.",
        "ai_prohibited": "Claiming verified access without provenance; hiding uncertainty.",
        "ai_eval": AI_EVAL,
        "audit": "Route requests logged; barrier reports auditable.",
        "observability": "Route completion rate; required-segment failure rate.",
        "complaints": "Report incorrect segment; feeds E01 dispute.",
        "flags": "New MAPABLE_NAVIGATE_ENABLED (proposed); transport routing flags.",
        "fallback": "Step-by-step list; static map with flagged segments; human phone/chat escalation via E08.",
        "security": "Rate limit route API; no precise home geo in logs without consent.",
        "dor": "G0–G2; E01 pilot data available.",
        "dod": "Manual AT on route UI; uncertainty labels verified.",
        "mvp": "50 pilot routes with provenance on every segment.",
        "pilot": "70% journey completion for required segments.",
        "scale": "Multi-city graph coverage thresholds.",
        "kpis": "Accessible-route completion; false barrier reports.",
        "risks": "R01 inferred as verified on routes.",
        "mitigations": "Segment provenance badges; stale warnings.",
        "dependencies": "E01, E02 required.",
        "g0_pass": "Pilot data shows time-only routing failures for wheelchair users",
        "g3_pass": "Route with labelled uncertain segments end-to-end",
    },
    {
        "num": "04", "file": "04-access-intelligence-vision.md", "slug": "mapable-epic-04-access-intelligence-vision",
        "title": "Access Intelligence Vision", "priority": "P3", "horizon": "R&D Wave",
        "claim": "Exploratory",
        "claim_evidence": "Explicitly deferred in docs/ai-platform/CURRENT_STATE.md. Promote to In development only after G3 CV pipeline with mandatory UNVERIFIED labelling.",
        "owner": "AI Platform Team (Access)",
        "strategic": "Human-supervised computer-vision accessibility evidence assistant.",
        "participant": "Faster evidence collection with clear labelling that AI suggestions are unverified until confirmed.",
        "problem": "Manual access surveys are slow; communities need assistive capture without AI overclaiming.",
        "scope": "Entrances, door-width estimates, ramps, steps, kerb ramps, handrails, signage, accessible parking, toilet features, surfaces, hazards — all AI_INFERRED — UNVERIFIED initially.",
        "non_goals": "CV-only accreditation; compliance certification; auto-publish to verified graph.",
        "users": "Community reporters, assessors, moderators, venue operators (corrections).",
        "journeys": [
            "Photo uploaded; CV proposes ramp detection → moderation queue.",
            "Organisation corrects misidentified entrance.",
            "Assessor validates proposal → promoted via E06 workflow.",
        ],
        "functional_caps": [
            "CV proposal pipeline with mandatory unverified status",
            "Human verification queues (community, org, assessor)",
            "Integration to E01 observation ingestion",
            "Eval harness for hallucinated feature detection",
        ],
        "features": [
            ("CV evidence proposal pipeline", "NEW", "deferred in CURRENT_STATE.md"),
            ("AI INFERRED — UNVERIFIED labelling", "NEW", "provenance enum"),
            ("Human verification queue", "EXTEND", "moderation"),
            ("Community confirmation", "EXTEND", "AccessPlaceReview"),
            ("Organisation correction", "EXTEND", "venue admin"),
            ("Assessor validation", "EXTEND", "E06"),
            ("Vision eval harness", "NEW", "pnpm ai:evals"),
        ],
        "core_deps": "AccessObservation, Document, EvidenceItem, AuditEvent, FeatureFlag.",
        "cross_deps": "Feeds E01; requires E06 for assessor validation path.",
        "entities": "AccessObservationRecord with AI provenance; moderation queue items.",
        "apis": "POST /api/access/vision/propose (internal); events: VisionProposalCreated.",
        "permissions": "Reporters submit; moderators/assessors verify; no auto-publish.",
        "consent": "Photo consent at capture; faces/plates blurring policy.",
        "approval_gates": "Any promotion out of AI_INFERRED status.",
        "privacy": "PII scrubbing on images; retention limits.",
        "safeguarding": " Hazard proposals prioritised in queue.",
        "ai_use": "Classification and detection proposals only.",
        "ai_prohibited": "Accreditation; independently_verified status; compliance claims.",
        "ai_eval": AI_EVAL,
        "audit": "Model version on each proposal; verifier identity logged.",
        "observability": "Proposal→verify latency; false positive rate.",
        "complaints": "Incorrect AI tag → dispute path.",
        "flags": "MAPABLE_ACCESS_VISION_ENABLED (proposed, default false).",
        "fallback": "Manual observation form without CV.",
        "security": "Sandboxed inference; no participant passport in CV context.",
        "dor": "G0–G2; R&D sandbox approved.",
        "dod": "Eval suite pass; zero auto-verified CV outputs.",
        "mvp": "3 feature types detected as proposals only.",
        "pilot": "50% assessor confirmation rate on proposals.",
        "scale": "Regional rollout with moderation staffing model.",
        "kpis": "False positive rate; time-to-verify.",
        "risks": "R01 CV as verified fact.",
        "mitigations": "Hard UNVERIFIED enum; human gates.",
        "dependencies": "E01 ingestion; E06 validation.",
        "g0_pass": "Evidence that manual capture is bottleneck",
        "g3_pass": "Photo→proposal→queue→reject/accept without auto-verify",
    },
    {
        "num": "05", "file": "05-accessibility-digital-twins.md", "slug": "mapable-epic-05-accessibility-digital-twins",
        "title": "Accessibility Digital Twins", "priority": "P3", "horizon": "R&D Wave",
        "claim": "In development",
        "claim_evidence": "AccessFloorPlan and indoor docs partial. Remains R&D until spatial evidence pipeline (E01/E06) supports twins.",
        "owner": "Access R&D Team",
        "strategic": "Structured spatial models for venues, stations, workplaces, campuses, hospitals, precincts, events.",
        "participant": "Preview venue access and plan journeys when sufficient spatial evidence exists — not before.",
        "problem": "Indoor and precinct access is invisible in outdoor-only maps.",
        "scope": "Spatial models linked to evidence; publication workflow; future indoor nav, evacuation support, passport compatibility preview.",
        "non_goals": "Production indoor nav without evidence; AR/VR without G3 proof; duplicate place SoT.",
        "users": "Venue operators, assessors, participants (preview), planners.",
        "journeys": [
            "Assessor uploads floor plan evidence → twin draft.",
            "Participant previews entrance-to-room path with uncertainty.",
            "Venue plans remediation from twin gap analysis.",
        ],
        "functional_caps": [
            "Evidence-backed spatial schema",
            "Twin publication workflow with review",
            "Passport compatibility preview (deferred until E02+E01 ready)",
            "Link to indoor routing when evidence sufficient",
        ],
        "features": [
            ("Spatial venue model schema", "EXTEND", "AccessFloorPlan"),
            ("Evidence-backed twin ingestion", "NEW", "spatial evidence required"),
            ("Passport compatibility preview", "DEFER", "E02+E01"),
            ("Evacuation planning support", "PROPOSED", "no runtime"),
            ("AR/VR preview interface", "EXPLORATORY", "—"),
            ("Twin publication workflow", "EXTEND", "indoor-accessibility/publication-workflow.md"),
        ],
        "core_deps": "Place, AccessFeature, Document, EvidenceItem.",
        "cross_deps": "E01 spatial entities; E03 indoor stitch deferred; E06 assessments.",
        "entities": "AccessFloorPlan, IndoorAccessibilityIncident, spatial graph nodes/edges.",
        "apis": "Internal twin CRUD; partner preview API (deferred).",
        "permissions": "Venue org admins edit own twins; public read published only.",
        "consent": "Floor plans may contain sensitive layout; access controlled.",
        "approval_gates": "Public twin publication.",
        "privacy": "No participant tracking in twins; aggregate analytics only.",
        "safeguarding": "Evacuation info advisory only; human emergency services.",
        "ai_use": "None in R&D phase except optional layout assist (UNVERIFIED).",
        "ai_prohibited": "Evacuation routing without verified exits; compliance claims.",
        "ai_eval": "N/A until AI assist introduced.",
        "audit": "Twin version history; publisher identity.",
        "observability": "Twin coverage; evidence linkage completeness.",
        "complaints": "Venue correction request path.",
        "flags": "Indoor accessibility flags; default off.",
        "fallback": "Outdoor-only routing; venue static PDF access statement.",
        "security": "Authenticated venue admin; watermark draft twins.",
        "dor": "G0–G2; spatial evidence standard defined.",
        "dod": "One venue twin with linked observations.",
        "mvp": "1 campus twin pilot with publication workflow.",
        "pilot": "3 venues; passport preview deferred flag off.",
        "scale": "Evidence thresholds per venue type.",
        "kpis": "Twins with ≥80% evidence-linked nodes.",
        "risks": "R16 R&D promoted prematurely.",
        "mitigations": "R&D wave; DEFER features.",
        "dependencies": "E01, E06 evidence.",
        "g0_pass": "Indoor access pain documented for pilot venues",
        "g3_pass": "Twin ingest→publish→read with evidence links",
    },
    {
        "num": "06", "file": "06-accreditation-os.md", "slug": "mapable-epic-06-accreditation-os",
        "title": "MapAble Accreditation OS", "priority": "P0", "horizon": "Foundation Wave",
        "claim": "Implemented, not independently verified",
        "claim_evidence": "AccessAccreditation* models and lib/access/accreditation* exist. Promote after G4 full assessor workflow publishes to graph with appeals.",
        "owner": "Access Platform Team",
        "strategic": "Operational voluntary accessibility verification — not legal compliance certification.",
        "participant": "Trustworthy venue accessibility claims backed by assessor evidence and appeals.",
        "problem": "Accreditation methodology exists in docs but operational end-to-end workflow is incomplete.",
        "scope": "Venue select → assessor assign → assessment → measurements → photos → scoring → human review → remediation → decision → publish to graph → expiry → reassessment → appeals.",
        "non_goals": "Legal compliance certification; auto-accreditation; AI scoring without human review.",
        "users": "Assessors, venue operators, participants (read published facts), admins.",
        "journeys": [
            "Assessor completes site visit with measurements → human review → approved facts to graph.",
            "Venue remediation tracked → reassessment scheduled.",
            "Participant appeals score presentation; correction path opens.",
        ],
        "functional_caps": [
            "Assessment versioning and evidence provenance",
            "Human review gate before graph publication",
            "Remediation tracking and expiry/reassessment",
            "Appeals with audit history",
        ],
        "features": [
            ("Assessment workflow engine", "EXTEND", "lib/access/accreditation*"),
            ("Assessor assignment + identity", "EXTEND", "E09 credentials"),
            ("Measurement + evidence capture", "EXTEND", "evidence envelopes"),
            ("Scoring + human review", "EXTEND", "no auto-decision flags"),
            ("Remediation tracking", "NEW/EXTEND", "—"),
            ("Publish approved facts to graph", "EXTEND", "E01"),
            ("Expiry + reassessment", "NEW", "freshness engine"),
            ("Appeals/corrections", "EXTEND", "engagement patterns"),
        ],
        "core_deps": "AccreditationAssessment, Verification, Credential, Document, EvidenceItem, AuditEvent.",
        "cross_deps": "Requires E01, E09. Enables E13 verified API.",
        "entities": "AccessAccreditation*, AccessibilityAccreditationCase, assessor assignments.",
        "apis": "/api/access/accreditation/*; events: AssessmentCompleted, FactsPublished, AccreditationExpired.",
        "permissions": "Assessors: assigned venues. Reviewers: approve publication. Venues: read own remediation.",
        "consent": "Venue operator consent for publication; participant data not required for venue assessment.",
        "approval_gates": "All publication to graph; accreditation decision; appeals outcome.",
        "privacy": "Assessment photos access-controlled; public summary minimum necessary.",
        "safeguarding": "No participant safety scoring; voluntary verification framing.",
        "ai_use": "Draft remediation text suggestions only; human approves.",
        "ai_prohibited": "Auto-accreditation decision; compliance certification language.",
        "ai_eval": "Hallucinated measurement; unsupported compliance claim.",
        "audit": "Full assessment version chain.",
        "observability": "Time-to-accredit; appeal rate; expiry compliance.",
        "complaints": "Appeals workflow; engagement complaints.",
        "flags": "Accreditation flags; MAPABLE_QUALITY_QMS_ENABLED related.",
        "fallback": "Manual assessor workflow outside system for edge cases.",
        "security": "Assessor credential verification via E09.",
        "dor": "G0–G2; assessor credential types defined.",
        "dod": "One full cycle to graph with appeal tested.",
        "mvp": "Single venue assessment → publish → expiry.",
        "pilot": "10 venues; 100% human review before publish.",
        "scale": "Assessor network onboarding via E09.",
        "kpis": "Verified observations published; appeal resolution time.",
        "risks": "Auto-accreditation pressure; compliance mislabeling.",
        "mitigations": "Human review gate; voluntary verification copy.",
        "dependencies": "E01 graph; E09 assessor credentials.",
        "g0_pass": "Venue operators request operational accreditation tool",
        "g3_pass": "Assessment→review→graph publish with provenance",
    },
    {
        "num": "07", "file": "07-participant-orchestration-agent.md", "slug": "mapable-epic-07-participant-orchestration-agent",
        "title": "Participant Orchestration Agent", "priority": "P2", "horizon": "Controlled Intelligence Wave",
        "claim": "In development",
        "claim_evidence": "Navigator governed pilot experimental (flags off). Distinct programme orchestrator not verified live.",
        "owner": "AI Platform Team",
        "strategic": "Participant-controlled conversational planning across MapAble modules.",
        "participant": "One place to explore options and approve plans — AI proposes, I decide, system executes only what I approve.",
        "problem": "Journey planning spans jobs, access, navigate, transport, care, calendar — participants coordinate manually.",
        "scope": "Search, compare, explain, dependencies, draft plans, suggest options. MODEL PROPOSES → POLICY VALIDATES → PARTICIPANT DECIDES → AUTHORISED SYSTEM EXECUTES.",
        "non_goals": "Autonomous booking; silent spend; disability disclosure; clinical/reportability decisions; multi-agent swarm.",
        "users": "Participants, delegates (limited), support coordinators (read with consent).",
        "journeys": [
            "Interview Tuesday Parramatta: agent drafts plan with route, transport, optional care prep — participant approves each step.",
            "User revokes passport mid-plan; agent strips scoped data and offers non-AI fallback.",
            "Unsafe auto-book attempt blocked; escalation to human.",
        ],
        "functional_caps": [
            "Single orchestrator with typed tools and constrained schemas",
            "Read aggregation from Jobs/Access/Navigate/Transport/Care/Calendar",
            "Approval gates before consequential execution",
            "Non-AI deterministic fallback planner",
            "Full audit and eval suite (15 cases minimum)",
        ],
        "features": [
            ("Single orchestrating agent shell", "EXTEND", "Navigator pilot, lib/ai/platform/"),
            ("Typed tools + constrained schemas", "EXTEND", "tool registry"),
            ("Propose → validate → approve → execute", "NEW", "policy services"),
            ("Cross-module read aggregation", "EXTEND", "vertical APIs read-only"),
            ("Approval gates + audit events", "REUSE", "AuditEvent, AgentRun"),
            ("Non-AI fallback planner", "NEW", "deterministic path"),
            ("Orchestration eval suite", "EXTEND", "pnpm ai:evals"),
        ],
        "core_deps": "AuditEvent, ConsentRecord, FeatureFlag, AgentRun, Notification, Task.",
        "cross_deps": "Requires E02, E03, E08. Reads Care/Transport/Jobs.",
        "entities": "AgentRun, AiMatchRun, approval records, plan drafts.",
        "apis": "/api/ai/orchestrator/*; events: PlanProposed, PlanApproved, ExecutionCompleted.",
        "permissions": "Participant approves; delegate bounds; tools RBAC per role.",
        "consent": "Passport scopes per module; no prompt injection of undisclosed fields.",
        "approval_gates": "Every book/spend/share action; funding questions advisory only.",
        "privacy": "Minimum context in model calls; trace retention policy.",
        "safeguarding": "Escalation for abuse/clinical questions — human only.",
        "ai_use": "Search, summarisation, explanation, drafting, planning, recommendation.",
        "ai_prohibited": "Assign workers; book without approval; disclose disability; spend; approve funding; clinical decisions; reportability; restrictive practices.",
        "ai_eval": AI_EVAL,
        "audit": "Full tool call trace; approval records immutable.",
        "observability": "Task success; forbidden action blocks; escalation precision.",
        "complaints": "Agent harm report; disable agent per participant.",
        "flags": "MAPABLE_NAVIGATOR_PILOT_* (extend); new ORCHESTRATOR_ENABLED proposed.",
        "fallback": "Step-by-step manual planner UI; human support coordinator handoff.",
        "security": "Tool allowlist; prompt injection defenses; no PCI/clinical in context.",
        "dor": "G0–G2; E02/E03/E08 pilot ready.",
        "dod": "15 eval cases pass; zero silent executions in pilot.",
        "mvp": "Draft plan only; no execution.",
        "pilot": "Approve→execute for transport quote request only.",
        "scale": "Additional modules gated by eval evidence.",
        "kpis": "Task success; unsupported-claim rate; forbidden attempts blocked.",
        "risks": "R03 autonomous execution; R17 multi-agent complexity.",
        "mitigations": "Approval gates; one agent; eval suite.",
        "dependencies": "E02, E03, E08 hard.",
        "g0_pass": "Starting Work pilot shows manual coordination pain",
        "g3_pass": "Propose→approve→single tool execute with audit",
    },
    {
        "num": "08", "file": "08-accessible-communications-fabric.md", "slug": "mapable-epic-08-accessible-communications-fabric",
        "title": "Accessible Communications Fabric", "priority": "P1", "horizon": "Experience Wave",
        "claim": "In development",
        "claim_evidence": "Messaging and Communication Passport flag exist; multi-channel AAC escalation incomplete.",
        "owner": "Comms Platform Team",
        "strategic": "Shared accessible communication layer across MapAble.",
        "participant": "Ask 'where is my driver?' and get plain-language status, next steps, and human help without a phone tree.",
        "problem": "Status updates force voice calls, inaccessible chat, or fragmented SMS/email.",
        "scope": "In-app, SMS, voice (optional), accessible web chat, WhatsApp/RCS where appropriate, email, AAC-friendly text. Preferences, no-voice-required, plain-language, escalation, emergency boundaries.",
        "non_goals": "Clinical or payment-card data in general agent context; inaccessible IVR as only path.",
        "users": "Participants, workers, drivers, support, providers.",
        "journeys": [
            "Participant prefers SMS + plain language; driver delay explained with ETA and escalation button.",
            "AAC user uses text-only chat; human handoff within SLA.",
            "Emergency boundary: system provides 000 guidance, not clinical advice.",
        ],
        "functional_caps": [
            "Communication preference SoT",
            "Multi-channel adapter with preference routing",
            "AAC-friendly and plain-language templates",
            "Accessible escalation without required voice",
            "Service-status explain + next steps",
        ],
        "features": [
            ("Communication preference SoT", "EXTEND", "lib/communication/*"),
            ("Multi-channel adapter layer", "NEW/EXTEND", "Message, SendGrid, SMS"),
            ("AAC-friendly + plain-language", "NEW", "Easy Read templates"),
            ("No-voice-required escalation", "NEW", "human handoff"),
            ("Service-status explain", "EXTEND", "transport/care status"),
            ("Emergency escalation boundaries", "NEW", "safeguarding docs"),
            ("Clinical/payment data isolation", "REUSE", "existing boundaries"),
        ],
        "core_deps": "CommunicationPreference, MessageThread, Notification, User.",
        "cross_deps": "Enables E07 status updates; used by all verticals.",
        "entities": "Conversation, Message, Notification, communication prefs.",
        "apis": "/api/messages; /api/notifications; channel webhooks.",
        "permissions": "Participants control channels; workers see job threads only.",
        "consent": "Channel opt-in; marketing separate from transactional.",
        "approval_gates": "Emergency template changes; new channel enablement.",
        "privacy": "Message retention policy; no cross-thread leakage.",
        "safeguarding": "Emergency boundaries documented; mandatory escalation paths tested.",
        "ai_use": "Plain-language summarisation of status — no clinical/financial advice.",
        "ai_prohibited": "Clinical triage; payment card handling in general context.",
        "ai_eval": "Accessibility fallback required; escalation required.",
        "audit": "Escalation events logged; channel delivery receipts.",
        "observability": "Delivery success; escalation SLA; channel failure rates.",
        "complaints": "SupportTicket + Complaint integration.",
        "flags": "MAPABLE_COMMUNICATION_PASSPORT_ENABLED; mobile comm flags.",
        "fallback": "Email digest; in-app inbox always available.",
        "security": "Channel auth; spam rate limits.",
        "dor": "G0–G2; preference model co-designed.",
        "dod": "No-voice path tested with AT; escalation SLA met.",
        "mvp": "In-app + email status for transport pilot.",
        "pilot": "SMS + plain language; human handoff <4h.",
        "scale": "WhatsApp/RCS where policy allows.",
        "kpis": "Escalation SLA; voice-independent completion rate.",
        "risks": "R18 phone tree dependency.",
        "mitigations": "No-voice-required default option.",
        "dependencies": "Messaging REUSE; parallel to E03.",
        "g0_pass": "Support tickets cite inaccessible comms",
        "g3_pass": "Multi-channel status + escalation demo",
    },
    {
        "num": "09", "file": "09-trust-credential-network.md", "slug": "mapable-epic-09-trust-credential-network",
        "title": "Trust & Credential Network", "priority": "P0", "horizon": "Foundation Wave",
        "claim": "Implemented, not independently verified",
        "claim_evidence": "Worker/provider credential models exist. Promote after G4 proves expiry never silently approves.",
        "owner": "Trust Platform Team",
        "strategic": "Shared credential infrastructure for workers, providers, drivers, vehicles, assessors, employers, organisations, training.",
        "participant": "Confidence that people and vehicles meeting my trip/care have valid, verified credentials — expired never treated as OK.",
        "problem": "Credential checks scattered across verticals with inconsistent expiry handling.",
        "scope": "Source, issuer, evidence, issue/expiry, verification, suspension, supersession, review, renewal reminders, exception workflow.",
        "non_goals": "Silent approval on expiry; vertical-specific credential silos.",
        "users": "Providers, workers, drivers, assessors, admins, participants (indirect trust).",
        "journeys": [
            "Driver credential expires → blocked from new assignments until renewal or documented exception.",
            "Assessor credential verified before E06 assignment.",
            "Provider views renewal reminder 30 days before expiry.",
        ],
        "functional_caps": [
            "Unified credential registry and lifecycle",
            "Fail-closed expiry checks",
            "Exception workflow with human approval",
            "Renewal reminders via notifications",
        ],
        "features": [
            ("Credential registry + lifecycle", "EXTEND", "Worker/Provider credential models"),
            ("Expiry + suspension (never silent approve)", "NEW/EXTEND", "deterministic gates"),
            ("Issuer verification + evidence", "EXTEND", "QMS, Stripe Identity gated"),
            ("Renewal reminders + exceptions", "NEW", "Notification"),
            ("Vehicle/driver/assessor types", "EXTEND", "transport, accreditation"),
            ("Credential API for verticals", "EXTEND", "shared Core"),
        ],
        "core_deps": "Credential, Worker, Provider, Verification, Document, AuditEvent, Notification.",
        "cross_deps": "Enables E06, E15; gates Care/Transport assignment.",
        "entities": "Credential records, verification status, exception approvals.",
        "apis": "/api/credentials/*; events: CredentialExpired, CredentialVerified, ExceptionApproved.",
        "permissions": "Issuer/admin verify; worker read own; verticals check via API.",
        "consent": "Credential evidence may contain personal docs; access minimised.",
        "approval_gates": "All exceptions to expired credential rules.",
        "privacy": "Document storage encrypted; limited retention.",
        "safeguarding": "WWCC and screening types prioritised; no bypass without exception audit.",
        "ai_use": "None for verification decisions.",
        "ai_prohibited": "Auto-approve expired; infer credential from profile photo.",
        "ai_eval": "N/A",
        "audit": "Every check and exception logged.",
        "observability": "Expiring credentials dashboard; exception rate.",
        "complaints": "Credential dispute process.",
        "flags": "Credential check flags per vertical.",
        "fallback": "Manual credential upload review queue.",
        "security": "Tamper-evident evidence storage; RBAC.",
        "dor": "G0–G2; credential types enumerated.",
        "dod": "Expiry block demonstrated in transport/care pilot.",
        "mvp": "Driver + assessor credential types with expiry gate.",
        "pilot": "100% expired blocked unless approved exception.",
        "scale": "Employer and vehicle types full lifecycle.",
        "kpis": "Credential-expiry exceptions documented 100%.",
        "risks": "R05 silent expiry approval.",
        "mitigations": "Fail-closed; exception workflow.",
        "dependencies": "Shared Core; parallel with E01.",
        "g0_pass": "Incidents/near-miss from expired credentials documented",
        "g3_pass": "Expired credential blocks assignment in demo",
    },
    {
        "num": "10", "file": "10-funding-payment-integrity.md", "slug": "mapable-epic-10-funding-payment-integrity",
        "title": "Funding & Payment Integrity Engine", "priority": "P2", "horizon": "Controlled Intelligence Wave",
        "claim": "In development",
        "claim_evidence": "Billing copilot deterministic; NDIA live blocked. Advisory integrity layer not verified live.",
        "owner": "Billing Platform Team",
        "strategic": "Advisory financial evidence and integrity layer — not autonomous claiming.",
        "participant": "Understand pricing and invoices with plain explanations; review anomalies before paying or claiming.",
        "problem": "Invoices and NDIS pathways are opaque; AI may overclaim fundability.",
        "scope": "Pricing explanations, quote comparison, service evidence, invoice anomaly/duplicate detection, rate comparison, participant review, draft funding questions, reconciliation assistance.",
        "non_goals": "Definitive NDIS claimable without deterministic rule; autonomous claiming; NDIA live without approval.",
        "users": "Participants, plan managers, providers, billing admins.",
        "journeys": [
            "Invoice flagged duplicate; participant reviews advisory notice.",
            "Copilot explains line items; suggests questions for plan manager — not 'definitely claimable'.",
            "High-impact anomaly escalates to human billing review.",
        ],
        "functional_caps": [
            "Deterministic anomaly rules",
            "Advisory funding pathway language",
            "Quote comparison across transport/care",
            "Participant review workflow",
        ],
        "features": [
            ("Pricing explanation layer", "EXTEND", "billing copilot"),
            ("Quote comparison", "EXTEND", "TransportQuote*"),
            ("Invoice anomaly + duplicate detection", "EXTEND", "BillingInvoice*"),
            ("Advisory funding pathway language", "NEW", "deterministic rules only"),
            ("Participant review + draft questions", "NEW", "human-in-loop"),
            ("Reconciliation assistance", "EXTEND", "billing centre"),
            ("Funding integrity evals", "NEW", "incorrect funding claim case"),
        ],
        "core_deps": "FundingSource, Quote, Invoice, Payment, Reconciliation, Document, EvidenceItem, AuditEvent.",
        "cross_deps": "Uses Care/Transport billing handoff; after Foundation stable.",
        "entities": "BillingInvoice*, BillingPayment*, NdisClaim*, audit logs.",
        "apis": "/api/billing/copilot/*; anomaly webhooks internal.",
        "permissions": "Participant sees own; provider scoped; admin reconciliation.",
        "consent": "Billing data not shared to employers via AI comms.",
        "approval_gates": "High-value anomaly resolution; any auto-export to NDIA (blocked until official enable).",
        "privacy": "Financial data classification; encrypted at rest.",
        "safeguarding": "Fraud reports to trust queue.",
        "ai_use": "Explain, summarise, draft questions, low-risk anomaly hints — deterministic rules validate.",
        "ai_prohibited": "Definitive claimable without rule; auto-submit claims; spend approval.",
        "ai_eval": AI_EVAL,
        "audit": "ClaimAuditEvent; copilot trace retention.",
        "observability": "Anomaly rate; false positive; participant override rate.",
        "complaints": "Billing dispute + engagement complaints.",
        "flags": "BILLING_NDIA_OFFICIAL_ENABLED=false; billing copilot flags.",
        "fallback": "Human plan manager; CSV export; non-AI invoice view.",
        "security": "PCI boundaries; no card data in AI context.",
        "dor": "G0–G2; advisory language approved by legal/compliance review.",
        "dod": "Eval includes incorrect funding claim case; zero definitive AI claims in pilot.",
        "mvp": "Duplicate detection + plain pricing explanation.",
        "pilot": "10 participants review anomalies; advisory wording 100%.",
        "scale": "Plan manager integrations.",
        "kpis": "Unsupported-claim rate; participant review completion.",
        "risks": "R09 NDIS overclaim.",
        "mitigations": "Deterministic rules; advisory copy.",
        "dependencies": "Billing Centre REUSE.",
        "g0_pass": "Billing complaints/support show opacity pain",
        "g3_pass": "Anomaly flagged with advisory text only",
    },
    {
        "num": "11", "file": "11-employment-accessibility-graph.md", "slug": "mapable-epic-11-employment-accessibility-graph",
        "title": "Employment Accessibility Graph", "priority": "P2", "horizon": "Participation Wave",
        "claim": "In development",
        "claim_evidence": "Jobs foundation + participation flags exist; employment-access graph not verified live.",
        "owner": "Jobs Platform Team",
        "strategic": "Expand Jobs beyond conventional matching with access, adjustments, transport, optional support — candidate-controlled disclosure.",
        "participant": "Apply and interview without automatically revealing disability; request adjustments and viable commute on my terms.",
        "problem": "Job matching ignores workplace access and commute; disclosure defaults harm candidates.",
        "scope": "Job ↔ skills ↔ workplace access ↔ adjustments ↔ transport ↔ optional support. Interview accessibility, placement sustainability, employer improvements feeding graph.",
        "non_goals": "Employability scoring; auto-reject; disability inference; automatic employer disclosure.",
        "users": "Job seekers, employers, support coordinators, interviewers.",
        "journeys": [
            "Candidate applies with zero disability fields visible to employer; requests interview adjustments separately.",
            "System shows commute suitability using E03 without sharing passport to employer.",
            "Placement sustainability check at 13 weeks with transport plan.",
        ],
        "functional_caps": [
            "Workplace accessibility profiles linked to E01",
            "Disclosure gates per application stage",
            "Adjustment request workflow",
            "Commute compatibility via E03",
        ],
        "features": [
            ("Workplace accessibility profiles", "EXTEND", "EmployerAccessibility*"),
            ("Candidate-controlled disclosure gates", "EXTEND", "MAPABLE_JOBS_PARTICIPATION_*"),
            ("Job ↔ access ↔ transport compatibility", "NEW/EXTEND", "JobMatchExplanation"),
            ("Adjustment request workflow", "EXTEND", "AdjustmentRequest pattern"),
            ("Interview accessibility planning", "NEW", "vertical slice"),
            ("Placement sustainability signals", "NEW", "retention KPIs"),
            ("Employer access improvement loop", "NEW", "feeds E01"),
        ],
        "core_deps": "Employer, Job, Application, AdjustmentRequest, AccessPassport (scoped), AuditEvent.",
        "cross_deps": "E01 workplace access; E02 disclosure; E03 commute; optional E07.",
        "entities": "Job, JobApplication, EmploymentProfile, EmployerAccessibilityEvidence, InterviewEvent.",
        "apis": "/api/jobs/*; /api/employer/accessibility/*.",
        "permissions": "Employer sees only consented fields; candidate controls each disclosure.",
        "consent": "Per-employer/per-stage scopes; Easy Read for adjustment sharing.",
        "approval_gates": "Any bulk disclosure; employer access profile publication.",
        "privacy": "No inference of disability from behavior; fairness hard-offs enforced in code.",
        "safeguarding": "No AI employability score; human review for contested matches.",
        "ai_use": "Explain match factors using non-disclosing attributes only.",
        "ai_prohibited": "Employability score; auto-reject; infer disability; share passport without scope.",
        "ai_eval": AI_EVAL,
        "audit": "Disclosure events per application stage.",
        "observability": "Disclosure rate (should be participant-driven); retention metrics.",
        "complaints": "Discrimination complaint path; adjustment dispute.",
        "flags": "MAPABLE_JOBS_PARTICIPATION_ENABLED.",
        "fallback": "Manual application without smart matching.",
        "security": "Employer tenant isolation.",
        "dor": "G0–G2; fairness review with DRO.",
        "dod": "Interview journey in vertical slice with disclosure control.",
        "mvp": "Workplace profile + adjustment request on apply.",
        "pilot": "Starting Work employer path with commute plan.",
        "scale": "Retention tracking 13/26/52 weeks.",
        "kpis": "Interview accessibility; adjustment fulfilment; retention.",
        "risks": "R04 employer disclosure; bias in matching.",
        "mitigations": "Default zero disclosure; deterministic fairness rules.",
        "dependencies": "E01, E02, E03.",
        "g0_pass": "Candidates report disclosure pressure in co-design",
        "g3_pass": "Apply flow with employer blind to disability fields",
    },
    {
        "num": "12", "file": "12-circular-assistive-technology.md", "slug": "mapable-epic-12-circular-assistive-technology",
        "title": "Circular Assistive Technology Network", "priority": "P3", "horizon": "R&D Wave",
        "claim": "Exploratory",
        "claim_evidence": "AtEquipmentAsset continuity only; no marketplace. Promote after G3 Equipment Passport without clinical/funding overclaims.",
        "owner": "AT Programme Team",
        "strategic": "Trusted network for purchase, rental, reuse, refurbishment, trials, delivery, servicing, recalls.",
        "participant": "Find equipment options with honest safety and funding boundaries — listing ≠ prescribed or fundable.",
        "problem": "AT access is expensive; reuse/recall information fragmented.",
        "scope": "Equipment Passport: model, serial, ownership, condition, service history, warranty, recalls, compatibility, accessories.",
        "non_goals": "Marketplace listing implies clinical suitability; auto-funding; prescription verification without authority.",
        "users": "Participants, providers, AT suppliers, technicians.",
        "journeys": [
            "Participant registers equipment in passport with condition notes.",
            "Recall notice matched to serial; owner notified.",
            "Trial listing browsed with explicit non-clinical disclaimer.",
        ],
        "functional_caps": [
            "Equipment Passport schema",
            "Recall/warranty tracking",
            "Compatibility metadata",
            "Clinical suitability guardrails in UI copy",
        ],
        "features": [
            ("Equipment Passport schema", "EXTEND", "AtEquipmentAsset"),
            ("Trial/rental/reuse listing", "NEW", "exploratory only"),
            ("Recall + warranty tracking", "NEW", "safety"),
            ("Compatibility + accessories", "NEW", "—"),
            ("Clinical suitability guardrails", "NEW", "explicit non-claims"),
            ("Servicing + collection logistics", "DEFER", "operational complexity"),
        ],
        "core_deps": "AtEquipmentAsset, Document, Credential, Notification, AuditEvent.",
        "cross_deps": "E09 trust for suppliers; future E07 coordination.",
        "entities": "AtEquipmentAsset, AtEquipmentOutage, listing records (proposed).",
        "apis": "/api/at/equipment/* (proposed); recall webhooks.",
        "permissions": "Owner edits passport; suppliers verified via E09.",
        "consent": "Serial numbers sensitive; share controlled.",
        "approval_gates": "Supplier listing publication; recall broadcast.",
        "privacy": "Ownership data not public.",
        "safeguarding": "Recall notifications mandatory; no delay.",
        "ai_use": "None for clinical suitability.",
        "ai_prohibited": "Infer prescription; claim NDIS fundability from listing.",
        "ai_eval": "N/A",
        "audit": "Ownership transfer; recall acknowledgment.",
        "observability": "Recall delivery rate; listing disclaimer impressions.",
        "complaints": "Faulty equipment incident path.",
        "flags": "AT continuity flags; marketplace flag proposed off.",
        "fallback": "External AT provider referral; manual recall register check.",
        "security": "Verified suppliers only for listings.",
        "dor": "G0–G2; clinical boundary copy approved.",
        "dod": "Equipment Passport + recall match demo.",
        "mvp": "Passport CRUD + one recall scenario.",
        "pilot": "5 equipment types; zero clinical claims in UI.",
        "scale": "Regional supplier network.",
        "kpis": "Recall notification success.",
        "risks": "R12 clinical overclaim from marketplace.",
        "mitigations": "Explicit non-claims; no auto-funding.",
        "dependencies": "E09 supplier credentials.",
        "g0_pass": "Participants report AT cost/access pain",
        "g3_pass": "Passport + recall notification without marketplace",
    },
    {
        "num": "13", "file": "13-access-api.md", "slug": "mapable-epic-13-access-api",
        "title": "MapAble Access API", "priority": "P2", "horizon": "Platform Commercialisation Wave",
        "claim": "Proposed",
        "claim_evidence": "Developer-api docs and partner API keys partial. Public access API not verified live.",
        "owner": "Developer Platform Team",
        "strategic": "Productise verified accessibility information with provenance — never participant passports.",
        "participant": "Benefit from councils and venues using consistent verified access data in their apps.",
        "problem": "External orgs need machine-readable access data; internal graph not yet productised.",
        "scope": "/places, /access-features, /access-observations, /verifications, /routes, /venue-access, /workplace-access, /transport-access with provenance, rate limits, licensing, versioning.",
        "non_goals": "Passport endpoints on public API; unverified data without labels; PII exposure.",
        "users": "Councils, transport operators, employers, tourism, developers, mapping providers.",
        "journeys": [
            "Council app fetches place features with confidence and expiry.",
            "Partner receives webhook on verification state change.",
            "Developer key revoked on licence violation.",
        ],
        "functional_caps": [
            "Public resource model with provenance on every field",
            "Rate limiting and partner licensing",
            "Versioning and change history",
            "Hard privacy boundary — no passport routes",
        ],
        "features": [
            ("Public API resource model", "EXTEND", "docs/developer-api/"),
            ("Provenance + confidence in responses", "EXTEND", "graph provenance"),
            ("Rate limiting + licensing", "NEW/EXTEND", "partner API keys"),
            ("Privacy boundaries", "NEW", "no passport exposure"),
            ("Versioning + change history", "NEW", "—"),
            ("Partner onboarding", "EXTEND", "org/API keys"),
        ],
        "core_deps": "Place, AccessFeature, AccessObservation, Verification, AuditEvent.",
        "cross_deps": "Requires E01 verified pipeline; E06 for verification resource.",
        "entities": "Partner API keys, licence records, API access logs.",
        "apis": "Public REST /v1/access/*; change webhooks.",
        "permissions": "API key scoped by resource and region; no participant data scopes.",
        "consent": "Not applicable to public place data; aggregate only.",
        "approval_gates": "Partner onboarding; licence tier changes.",
        "privacy": "Mathematical impossibility of passport re-identification from API; privacy review mandatory.",
        "safeguarding": "Abuse reporting for API misuse.",
        "ai_use": "None on public API layer.",
        "ai_prohibited": "N/A",
        "ai_eval": "N/A",
        "audit": "API access logs; key rotation events.",
        "observability": "Rate limit hits; error rates; partner SLA.",
        "complaints": "Partner dispute; data correction via E01.",
        "flags": "API_CERTIFICATION_V2_* proposed.",
        "fallback": "Partners use bulk export with same provenance rules.",
        "security": "OAuth/API keys; WAF; abuse detection.",
        "dor": "G0–G2; E01 pilot data quality threshold met.",
        "dod": "One partner integrated with provenance contract tests.",
        "mvp": "Read-only /places + /access-features for pilot partner.",
        "pilot": "3 partners; SLA 99.5%; zero passport leakage tests pass.",
        "scale": "Tiered licensing; national coverage claims only with G5.",
        "kpis": "API accuracy vs graph; partner correction rate.",
        "risks": "R10 passport leakage via API.",
        "mitigations": "Hard boundary; penetration test.",
        "dependencies": "E01, E06 required.",
        "g0_pass": "Partner demand letters/LOIs documented",
        "g3_pass": "Partner reads place with provenance fields",
    },
    {
        "num": "14", "file": "14-access-observatory.md", "slug": "mapable-epic-14-access-observatory",
        "title": "MapAble Access Observatory", "priority": "P2", "horizon": "Platform Commercialisation Wave",
        "claim": "Proposed",
        "claim_evidence": "Analytics-research docs exist; privacy-preserving observatory not implemented.",
        "owner": "Data & Policy Team",
        "strategic": "Aggregate accessibility intelligence for planners and policy — never identifiable participant journeys.",
        "participant": "Benefit from systemic fixes driven by evidence — not surveillance of my trips.",
        "problem": "Councils lack gap analysis; no privacy-safe aggregate view.",
        "scope": "Gap analysis, route barriers, inaccessible precincts, infrastructure opportunities, employment clusters, transport gaps, thin markets, data coverage.",
        "non_goals": "Identifiable journey export; participant tracking; re-identification from aggregates.",
        "users": "Councils, planners, researchers, transport operators, community orgs.",
        "journeys": [
            "Council views precinct barrier heatmap (k-anonymised).",
            "Researcher exports aggregate coverage report with ethics approval gate.",
            "Transport operator sees interchange gap index — not individual routes.",
        ],
        "functional_caps": [
            "Privacy-preserving aggregation (k-anonymity minimum)",
            "Gap and coverage dashboards",
            "Ethics-approved research export workflow",
            "No journey-level PII",
        ],
        "features": [
            ("Privacy-preserving aggregation", "NEW/EXTEND", "analytics-research.md"),
            ("Gap analysis dashboards", "NEW", "councils/planners"),
            ("Route barrier heatmaps", "NEW", "E01+E03"),
            ("Employment cluster analysis", "NEW", "E11"),
            ("Data coverage metrics", "NEW", "KPI alignment"),
            ("No identifiable journey exposure", "NEW", "privacy hard gate"),
        ],
        "core_deps": "Place, AccessObservation, Analytics aggregates, AuditEvent.",
        "cross_deps": "E01, E03, E11 data; after E13 patterns optional.",
        "entities": "Aggregate tables, export approvals, ethics records.",
        "apis": "Internal /api/observatory/*; export API gated.",
        "permissions": "Government partner workspace; role-based dashboard access.",
        "consent": "Aggregates only; opt-in analytics separate from observatory exports.",
        "approval_gates": "Research exports; new aggregate dimensions (re-identification review).",
        "privacy": "k-anonymity ≥ k; differential privacy review for sensitive cuts.",
        "safeguarding": "No individual targeting from observatory data.",
        "ai_use": "Aggregate trend summarisation only — no individual inference.",
        "ai_prohibited": "Individual journey reconstruction; participant profiling.",
        "ai_eval": "Re-identification attempt tests.",
        "audit": "Every export logged with approver.",
        "observability": "Export volume; re-id test results.",
        "complaints": "Privacy complaint if misuse suspected.",
        "flags": "Observatory flags proposed; off by default.",
        "fallback": "Manual aggregate reports for partners.",
        "security": "Partner workspace isolation; export watermarking.",
        "dor": "G0–G2; privacy impact assessment complete.",
        "dod": "Re-id test pass; one council dashboard live.",
        "mvp": "Coverage map + gap count by LGA.",
        "pilot": "2 councils; ethics export for 1 research partner.",
        "scale": "National LGA coverage with honesty on sparse regions.",
        "kpis": "Data coverage; zero re-id incidents.",
        "risks": "R10 journey re-identification.",
        "mitigations": "k-anonymity; export gates.",
        "dependencies": "E01, E03, E11.",
        "g0_pass": "Council/planner demand in co-design",
        "g3_pass": "Dashboard with k-anonymised aggregates only",
    },
    {
        "num": "15", "file": "15-academy-capability-passport.md", "slug": "mapable-epic-15-academy-capability-passport",
        "title": "MapAble Academy + Capability Passport", "priority": "P2", "horizon": "Participation Wave",
        "claim": "Exploratory",
        "claim_evidence": "AcademyCompetencyProposal scaffold only. Starting Work explicitly states academy evidence ≠ competency.",
        "owner": "Workforce Development Team",
        "strategic": "Shared learning and capability layer — course completion ≠ professional competence where supervised practice required.",
        "participant": "Workers and drivers with verified capabilities, not just certificates.",
        "problem": "Training tracked inconsistently; course badges mistaken for competency.",
        "scope": "Courses, competency assessment, evidence, expiry, refresher, role requirements, capability passport, credential integration.",
        "non_goals": "Auto-representing course completion as registration/qualification; unsupervised competency claims.",
        "users": "Workers, drivers, assessors, providers, employers, venue staff, MapAble staff.",
        "journeys": [
            "Worker completes course; capability passport shows 'training complete' not 'competent' until assessment.",
            "Assessor sign-off adds competency credential via E09.",
            "Refresher due → reminder → assignment block if role requires.",
        ],
        "functional_caps": [
            "Course catalogue and competency proposals",
            "Competency assessment workflow separate from course",
            "Capability Passport linked to E09 credentials",
            "Expiry/refresher integrated with assignment gates",
        ],
        "features": [
            ("Course + competency catalogue", "EXTEND", "AcademyCompetencyProposal"),
            ("Competency assessment workflow", "NEW", "course ≠ competence"),
            ("Capability Passport", "NEW", "E09 integration"),
            ("Expiry + refresher training", "NEW", "credential lifecycle"),
            ("Evidence capture for assessments", "EXTEND", "document management"),
            ("Worker readiness integration", "EXTEND", "Starting Work pilot"),
        ],
        "core_deps": "Credential, Document, EvidenceItem, Worker, Notification, AuditEvent.",
        "cross_deps": "E09 credentials; Starting Work; Care/Transport assignment gates.",
        "entities": "AcademyCompetencyProposal, course records, assessment evidence, capability passport.",
        "apis": "/api/academy/*; credential link events.",
        "permissions": "Learner read own; assessor sign-off; provider assign training.",
        "consent": "Assessment evidence may include video; explicit consent.",
        "approval_gates": "Competency sign-off; role requirement changes.",
        "privacy": "Assessment media access controlled.",
        "safeguarding": "Mandatory safeguarding courses for care roles; verified before assignment.",
        "ai_use": "Course content summarisation only; not competency decisions.",
        "ai_prohibited": "Auto-competency from course completion; replacing supervised assessment.",
        "ai_eval": "N/A unless AI grading proposed — then prohibited without human review.",
        "audit": "Course vs competency state transitions logged.",
        "observability": "Refresher compliance; assignment block rate.",
        "complaints": "Assessment dispute path.",
        "flags": "Academy flags proposed.",
        "fallback": "External RTO credentials uploaded manually to E09.",
        "security": "Assessor identity verified.",
        "dor": "G0–G2; role competency matrix with providers.",
        "dod": "Course + separate competency sign-off demonstrated.",
        "mvp": "One course + one competency assessment path.",
        "pilot": "Starting Work worker cohort; blocks on missing competency.",
        "scale": "Full role matrix for care/transport/drivers/assessors.",
        "kpis": "Competency vs course distinction audit 100%.",
        "risks": "R11 course as competence.",
        "mitigations": "Separate states; explicit UI labels.",
        "dependencies": "E09.",
        "g0_pass": "Providers report training/competency confusion",
        "g3_pass": "Course complete without competency badge until assessor sign-off",
    },
]


def main() -> None:
    EPICS_DIR.mkdir(parents=True, exist_ok=True)
    for e in EPICS:
        path = EPICS_DIR / e["file"]
        path.write_text(render(e), encoding="utf-8")
        print(f"Wrote {path}")


if __name__ == "__main__":
    main()
