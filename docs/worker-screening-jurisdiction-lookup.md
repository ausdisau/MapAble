# MapAble worker-screening jurisdiction navigator — 2 November 2026

**Status:** public information and a restricted prototype; no individual screening database or clearance integration.

## Sources and scope
- VIC: https://www.vic.gov.au/ndis-worker-screening-check — Victoria's NDIS Check uses Service Victoria and no-clearance-no-start for a risk-assessed role subject to detailed exceptions; the Victorian Working with Children Check remains distinct.
- ACT: https://www.accesscanberra.act.gov.au/business-and-work/working-with-vulnerable-people/wwvp-and-the-ndis — ACT WWVP application may include NDIS clearance; cards show an NDIS ACTIVITIES indicator. The official page specifies exceptions, interstate status and pre-2021 registrations requiring case-specific review.
- QLD: https://www.workerscreening.qld.gov.au/ — Queensland 'no card, no start' for initial required clearance; combined Blue Card application may apply for child-related work. An already cleared worker submitting a valid renewal before expiry may continue while it is assessed, subject to current rules.
- WA: https://www.wa.gov.au/organisation/department-of-communities/ndis-worker-screening-check and https://www.wa.gov.au/organisation/department-of-communities/applying-ndis-check — Department of Communities and DoTDirect; alternate identity lodgement may be available.
- NSW: https://ocg.nsw.gov.au/ndiswc and https://www.service.nsw.gov.au/transaction/ndiswc-check-status — own NSW application/credential, not employer verification.
- National: https://www.ndiscommission.gov.au/workforce/worker-screening — authorised database status and jurisdiction routing. Registered/deregistered provider screening uses new Commission Portal from 12 October 2026; unregistered providers and eligible participants use existing pathways.

## Implemented in PR
Independent default-OFF /worker-screening/lookup page guarded by MAPABLE_NDISWC_GUIDE_ENABLED=true; role selector and state/territory selector covering NSW, VIC, ACT, QLD, WA, SA, TAS, NT; fixed public government links; separate NSW application/national worker-screening terminology; explanatory content, larger-font option and accessibility-conscious controls. The application gathers no name, clearance number, DOB, credentials, employer ID or health information. All personal verification stays with the government portal and its authorised human user.

## Evidence boundaries
- The feature is NOT connected to state systems or the national NDIS Worker Screening Database. CURRENT SCREENING STATUS = NOT INDEPENDENTLY VERIFIED at all times.
- Provider registration or ABN in the NDIS Commission bulk CSV is an *organisation-level fact*, not a worker clearance. No automatic employer-worker relationship can be derived from the CSV.
- Existing MapAble internal 'verified worker' badges based on profile flags require a separate audit: do not turn them into regulatory NDISWC clearance evidence.
- Applicant status 'Pending verification' and national status 'Pending' are different. Retain Clearance, Pending, Interim bar, Exclusion, Suspension and No valid clearance without collapsing to a safety score.
- The law on starting work, continuing on renewal, interstate clearances and child/vulnerable person duties is state and role dependent. No universal permission-to-work determination is made here.

## Privacy and inclusion
No worker records, uploads, government portal automation, OAuth tokens, credentials, external agent communications, or participant data processing. Consent and supporter roles do not grant automatic legal authority. Provide a human channel and AAC-compatible navigation. Complete WCAG 2.2 AA testing with keyboard, switch access, 320px reflow, 400% zoom, NVDA/VoiceOver/TalkBack, AAC and disabled-person usability testing before public release. Automated DOM tests only establish preflight behaviour, not conformance.

## Release
ALLOW_WITH_SAFEGUARDS for synthetic developer-only UI and public-source guidance; HOLD deployment/public release until CI, accessibility/manual review, copy review of local legal exceptions and explicit human approval. The government sites remain the authoritative place to get a worker's actual status. For a future genuine machine-to-machine clearance lookup, first obtain a published authorised integration contract from the NDIS Commission; never scrape restricted accounts.
