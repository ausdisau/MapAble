# MapAble Four-Lane Operating Model

**Status:** documentation / claim discipline (not a registration certificate)  
**Public claim:** none — lanes describe packaging boundaries, not live registration status.

MapAble must never blend these lanes ambiguously in UI, contracts, or marketing.

## Lane 1: MapAble Connect

Participant-controlled planning and coordination.

Includes: Communication Passport; functional access requirements; journey planning;
AccessCast; Visit Packs; Companion; participant outcomes; complaints; portability;
human navigation.

| Dimension | Rule |
|-----------|------|
| Terms | Participant coordination terms |
| Worker relationship | None (tools and facilitation) |
| Insurance | Platform product liability only |
| Incident owner | Platform product + participant concierge |
| Complaint pathway | Platform complaints; escalate to Q&S where required |
| Payment flow | Subscription/coordination fee only where lawful — never sells consent |
| Registration | Directory/coordination tooling; does not itself deliver personal support |
| Public capability state | Flagged / pilot per capability registry |

## Lane 2: MapAble Network

Governed platform connecting participants with independent providers and workers.

Includes: provider discovery; capacity; quotes; agreements; worker readiness; transport;
service evidence; billing facilitation; recovery orchestration.

| Dimension | Rule |
|-----------|------|
| Terms | Network marketplace / facilitation terms |
| Worker relationship | Provider-employed or independent contractor (not MapAble-employed) |
| Insurance | Provider/worker primary; platform facilitation cover as advised |
| Incident owner | Delivering provider (platform facilitates reporting) |
| Complaint pathway | Provider first; platform escalation and audit |
| Payment flow | Transparent marketplace / processing fees where lawful |
| Registration | Platform registration likely required — specialist legal advice |
| Public capability state | Pilot / production_gated per capability; never “Managed Support” |

## Lane 3: MapAble Managed Support

Directly delivered regulated services through a **separately governed** provider operation.

Includes **only** services for which MapAble has: required registration; qualified workforce;
insurance; supervision; complaints capability; safeguarding; clinical governance where
relevant; operating capacity.

| Dimension | Rule |
|-----------|------|
| Terms | Registered provider service agreement |
| Worker relationship | MapAble-employed or supervised |
| Insurance | Provider entity insurance |
| Incident owner | MapAble provider entity |
| Complaint pathway | Provider complaints officer + NDIS Commission paths |
| Payment flow | Provider claiming / invoicing |
| Registration | **Blocked until registration and capacity exist** — do not fabricate |
| Public capability state | unsupported until authorised |

## Lane 4: MapAble Infrastructure

Products for providers, councils, venues, employers, transport operators, equipment
organisations, plan managers, and software partners.

Includes: Provider Operations; Venue Access Studio; AccessCast widgets; Academy;
Regional Capacity; Developer Platform; evidence-to-payment tooling; public accountability.

| Dimension | Rule |
|-----------|------|
| Terms | SaaS / API / civic contract terms |
| Worker relationship | Customer organisation staff |
| Insurance | SaaS / professional indemnity as advised |
| Incident owner | Customer for their delivery; MapAble for SaaS SLAs |
| Complaint pathway | Customer + MapAble SaaS support |
| Payment flow | Subscription, API, implementation, consortium contracts |
| Registration | Generally low for SaaS; activity-specific advice still required |
| Public capability state | Per product maturity in capability registry |

## Hard separations

- Connect ≠ Network ≠ Managed Support ≠ Infrastructure.
- Network facilitation language must never imply MapAble delivers the support.
- Managed Support must never be marketed while registration status is unsupported.
- Provider Operations (Infrastructure) is a **read-only** attention projection — never a second operational writer.
- Payment must never improve accessibility conclusions or compatibility ranking.

## Related

- [COMPETITIVE_POSITION.md](./COMPETITIVE_POSITION.md)
- [BUILD_PARTNER_DEFER.md](./BUILD_PARTNER_DEFER.md)
- [STRATEGIC_OPPORTUNITIES.md](./STRATEGIC_OPPORTUNITIES.md)
- Capability registry: `lib/convergence-os/seed/capabilities.ts`
- Public claims: `docs/convergence-os/PUBLIC_CLAIM_REGISTRY.md`
