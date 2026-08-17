#!/usr/bin/env python3
"""Generate azure-devops-portfolio.json from epic definitions."""

from __future__ import annotations

import json
from pathlib import Path

# Import epic list from generate_epics by exec - simpler to duplicate minimal structure
EPICS_META = [
    ("01", "mapable-epic-01-access-graph", "MapAble Access Graph", "P0", "Foundation Wave", []),
    ("02", "mapable-epic-02-personal-access-passport", "Personal Access Passport", "P0", "Foundation Wave", ["mapable-epic-01-access-graph"]),
    ("03", "mapable-epic-03-navigate", "MapAble Navigate", "P1", "Experience Wave", ["mapable-epic-01-access-graph", "mapable-epic-02-personal-access-passport"]),
    ("04", "mapable-epic-04-access-intelligence-vision", "Access Intelligence Vision", "P3", "R&D Wave", ["mapable-epic-01-access-graph"]),
    ("05", "mapable-epic-05-accessibility-digital-twins", "Accessibility Digital Twins", "P3", "R&D Wave", ["mapable-epic-01-access-graph"]),
    ("06", "mapable-epic-06-accreditation-os", "MapAble Accreditation OS", "P0", "Foundation Wave", ["mapable-epic-01-access-graph", "mapable-epic-09-trust-credential-network"]),
    ("07", "mapable-epic-07-participant-orchestration-agent", "Participant Orchestration Agent", "P2", "Controlled Intelligence Wave", ["mapable-epic-02-personal-access-passport", "mapable-epic-03-navigate", "mapable-epic-08-accessible-communications-fabric"]),
    ("08", "mapable-epic-08-accessible-communications-fabric", "Accessible Communications Fabric", "P1", "Experience Wave", []),
    ("09", "mapable-epic-09-trust-credential-network", "Trust & Credential Network", "P0", "Foundation Wave", []),
    ("10", "mapable-epic-10-funding-payment-integrity", "Funding & Payment Integrity Engine", "P2", "Controlled Intelligence Wave", []),
    ("11", "mapable-epic-11-employment-accessibility-graph", "Employment Accessibility Graph", "P2", "Participation Wave", ["mapable-epic-01-access-graph", "mapable-epic-02-personal-access-passport", "mapable-epic-03-navigate"]),
    ("12", "mapable-epic-12-circular-assistive-technology", "Circular Assistive Technology Network", "P3", "R&D Wave", ["mapable-epic-09-trust-credential-network"]),
    ("13", "mapable-epic-13-access-api", "MapAble Access API", "P2", "Platform Commercialisation Wave", ["mapable-epic-01-access-graph", "mapable-epic-06-accreditation-os"]),
    ("14", "mapable-epic-14-access-observatory", "MapAble Access Observatory", "P2", "Platform Commercialisation Wave", ["mapable-epic-01-access-graph", "mapable-epic-03-navigate", "mapable-epic-11-employment-accessibility-graph"]),
    ("15", "mapable-epic-15-academy-capability-passport", "MapAble Academy + Capability Passport", "P2", "Participation Wave", ["mapable-epic-09-trust-credential-network"]),
]

GATES = [
    ("gate-g0-problem-evidence", "G0 — Problem Evidence"),
    ("gate-g1-co-design", "G1 — Disability-Led Co-design"),
    ("gate-g2-rights-review", "G2 — Rights, Accessibility & Risk Review"),
    ("gate-g3-technical-proof", "G3 — Technical Proof"),
    ("gate-g4-controlled-pilot", "G4 — Controlled Pilot"),
    ("gate-g5-evidence-to-scale", "G5 — Evidence to Scale"),
    ("gate-g6-continuous-assurance", "G6 — Continuous Assurance"),
]

PRODUCT_FEATURES = {
    "mapable-epic-01-access-graph": [
        ("canonical-accessibility-taxonomy", "Canonical accessibility taxonomy", "EXTEND"),
        ("place-feature-schema", "Place and feature schema", "EXTEND"),
        ("evidence-provenance-system", "Evidence provenance system", "EXTEND"),
        ("observation-workflow", "Observation workflow", "NEW/EXTEND"),
        ("verification-workflow", "Verification workflow", "NEW"),
        ("freshness-expiry-engine", "Freshness and expiry engine", "NEW"),
        ("correction-dispute-workflow", "Correction/dispute workflow", "EXTEND"),
        ("access-graph-read-api", "Access Graph read API (internal)", "NEW"),
    ],
    "mapable-epic-02-personal-access-passport": [
        ("passport-crud-ontology", "Passport CRUD + requirement ontology", "EXTEND"),
        ("granular-disclosure-scopes", "Granular disclosure scopes", "EXTEND"),
        ("purpose-bound-consent", "Purpose-bound consent + receipts", "REUSE/EXTEND"),
        ("sharing-controls-recipient-type", "Sharing controls by recipient type", "NEW"),
        ("access-log-participant-review", "Access log + participant review", "EXTEND"),
        ("passport-compatibility-projection", "Passport compatibility projection", "EXTEND"),
        ("non-disclosure-guardrails", "Non-disclosure guardrails", "NEW"),
    ],
    "mapable-epic-03-navigate": [
        ("suitability-routing-engine", "Suitability routing engine", "NEW/EXTEND"),
        ("evidence-aware-route-segments", "Evidence-aware route segments", "EXTEND"),
        ("uncertainty-freshness-ui", "Uncertainty + freshness UI", "NEW"),
        ("rest-toilet-recharge-waypoints", "Rest/toilet/recharge waypoints", "NEW"),
        ("temporary-barrier-ingestion", "Temporary barrier ingestion", "NEW/EXTEND"),
        ("indoor-outdoor-stitching", "Indoor/outdoor route stitching", "DEFER"),
        ("navigate-participant-ui", "Navigate participant UI", "NEW"),
    ],
    "mapable-epic-04-access-intelligence-vision": [
        ("cv-evidence-pipeline", "CV evidence proposal pipeline", "NEW"),
        ("ai-inferred-unverified-labelling", "AI INFERRED — UNVERIFIED labelling", "NEW"),
        ("human-verification-queue", "Human verification queue", "EXTEND"),
        ("community-confirmation", "Community confirmation workflow", "EXTEND"),
        ("organisation-correction", "Organisation correction workflow", "EXTEND"),
        ("assessor-validation", "Assessor validation workflow", "EXTEND"),
        ("vision-eval-harness", "Vision eval harness", "NEW"),
    ],
    "mapable-epic-05-accessibility-digital-twins": [
        ("spatial-venue-model-schema", "Spatial venue model schema", "EXTEND"),
        ("evidence-backed-twin-ingestion", "Evidence-backed twin ingestion", "NEW"),
        ("passport-compatibility-preview", "Passport compatibility preview", "DEFER"),
        ("evacuation-planning-support", "Evacuation planning support", "PROPOSED"),
        ("ar-vr-preview", "AR/VR preview interface", "EXPLORATORY"),
        ("twin-publication-workflow", "Twin publication workflow", "EXTEND"),
    ],
    "mapable-epic-06-accreditation-os": [
        ("assessment-workflow-engine", "Assessment workflow engine", "EXTEND"),
        ("assessor-assignment-identity", "Assessor assignment + identity", "EXTEND"),
        ("measurement-evidence-capture", "Measurement + evidence capture", "EXTEND"),
        ("scoring-human-review", "Scoring + human review", "EXTEND"),
        ("remediation-tracking", "Remediation tracking", "NEW/EXTEND"),
        ("publish-facts-to-graph", "Publish approved facts to graph", "EXTEND"),
        ("expiry-reassessment", "Expiry + reassessment", "NEW"),
        ("appeals-corrections", "Appeals/corrections", "EXTEND"),
    ],
    "mapable-epic-07-participant-orchestration-agent": [
        ("orchestrator-agent-shell", "Single orchestrating agent shell", "EXTEND"),
        ("typed-tools-schemas", "Typed tools + constrained schemas", "EXTEND"),
        ("propose-validate-approve-execute", "Propose → validate → approve → execute", "NEW"),
        ("cross-module-read-aggregation", "Cross-module read aggregation", "EXTEND"),
        ("approval-gates-audit", "Approval gates + audit events", "REUSE"),
        ("non-ai-fallback-planner", "Non-AI fallback planner", "NEW"),
        ("orchestration-eval-suite", "Orchestration eval suite", "EXTEND"),
    ],
    "mapable-epic-08-accessible-communications-fabric": [
        ("communication-preference-sot", "Communication preference SoT", "EXTEND"),
        ("multi-channel-adapter", "Multi-channel adapter layer", "NEW/EXTEND"),
        ("aac-plain-language", "AAC-friendly + plain-language interfaces", "NEW"),
        ("no-voice-escalation", "No-voice-required escalation", "NEW"),
        ("service-status-explain", "Service-status explain + next steps", "EXTEND"),
        ("emergency-escalation-boundaries", "Emergency escalation boundaries", "NEW"),
        ("clinical-payment-isolation", "Clinical/payment data isolation", "REUSE"),
    ],
    "mapable-epic-09-trust-credential-network": [
        ("credential-registry-lifecycle", "Credential registry + lifecycle", "EXTEND"),
        ("expiry-suspension-fail-closed", "Expiry + suspension (never silent approve)", "NEW/EXTEND"),
        ("issuer-verification-evidence", "Issuer verification + evidence", "EXTEND"),
        ("renewal-reminders-exceptions", "Renewal reminders + exception workflow", "NEW"),
        ("vehicle-driver-assessor-types", "Vehicle/driver/assessor credential types", "EXTEND"),
        ("credential-api-verticals", "Credential API for verticals", "EXTEND"),
    ],
    "mapable-epic-10-funding-payment-integrity": [
        ("pricing-explanation", "Pricing explanation layer", "EXTEND"),
        ("quote-comparison", "Quote comparison", "EXTEND"),
        ("invoice-anomaly-duplicate", "Invoice anomaly + duplicate detection", "EXTEND"),
        ("advisory-funding-language", "Advisory funding pathway language", "NEW"),
        ("participant-review-draft-questions", "Participant review + draft questions", "NEW"),
        ("reconciliation-assistance", "Reconciliation assistance", "EXTEND"),
        ("funding-integrity-evals", "Funding integrity evals", "NEW"),
    ],
    "mapable-epic-11-employment-accessibility-graph": [
        ("workplace-accessibility-profiles", "Workplace accessibility profiles", "EXTEND"),
        ("candidate-disclosure-gates", "Candidate-controlled disclosure gates", "EXTEND"),
        ("job-access-transport-compatibility", "Job ↔ access ↔ transport compatibility", "NEW/EXTEND"),
        ("adjustment-request-workflow", "Adjustment request workflow", "EXTEND"),
        ("interview-accessibility-planning", "Interview accessibility planning", "NEW"),
        ("placement-sustainability", "Placement sustainability signals", "NEW"),
        ("employer-access-improvement-loop", "Employer access improvement loop", "NEW"),
    ],
    "mapable-epic-12-circular-assistive-technology": [
        ("equipment-passport-schema", "Equipment Passport schema", "EXTEND"),
        ("trial-rental-reuse-listing", "Trial/rental/reuse listing", "NEW"),
        ("recall-warranty-tracking", "Recall + warranty tracking", "NEW"),
        ("compatibility-accessories", "Compatibility + accessories", "NEW"),
        ("clinical-suitability-guardrails", "Clinical suitability guardrails", "NEW"),
        ("servicing-collection-logistics", "Servicing + collection logistics", "DEFER"),
    ],
    "mapable-epic-13-access-api": [
        ("public-api-resource-model", "Public API resource model", "EXTEND"),
        ("provenance-confidence-responses", "Provenance + confidence in responses", "EXTEND"),
        ("rate-limiting-licensing", "Rate limiting + licensing", "NEW/EXTEND"),
        ("privacy-boundaries-no-passport", "Privacy boundaries (no Passport exposure)", "NEW"),
        ("versioning-change-history", "Versioning + change history", "NEW"),
        ("partner-onboarding", "Partner onboarding + access controls", "EXTEND"),
    ],
    "mapable-epic-14-access-observatory": [
        ("privacy-preserving-aggregation", "Privacy-preserving aggregation layer", "NEW/EXTEND"),
        ("gap-analysis-dashboards", "Gap analysis dashboards", "NEW"),
        ("route-barrier-heatmaps", "Route barrier heatmaps", "NEW"),
        ("employment-cluster-analysis", "Employment cluster analysis", "NEW"),
        ("data-coverage-metrics", "Data coverage metrics", "NEW"),
        ("no-identifiable-journeys", "No identifiable journey exposure", "NEW"),
    ],
    "mapable-epic-15-academy-capability-passport": [
        ("course-competency-catalogue", "Course + competency catalogue", "EXTEND"),
        ("competency-assessment-workflow", "Competency assessment workflow", "NEW"),
        ("capability-passport", "Capability Passport (role requirements)", "NEW"),
        ("expiry-refresher-training", "Expiry + refresher training", "NEW"),
        ("evidence-capture-assessments", "Evidence capture for assessments", "EXTEND"),
        ("worker-readiness-integration", "Worker readiness integration", "EXTEND"),
    ],
}


def main() -> None:
    epics = []
    for num, key, title, priority, horizon, deps in EPICS_META:
        features = []
        for gate_suffix, gate_title in GATES:
            features.append({
                "key": f"{key}-{gate_suffix}",
                "title": gate_title,
                "type": "stage-gate",
                "classification": "NEW",
            })
        for fkey, ftitle, fcls in PRODUCT_FEATURES.get(key, []):
            features.append({
                "key": f"{key}-feat-{fkey}",
                "title": ftitle,
                "type": "product",
                "classification": fcls,
            })
        epics.append({
            "key": key,
            "title": title,
            "priority": priority,
            "horizon": horizon,
            "dependencies": deps,
            "features": features,
        })

    out = Path(__file__).resolve().parent.parent / "azure-devops-portfolio.json"
    payload = {
        "version": "1.0.0",
        "programme": "MapAble Innovation Portfolio",
        "organisation": "Australian Disability Ltd",
        "areaPath": "MapAble\\Innovation Portfolio",
        "iterationPath": "MapAble\\Innovation",
        "workItemTypeEpic": "Epic",
        "workItemTypeFeature": "Feature",
        "epics": epics,
    }
    out.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(f"Wrote {out} ({len(epics)} epics)")


if __name__ == "__main__":
    main()
