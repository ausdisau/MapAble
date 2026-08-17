# Worker registration and provider association

Support workers join a provider organisation through **email invites** on the care platform stack (`WorkerProfile` + `Organisation`). Legacy marketplace models (`Worker` + `WorkerProvider` + `Provider`) are unchanged.

## Flows

### Provider invites a worker

1. Provider admin opens `/provider/workers/new`.
2. Submits email (and optional display name) → `POST /api/organisations/:organisationId/workers/invite`.
3. System creates a placeholder `WorkerProfile` (inactive, no user) and a `WorkerOrganisationInvite` with a 14-day token.
4. Admin shares the invite URL (`/invite/worker/:token`) — email delivery can be wired later via notifications.

### Worker accepts invite (existing account)

1. Worker opens `/invite/worker/:token` and signs in.
2. `POST /api/worker-invites/:token/accept` links their user to the profile, sets `support_worker` role when appropriate, activates the profile, and refreshes onboarding.

### Worker accepts invite (new account)

1. Worker opens `/register?inviteToken=...` and registers with the **same email** as the invite.
2. `POST /api/register` creates a `support_worker` user and accepts the invite in one step.
3. Redirect to `/worker/onboarding`.

### Provider manages roster

- List: `/provider/workers` or `GET /api/organisations/:id/workers`
- Deactivate: `PATCH /api/organisations/:id/workers/:workerId` with `{ "active": false }`
- Revoke pending invite: `DELETE /api/organisations/:id/workers/invites/:inviteId`

## Data model

- `WorkerOrganisationInvite` — pending/accepted/expired/revoked invites with opaque `token`.
- `WorkerProfile` — `@@unique([userId, organisationId])`, optional `invitedAt` / `joinedAt`.

## Permissions

- Provider actions require `worker:manage:org` and `OrganisationMember` membership.
- Workers may PATCH their own profile fields and mark credentials `not_provided` or `pending_review`.
- Verification remains admin/provider via `POST /api/workers/:id/verify`.

## Environment

Invite links use `NEXT_PUBLIC_APP_URL` or `NEXTAUTH_URL` as the base URL.

## Related routes

| Route | Purpose |
|-------|---------|
| `/provider` | Provider control panel — surfaces active worker count and pending invites |
| `/provider/workers` | Roster management and invite form |
| `/worker/onboarding` | Worker onboarding checklist |
| `/worker/profile` | Self-service profile edit |
| `/invite/worker/[token]` | Accept provider invite |
