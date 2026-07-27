# CareOS staging rollout

CareOS persistence, event automation and confirmed actions must be rolled out separately. Do not enable all three switches in one deployment.

## 1. Pre-deployment gate

The CareOS validation workflow must pass:

```bash
pnpm install --frozen-lockfile
pnpm prisma validate
pnpm prisma generate
pnpm prisma migrate deploy
pnpm type-check
pnpm vitest run tests/careos-action-kernel.test.ts tests/careos-agentic-network.test.ts tests/careos-coordinate-confirm.test.ts
pnpm lint
pnpm build
```

Use a staging database created from a recent production-compatible snapshot with personal data removed or synthesised.

## 2. Apply migrations

Keep all CareOS runtime switches disabled while applying migrations:

```env
MAPABLE_CAREOS_PERSISTENCE_ENABLED=false
MAPABLE_CAREOS_EVENT_AUTOMATION_ENABLED=false
MAPABLE_AI_WRITE_ACTIONS=false
```

Apply:

```bash
pnpm prisma migrate deploy
pnpm prisma validate
pnpm prisma generate
```

Verify these tables exist:

- `careos_action_receipts`
- `careos_missions`
- `careos_mission_events`
- `careos_human_reviews`
- `careos_participant_preferences`

## 3. Persistence pilot

Enable mission persistence only:

```env
MAPABLE_CAREOS_PERSISTENCE_ENABLED=true
MAPABLE_CAREOS_EVENT_AUTOMATION_ENABLED=false
MAPABLE_AI_WRITE_ACTIONS=false
```

Verify:

1. A participant creates a mission.
2. Only that participant can read its detail page.
3. A support coordinator can read the review queue but cannot execute participant actions.
4. Mission history and timelines render with keyboard and screen-reader navigation.
5. Revoked preferences are not returned as active.

## 4. Continuity event pilot

Enable event automation after persistence is stable:

```env
MAPABLE_CAREOS_EVENT_AUTOMATION_ENABLED=true
```

Test transport cancellation and provider decline. Confirm each event:

- is attached to the participant's latest open mission;
- creates no replacement booking;
- creates human review only when the deterministic event policy requires it;
- does not prevent the underlying cancellation or decline;
- records redacted audit metadata.

## 5. Confirmed-action pilot

Enable only for a small staging cohort:

```env
MAPABLE_AI_WRITE_ACTIONS=true
```

Test:

- exact payload review;
- two-step participant confirmation;
- token expiry;
- cross-participant token rejection;
- replay rejection;
- Care request creation and submission;
- Transport request creation for provider review;
- receipt visibility;
- service failure after token claim.

No payment, claim, worker assignment, provider assignment or robotics action is included in this pilot.

## 6. Rollback

Disable in reverse order:

```env
MAPABLE_AI_WRITE_ACTIONS=false
MAPABLE_CAREOS_EVENT_AUTOMATION_ENABLED=false
MAPABLE_CAREOS_PERSISTENCE_ENABLED=false
```

Disabling runtime switches does not delete mission, event, review, preference or receipt records. Retain them for audit and participant access unless a documented retention or deletion process applies.

Database migrations should not be rolled back destructively in production. Correct forward with a new migration.
