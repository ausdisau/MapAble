# MapAble Signal Community — TypeScript Forums + Survey Studio v0.1

**Decision:** Extend MapAble's existing PEERS and Access boundaries into one accessible community workflow. Use bbPress-style topics/replies and LimeSurvey-style question groups and branching in native TypeScript. This is not a PHP code port and does not claim complete feature parity.

**State: 9 November 2026:** Implemented in a review branch, not live. Default-off, synthetic/local-only, no external submissions or verified access claims.

## Sources and evidence

- FormHug: **MapAble | Community Accessibility Survey (pilot)**, published at https://formhug.ai/f/f50pAQ. Its real 34-element schema, four conditional rules and public form URL were read through connected FormHug. There were **zero submissions** at inspection. Only schema metadata was copied into the code, never respondent data or uploads.
- Different form **BRXNVn** belongs to the NDIS Trust and Inclusion research project and must not be mixed with access observations.
- MapAble PEERS: `apps/web/lib/community/mapable-peers/rooms.ts` defines the canonical `access-and-places` room. Do not create a second live community identity or room authority.
- MapAble Core: NextAuth user, ConsentRecord, participant delegation, audit and complaints handling are existing shared controls.
- MapAble Access: AccessPlace, AccessObservation, evidence provenance, correction, review and RAGU remain canonical for accessibility claims.
- MapAble Day: future optional mapping participation may be displayed after participant consent and suitability review, without scheduling or transport writes.
- bbPress references: https://bbpress.org/about/features/ and https://codex.bbpress.org/moderation-and-blacklisting/.
- LimeSurvey references: https://www.limesurvey.org/manual/Question_groups_-_introduction/en and https://www.limesurvey.org/manual/QS:Relevance/en.
- RAGU framework: https://docs.google.com/document/d/1-VNcrJ4N_TEf3kjXYt1Wls0ij_-Nv9e9QTIlFiYTan4/edit — working draft methodology only, not certification.

## Implemented feature slice

- Route: `/signal/community`. Server gate requires `MAPABLE_SIGNAL_COMMUNITY_DEMO_ENABLED=true` plus a local development environment or an explicit Vercel Preview environment. Production domain returns 404, even if the flag is accidentally set.
- Forum: two fictional conversation examples plus locally drafted topics/replies, simple chronological context, AAC phrase buttons, search and simulated moderation. Existing PEERS room remains authoritative for any eventual real posting.
- Survey: four sections generated from FormHug schema; question codes, choices, required fields, branching, progress, error handling, consent refusal, back/next and clear/withdraw are implemented.
- Local summary: participant-triggered JSON export deliberately redacts free text, contact email, media and coordinates; always reports `Unknown`, unverified and unpublished.
- Media, voice recordings, precise locations and email fields are disabled. Original published FormHug survey remains a separate voluntary choice.
- Review: local-only queue and in-memory event log. This is not a persistent Core AuditEvent or an authenticated real moderator service.
- Access: no rating, public venue record, verified route or accreditation change.
- All source text rendered as React text, not untrusted raw HTML.

### Source files

```text
apps/web/
  app/signal/community/page.tsx
  components/signal/
    SignalCommunityStudio.tsx
    SignalForumPanel.tsx
    SignalSurveyPanel.tsx
  lib/signal/community/
    types.ts
    formhug-schema.ts
    engine.ts
  tests/signal-community/signal-community.test.ts
.github/workflows/mapable-signal-community-validation.yml
```

## FormHug rules and safety mapping

| Field | Meaning | Protection |
| --- | --- | --- |
| `field_3` | Internal review consent | No => abort; Yes never implies public publication |
| `field_4` | Place or connected journey | Journey only => show start/end fields 14/15 |
| `field_16` | Optional public-place pin choice | Yes => show field 17; location capture disabled locally |
| `field_19` | Main accessibility feature | One scoped feature, not whole-place rating |
| `field_20` | Experience of use | Report, not automatically Red/Amber/Green |
| `field_24` | Possible urgent hazard | Future real intake requires staffed human escalation |
| `field_26/27` | Evidence method and measurement | Number only with measured-with-a-tool source |
| `field_28/29` | Documents/photos and audio | Not collected in local preview |
| `field_31` | De-identified public reporting | Yes means future consideration only; no automatic publishing |
| `field_32/33` | Follow-up and email | Conditional email not collected in local preview |

The survey's conditional rules must hide non-relevant answers and strip hidden values before any review. Users can abandon or withdraw without sending data. Unknown means not assessed, not that an entire place is inaccessible or safe.

## Future durable backend contract — NOT implemented

- ForumTopic, ForumReply, TopicRevision, ModerationDecision, Subscription and Appeal belong under MapAble PEERS, authorised with Core roles and explicit scopes; do not create an unrelated PHP/WordPress identity silo.
- SurveyDefinitionVersion stores FormHug token, field codes, group ordering, relevance rules, consent wording, version/checksum and licensing.
- SurveySubmissionRef points to a FormHug entry identifier and version after signed/replay-safe webhook intake; respondent data stays restricted, encrypted and purpose-limited. FormHug has no webhook configured on this survey at inspection.
- AccessEvidenceCandidate references a narrowly defined place, micro-space, feature, method, source/date, consent, disputed state, correction history, media rights and review; it is not a public `AccessObservation` until explicit qualified human approval.
- Core ConsentRecord and Core AuditEvent remain the only central consent and audit authorities.
- Day may display a participant-selected reviewed planning hint, but never automatically book care, worker or transport services.

### Ingestion safety gates

1. Verify FormHug webhook authentication, signature/replay protection and ownership using current provider documentation; do not invent a signature header.
2. Enforce exact form token `f50pAQ` and schema-version mapping; quarantine unknown fields, unexpected types, identifiers, files and contact details.
3. Enforce explicit internal-review consent, separate map pin permission, separate de-identified publication consideration, and optional follow-up choices; consent to consider publication is not approval.
4. Minimise personal data, verify licence/retention and require authorisation for any external storage or analytics.
5. Human triage for urgent hazards, public-location accuracy, contested evidence, harassment and corrections. Do not publish personal routes or private addresses.
6. Only after human sign-off should canonical Access evidence and versioned RAGU rules be allowed to update appropriate scoped public claims; never infer Green from missing barrier reports.
7. Support consent withdrawal, correction, appeal and human contact through accessible Core pathways.

## Release acceptance

- [ ] Targeted Vitest, TypeScript check and scoped ESLint pass on the current GitHub PR head.
- [ ] Keyboard, switch, VoiceOver, NVDA/JAWS, AAC, voice control and 200–400% zoom/reflow co-design.
- [ ] Robust focus and live-region status announcements, clear form errors and save-and-return policies for future real submissions.
- [ ] No hidden conditional answers survive sanitisation, no email/photo/location enters public report.
- [ ] No public discussion, registered survey submission, access rating or authentication state is changed by the demo.
- [ ] Real moderation, spam prevention, anti-retaliation complaints, contributor support, threat model and incident response designed before live activation.
- [ ] Formal user and privacy approval for FormHug response ingestion, sensitive data residency, licence and auditing.
- [ ] No production deployment or database changes without human-reviewed release approval.

## Rollback

Keep the feature flag off to hide the route. The standalone new app route, components, pure domain code, tests and CI workflow can be removed without changing the existing PEERS service, Core consent, FormHug submissions, Access evidence or Day.
