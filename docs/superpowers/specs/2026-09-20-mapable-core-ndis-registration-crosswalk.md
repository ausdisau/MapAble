# MapAble Core — NDIS Registration and Policy Crosswalk

**Status:** Compliance design crosswalk; not proof of registration or legal compliance  
**Date:** 2026-09-20  
**Repository branch:** `architecture/centralised-mapable-core-control-plane`

## Purpose

This crosswalk aligns the Centralised MapAble Core control plane with:

- current NDIS Commission registration requirements;
- the NDIS Practice Standards Core Module;
- registration group 0137 digital-platform requirements;
- worker-screening obligations;
- additional 0107 personal-support conditions where that registration group applies;
- the MapAble NDIS Policy & Procedures Manual;
- existing MapAble QMS and operational services.

It distinguishes legal/regulatory requirements from internal policy, implementation evidence and future controls.

## Source hierarchy

| Source | Role | Status in this design |
| --- | --- | --- |
| NDIS Commission / current Provider Registration Rules and conditions | External authority | Governing requirement |
| Certificate of Registration / Initial Scope of Audit | Entity-specific authority | Required when available; current MapAble registration status not independently verified here |
| MapAble NDIS Policy & Procedures Manual | Internal controlled policy | Implementation intent; must be versioned/approved/acknowledged |
| Existing repo/QMS controls | Technical/operational evidence | Evidence of implementation only |
| Historical NDIS Provider Registration Plan | Planning material | Must be revised where superseded, particularly by 0137 changes |

## Current regulatory facts to design against

1. NDIS digital platforms that meet the current definition require registration from **1 July 2026**.
2. Registration group **0137 — Providing an NDIS digital platform service** requires a **certification audit** and the NDIS Practice Standards Core Module.
3. New 0137 registration conditions apply from **1 January 2027**, including:
   - valid NDIS worker screening clearance before a person offers NDIS supports through the platform; no "work on application" for these platform workers;
   - checking/displaying whether specified NDIS/aged-care banning orders are in force;
   - checking/displaying credentials or qualifications and explaining the checking process.
4. Registered providers must identify and keep records of risk-assessed roles and worker-screening information; current Commission guidance requires worker records to be organised, accessible, legible and retained for seven years.
5. 0107 has additional conditions where a participant living alone receives personal support from a sole worker.

## Obligation-to-system crosswalk

| Obligation / policy domain | Internal policy intent | Current MapAble implementation | Core amendment | Evidence / audit output | Gap / gate |
| --- | --- | --- | --- | --- | --- |
| Governance & operational management | Board/KP accountability, delegated authority, conflicts, controlled QMS | Organisation/auth, audit, QMS | compliance dashboard + work queue + evidence pack | board/management review refs, audit events, corrective actions | Human governance owner required |
| Risk management | Risk register and treatment | Domain risk services + QMS findings | central risk-related work projections only | QMS findings/actions and source refs | Do not create participant/provider risk scores |
| Quality management / CI | Internal audits, document control, CI register | `QualityAuditPlan`, findings, corrective/improvement history | QMS becomes compliance evidence spine | versioned framework/evidence/policy/training records | `MAPABLE_QUALITY_QMS_ENABLED` remains gated |
| Information/privacy | Purpose, access, retention, breach response | consent/auth/audit/domain controls | minimum-data Core projections, scoped exports | consent/audit evidence and access receipts | Retention schedule must be approved |
| Complaints | accessible, fair, non-retaliatory process | engagement submissions/events/improvement actions | complaint work projection + SLA/escalation view | complaint timeline + CI linkage | Core cannot suppress/resolve without domain process |
| Incidents | identify, record, respond, report where required, learn | `IncidentReport` + `lib/incidents/**` | incident work projection + human compliance escalation | incident timeline, reportability review, corrective actions | Core does not make autonomous reportability decisions |
| Human resources | recruitment, supervision, role capability, training | worker profiles, QMS training/policy acknowledgement | HR evidence view and work items | policy/training records | competency != screening |
| Worker screening | risk-assessed roles and clearance records | credential primitives exist; exact canonical screening record needs implementation-time inspection | authorised screening adapter + restricted register + freshness | role register, clearance evidence, verification timestamps | No public-web substitute for NWSD/state source |
| Provider registration | current registration/groups/conditions | provider/domain structures; no Core registration context | explicit `NdisRegistrationContext` + Provider Register adapter | certificate/scope evidence and verified registration snapshot | Status must never be inferred |
| 0137 worker clearance | valid clearance before offering platform support from 1 Jan 2027 | not yet a Core platform gate | deterministic offer-eligibility gate | eligibility decision + source freshness + reason codes | Release blocker |
| 0137 banning orders | check/display specified banning-order status | no verified current Core control found | authorised source adapter + display projection | check result, source, timestamp | Release blocker from 1 Jan 2027 |
| 0137 credentials | check/display credentials/qualifications + checking process | worker credentials exist | provenance/freshness projection | credential verification refs | Unknown/stale stays unverified |
| 0107 sole-worker/living-alone | enhanced risk and monitoring | `CareLivingAloneSafeguard` present in current schema/docs | registration-condition view + QMS evidence | risk assessment/agreement/satisfaction/supervision/communication refs | Only when 0107 is actually approved/in scope |
| Continuity | participant-agreed alternatives and continuity | Care/Transport continuity primitives | continuity work-item projection | interruption, alternative, participant decision, outcome | human escalation for health/safety impact |
| Training / orientation | mandatory and role-specific training | `TrainingRequirement`, `TrainingCompletionRecord`, engagement worker training | one audit view; no silent equivalence to competency | completion, expiry, acknowledgement | reconcile duplicate training domains carefully |
| Audit evidence | Stage/audit evidence must show policy implemented | QMS, AuditEvent, domain records | scoped evidence-pack service | immutable/versioned evidence refs | Document existence != compliance |
| Deployment/IT controls | internal privacy/security/data controls | Vercel + GitHub + app controls | deployment-evidence adapter | commit, deployment ID, environment, tests, rollback | infrastructure evidence only |

## API and moderation implications

Core v1 APIs must preserve the boundary:

```text
Official / authorised evidence
        |
        v
Typed verification adapter
        |
        v
Deterministic policy check
        |
        +--> allow / block / manual review
        |
        v
Domain service
        |
        v
AuditEvent + QMS evidence + AdminWorkItem
```

An LLM or MCP agent may explain or prepare a review, but may not turn an unverified worker/provider into a verified one.

## Public display policy

A public/provider-facing listing may show only the minimum evidence needed for the service:

- provider registration status/group with source and freshness;
- platform-worker clearance state required by the applicable 0137 condition;
- required banning-order information;
- verified credential/qualification status and checking-process explanation.

Restricted worker-screening records stay private. Do not expose check/application numbers, DOB, home address, misconduct allegations or internal risk notes.

## Provider finder and worker screening separation

The NDIS Provider Register / Provider Finder is suitable for registered-provider facts. It does not establish worker screening, availability, competence or participant fit.

Worker screening status requires the NDIS Worker Screening Database or the relevant authorised jurisdictional process.

These sources must not be collapsed into one "verified provider" score.

## External data and AI development sources

- **Healthcare Public Data:** the connected CMS Open Data source is U.S. Medicare data. It is useful as an example of source/version/provenance metadata, but it is not Australian NDIS compliance evidence.
- **Hugging Face:** external model/dataset repositories are not NDIS authorities. The connector was unavailable in this session; no Hugging Face result is relied on in this crosswalk. Future evaluation datasets should be synthetic or lawfully de-identified and licence-reviewed.
- **API/MCP training:** educational material can support developer capability, but does not satisfy an NDIS audit requirement. MapAble agent tools should still be typed, least-privilege and covered by tool-call evals.

## Vercel operating controls

Use Vercel environment scoping and deployment/audit evidence to support MapAble's information-management and operational controls:

- secrets stored as sensitive environment variables, not source code;
- production/preview/development configuration reviewed separately;
- preview automation bypass secrets stored in CI secret stores;
- runtime logging configured to avoid sensitive participant/worker content;
- deployment IDs/commit SHAs captured in release evidence;
- Vercel audit-log references/drains used where available for infrastructure change evidence.

These are technical controls supporting the QMS; they do not establish NDIS compliance by themselves.

## Current decision gates

Do not enable or publicly claim the Core as NDIS-registration ready until:

1. MapAble's legal entity and actual registration status/pathway are verified;
2. whether the operating model falls within the 0137 definition is confirmed against current rules;
3. the applicable registration groups and conditions are evidenced from the Commission/certificate;
4. QMS obligations map to current controlled policies and operational evidence;
5. worker-screening and risk-assessed-role records are audit-ready;
6. the 0137 worker/banning-order/credential gate is implemented and tested before 1 January 2027;
7. 0107 condition workflows are tested if 0107 is approved/in scope;
8. incident, complaint, continuity and continuous-improvement evidence is reviewable;
9. deployment/privacy/accessibility/tenant-isolation evidence passes;
10. a human compliance owner and appropriate external auditor/legal adviser have reviewed unresolved regulatory interpretations.

## Official sources reviewed 20 September 2026

- NDIS Commission — Mandatory registration and transition pathways for NDIS digital platforms: https://www.ndiscommission.gov.au/about-us/ndis-commission-reform-hub/mandatory-registration/mandatory-registration-digital
- NDIS Commission — Registration groups or classes of support: https://www.ndiscommission.gov.au/provider-registration/apply-registration/registration-groups-or-classes-support
- NDIS Commission — Apply for registration: https://www.ndiscommission.gov.au/provider-registration/apply-registration
- NDIS Commission — Worker screening for registered providers: https://www.ndiscommission.gov.au/workforce/worker-screening/worker-screening-registered-providers
- NDIS Commission — Core module: Provider governance and operational management: https://www.ndiscommission.gov.au/rules-and-standards/ndis-practice-standards/core-module-provider-governance-and-operational
- NDIS Commission — Registration conditions for 0107: https://www.ndiscommission.gov.au/provider-registration/about-registration/registration-conditions-personal-support-providers
- NDIS Commission — Find a registered provider: https://www.ndiscommission.gov.au/provider-registration/find-registered-provider
- NDIS — Provider Finder: https://www.ndis.gov.au/participants/working-providers/finding-providers/provider-finder
