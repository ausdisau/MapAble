# MapAble integration decision — Access and Inclusion is the real AI

Date: 9 November 2026. Status: DRAFT. No production deployment, mailing or research approval.

## Basis and source hierarchy

- Canonical source: https://github.com/ausdisau/MapAble (Next.js application at apps/web).
- Older production-relevant repository: https://github.com/ausdisau/mapableau-new. Existing Vercel team projects linked to this older repo at inspection; never repoint production domains in this PR.
- MapAble Access Signals working draft: https://docs.google.com/document/d/1-VNcrJ4N_TEf3kjXYt1Wls0ij_-Nv9e9QTIlFiYTan4/edit
- FormHug community pilot: https://formhug.ai/f/f50pAQ.
- Research-draft trust index, owner-supplied script: https://formhug.ai/f/BRXNVn/embedded.js?inner_redirect=false&banner=show&height=2441.
- Uploaded campaign_brief.md, Protect Our NDIS, 3 October 2026: proposed campaign, not published. Recheck legislation, current deadlines, permissions and electoral/charity requirements before live claims.
- Australian Disability Ltd 2026 and Beyond Vision: PalsyPod is a proposed disability-led cerebral-palsy podcast exploring medical, personal and political perspectives. A full approved PalsyPod Strategy was not located.

## Separation and privacy

1. Community survey reports physical or communication access to places and journeys. Trust Index asks about NDIS service and policy experiences. Never merge respondent identities or datasets.
2. Third-party FormHug JavaScript loads after a visitor clicks an explicit button. Use external direct-link fallback when the embedded experience fails or is inaccessible.
3. Research recruitment is disabled by default: only the exact server variable MAPABLE_TRUST_INDEX_RECRUITMENT_APPROVED=true enables its public embed. No release approval is conveyed by the existence of the form or this PR.
4. FormHug hosts initial response processing for the survey operator; no MapAble platform ingestion, file upload copy, data sync or public map publication is implemented. The operator must verify FormHug data terms and access controls.
5. To publish access observations later, implement a consent-scoped review service with provenance, dates, correction/dispute states, data minimisation, expiry and human approval. Unknown is never automatically Green, and N/A is never scored as failure.
6. Marketing opt-in is separate from survey participation. No FormHug-to-Mailchimp export, no profiling by disability/diagnosis/NDIS status, and no automatic political audience targeting. PalsyPod appearances require separate participant permission and editorial confirmation.
7. Privacy, data residency, retention/deletion, contact and withdrawal statements must be independently approved. No blanket promise is made about FormHug's hosting or legal compliance.

## Cursor integration handoff

- Open the canonical ausdisau/MapAble repository, not mapableau-new.
- Review this feature branch, install from the existing pnpm lockfile, and run targeted unit tests, lint and TypeScript checks.
- Test actual FormHug embedded.js behaviour in a protected browser; run screen-reader, switch, AAC, keyboard, zoom/reflow, mobile touch and offline/failure tests. FormHug's script is external and can change outside this repository.
- Inspect CSP scripts and frames for FormHug; current baseline is report-only, and enforcement may require scoped additional work.
- Leave participant data, real exports, Mailchimp contacts and publishing credentials out of test fixtures.

## Vercel integration handoff

- Use team MapAble / mapableau. Verified existing Vercel projects called mapableau and mapableau-new point at older repository ausdisau/mapableau-new.
- For a canonical source preview, create a separate permissioned Git-linked project with rootDirectory apps/web; do not reuse, overwrite or redirect an existing production project.
- Require protected preview, passing checks, verified commit SHA and human release review before any production domain changes.
- Keep research gate OFF everywhere until a documented governance decision; do not introduce a NEXT_PUBLIC version of the flag.
- The new routes are implementation draft only; they have not yet been tested on deployed hardware or by disabled co-testers.

## Mailchimp and campaign draft

Working unapproved theme: Access and Inclusion is the real AI.
Subject idea: Access and Inclusion is the real AI.
Preview idea: Real accessibility begins with lived experience, clear evidence and choice.
Suggested public general-audience CTA: Community Accessibility Survey — only after reviewing its preview, privacy, accessibility, moderation and participation information.
PalsyPod editorial idea: When is technology actually accessible? A guest-led episode about community journeys, AAC, consent and dependable support.
Protect Our NDIS policy material remains a separate advocacy series and needs fresh source and governance checks before any publication or send.

Status: no Mailchimp campaign created or sent. There are multiple connected Mailchimp account references, so targeting one would require explicit account selection; no contact-level data or segmentation is used.

## Acceptance and rollback

- Human reviewer confirms both FormHug form owners, terms, privacy and research recruitment scope.
- WCAG 2.2 AA target plus keyboard, screen reader, 200–400% zoom/reflow, AAC, switch and mobile testing pass.
- Source/date/scope, independent reviewer, corrections and de-identification are governed before any public accessibility signals.
- GitHub checks pass; Vercel preview is protected; actual app bundle and commit SHA are verified.
- Do not merge, set production domain, send marketing or enable research gate without human approval. Roll back by reverting this branch, not by deleting participant responses.
