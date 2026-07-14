# CareOS authority model

CareOS authority follows `docs/careos/identity-and-authority.md` and `docs/careos/CONSENT_AND_AUTHORITY.md`.

## Layers

| Layer | Question answered |
|-------|-------------------|
| **Identity** | Is this the authenticated person? (NextAuth + MFA/step-up) |
| **Membership** | What org/role context applies? (coarse permissions) |
| **Authority** | May this actor act for this participant in this domain now? |
| **Consent** | Was purpose-specific consent recorded? |

## Rules

1. Participants always hold self-authority over their data.
2. Delegates require explicit **ParticipantAuthorityGrant** — membership never implies participant data access.
3. Financial and clinical domains require separate grants; blocked at delegate invitation time.
4. Service accounts cannot hold participant authority.
5. Every evaluation produces an **AuthorityDecision** audit record.

## CareOS action tokens

Consequential actions (future L3) require:

- Participant-bound confirmation token
- Payload hash binding
- Policy version and expiry
- One-time use verification

Current production ceiling is L2 (recommendations only).

## Emergency access

Break-glass requests require platform admin human review with minimum justification length. No AI approval path.

## Mission linkage

When Task A completes, missions reference `authorityDecisionId` where fabric fields apply — authority decisions remain auditable independently of mission graph state.
