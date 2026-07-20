# NDIS Expansion — Regulatory Gate Matrix

**Status:** Wave 0 documentation — not legal advice  
**Public claim:** MapAble does **not** claim NDIS registration, NDIA API access, or
Managed Support delivery on the strength of this document.

## Gate statuses

| Status | Meaning |
|--------|---------|
| open | No regulatory/external blocker for scaffolded Connect/Infrastructure work behind flags |
| partner | Requires partner clinical/provider governance; MapAble coordinates only |
| blocked | Must not enable or claim until evidence exists |
| permanent_prohibit | Product must not automate even after other gates clear |

## Matrix

| Concern | Systems affected | Status | Evidence required before enablement |
|---------|------------------|--------|-------------------------------------|
| MapAble as registered NDIS provider | Managed Support lane; any direct delivery claims | **blocked** | Registration certificate, workforce, insurance, complaints, safeguarding capacity |
| MapAble Network facilitation | Provider discovery, quotes, agreements | open (flagged) | Accurate registered/unregistered disclosure; no Managed Support language |
| Live NDIA / PACE claim submission | Plan Management (Wave 10) | **blocked** | Formal NDIA authorisation + security review + adapter contract |
| Automated claim or payment approval (incl. AI) | Plan Management, Billing | **permanent_prohibit** | N/A — human plan-manager / finance approval required |
| NDIS Commission behaviour support portal submission | PBS (Wave 7) | **blocked** | Authorised practitioner + provider registration + portal credentials |
| Restrictive practice authorisation | PBS | **partner** / **blocked** for automation | State/territory authorisation evidence; human practitioner only |
| Functional behaviour assessment | PBS | **partner** | Suitable practitioner; AI must not conduct FBA or conclude function |
| Professional AT clinical suitability | AT Continuity (Wave 1) | **partner** | External assessment reference only; MapAble must not certify suitability |
| SIL / SDA eligibility determination | Home & Living (Wave 4) | **blocked** for MapAble decisioning | External determination; MapAble navigates options and records participant choice |
| Dwelling enrolment claims | Home & Living | **blocked** without verified evidence | Verified external enrolment evidence — never marketing copy alone |
| Plan management as MapAble service | Wave 10 | **blocked** for direct MapAble PM | Registration + conflict-of-interest separation; initial position is Infrastructure for registered PMs |
| Allied health prescribing / therapy alteration | Wave 9 | **partner** / **permanent_prohibit** for MapAble alteration | External assessor remains author of clinical recommendations |
| Building compliance certification | Home modification | **partner** | Builder/assessor/permits — MapAble tracks evidence references only |
| Emergency dispatch / 000 replacement | AT outage, psychosocial, PBS | **permanent_prohibit** | Participant-authored instructions only; human escalation pathways |
| Worker auto-assignment / auto-clearance | Workforce Assurance (Wave 5) | **permanent_prohibit** | Provider remains responsible; reason-coded readiness only |
| Participant / worker / provider worthiness scores | Workforce, Regional | **permanent_prohibit** | Unknown stays unknown; no ranking by worth |
| Child data for advertising or model training | Early Childhood (Wave 8) | **permanent_prohibit** | Strict purpose limitation |
| Regional national expansion | Wave 11 | **blocked** until one-region ops proven | Regional SLOs, redundancy, privacy thresholds, human ops |
| Historical Prisma migration rewrite | All product waves | **blocked** | Account-owner `_prisma_migrations` checksums from every persistent environment |
| Feature freeze new domains | Waves 1–11 product DDL | **blocked** until freeze lift/waiver | [FEATURE_FREEZE.md](../remediation/FEATURE_FREEZE.md) |

## Operating-lane claim rules

| Lane | May be described as | Must not be described as |
|------|---------------------|--------------------------|
| Connect | Participant tools / navigation / evidence | Registered support delivery |
| Network | Facilitation between participants and independent providers | MapAble delivers the support |
| Managed Support | Unavailable / unsupported until registration proven | Live, offered, or “coming soon” as if authorised |
| Infrastructure | SaaS for registered partners (e.g. plan managers) | MapAble performing partner’s regulated function without disclosure |

## AI artefact disclosure (minimum)

Every AI-assisted artefact in this programme must state:

1. It is a draft
2. Sources used
3. Missing information
4. Uncertainty
5. Required human approver
6. Actions AI is prohibited from taking

## Related

- [OPERATING_LANES.md](../strategy/OPERATING_LANES.md)
- [BUILD_PARTNER_DEFER.md](../strategy/BUILD_PARTNER_DEFER.md)
- [NDIS_EXPANSION_MASTER_PLAN.md](./NDIS_EXPANSION_MASTER_PLAN.md)
