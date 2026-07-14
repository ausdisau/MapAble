# Identity and authority

CareOS separates **who you are** (identity), **where you belong** (membership),
and **what you may do** (authority). NextAuth remains the primary sign-in
mechanism; the identity and authority layer adds participant-controlled
delegation, consent receipts, and auditable access decisions on top of it.

## Identity

**Identity** is the authenticated person using MapAble — verified through
NextAuth (email/password, OAuth, or passkey). Identity services track:

- MFA enrolments (SMS or passkey)
- Trusted devices
- Active sessions (with user-initiated revoke)
- Login audit history
- Step-up challenges for sensitive actions

Identity answers: _“Is this really you, and is your session still valid?”_

NextAuth is **retained** as the session provider. CareOS does not replace
NextAuth; it extends it with explicit session records, device trust, and
step-up verification when `MAPABLE_STEP_UP_AUTH_ENABLED=true`.

## Membership

**Membership** is organisational context — which tenant, provider, or role
assignments apply to a signed-in user. A user may be a participant, support
coordinator, plan manager, or platform admin. Membership determines navigation
and coarse permissions; it does **not** automatically grant access to a
participant’s personal data or decision rights.

Membership answers: _“What kind of user are you in this organisation?”_

## Authority

**Authority** is participant-scoped permission to act on someone’s behalf in a
specific **domain** (e.g. bookings, engagement) for defined **actions** and
**consent scopes**, with an expiry date. Key rules:

- Participants always have authority over their own data (`self_authority`).
- Delegates require an explicit **ParticipantAuthorityGrant** — nothing is
  inherited from membership or a generic invite.
- **Financial** domains (`finance`, `abilitypay`, `payments`) and **clinical**
  domains (`clinical`, `home_living_clinical`, `safeguarding`) never inherit
  from delegate invitations; they need separate explicit grants.
- Service accounts cannot hold participant authority.
- Every evaluation produces an **AuthorityDecision** audit record (allow/deny).

Authority answers: _“May this person perform this action for this participant
right now?”_

## Consent receipts

Consent is recorded as **ConsentReceipt** entries — a timeline of granted,
used, revoked, or blocked access tied to a scope and purpose. Consent is
purpose-specific and separate from authority grants; both appear on the
participant privacy page.

## Delegate invitations

When `MAPABLE_DELEGATE_INVITES_ENABLED=true`, participants can invite others
via `/participant/delegates`. Invitations propose a domain, actions, and
consent scopes. On acceptance, a grant is created. Finance and clinical domains
are blocked at invitation time.

## Emergency access

When `MAPABLE_EMERGENCY_ACCESS_ENABLED=true`, a requester can submit an
**EmergencyAccessRequest** with a detailed justification (minimum 20
characters). Access is **never automatic**:

1. Request is created with status `requested`.
2. A **human platform admin** reviews via `PATCH /api/emergency-access`.
3. Admin approves (with optional expiry) or denies, creating an
   **EmergencyAccessReview** record.
4. Approved access is time-bound and scope-limited.

Break-glass access exists for genuine emergencies but always requires human
review — no AI or automated approval path.

## Feature flags

| Flag                                 | Purpose                                       |
| ------------------------------------ | --------------------------------------------- |
| `MAPABLE_IDENTITY_AUTHORITY_ENABLED` | Master switch for identity/authority features |
| `MAPABLE_STEP_UP_AUTH_ENABLED`       | Step-up challenges for sensitive operations   |
| `MAPABLE_EMERGENCY_ACCESS_ENABLED`   | Emergency access request/review flow          |
| `MAPABLE_DELEGATE_INVITES_ENABLED`   | Participant delegate invitation UI and API    |

## API surface (Phase 6)

| Route                                  | Methods                  | Purpose                          |
| -------------------------------------- | ------------------------ | -------------------------------- |
| `/api/auth/sessions`                   | GET, DELETE              | List/revoke sessions             |
| `/api/auth/step-up`                    | POST, PUT                | Create/satisfy step-up challenge |
| `/api/participant-authority`           | GET, POST, DELETE        | List/grant/revoke authority      |
| `/api/participant-authority/decisions` | GET, POST                | History and evaluate             |
| `/api/delegates`                       | GET, POST, PATCH, DELETE | Invitations lifecycle            |
| `/api/emergency-access`                | GET, POST, PATCH         | Requests and admin review        |

## UI pages

| Page                     | Purpose                                         |
| ------------------------ | ----------------------------------------------- |
| `/account/security`      | MFA, devices, sessions, login history           |
| `/participant/privacy`   | People with access, consent timeline, decisions |
| `/participant/delegates` | Invite and manage delegates                     |

## Design principles

1. **NextAuth stays** — session cookies and providers unchanged.
2. **Participant sovereignty** — only the participant grants or revokes
   authority over their data.
3. **Explicit over implicit** — no automatic financial, clinical, or inherited
   delegate authority.
4. **Audit everything** — decisions, consent, sessions, and emergency reviews
   are logged.
5. **Human review for emergencies** — break-glass never bypasses admin approval.
