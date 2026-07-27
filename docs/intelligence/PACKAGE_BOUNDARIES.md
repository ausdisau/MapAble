# CSI package boundaries

`@mapable/contracts` contains only versioned, runtime-validated contracts and
primitive types. `@mapable/intelligence-kernel` contains deterministic planning
state, capability metadata, policy decisions, audit-chain interfaces and the
offline fake model provider.

Neither package may import Next.js, application routes, Prisma, Stripe, model
providers, CareOS services, or infrastructure adapters. These boundaries are
checked by `pnpm check:package-boundaries`.

The existing `lib/intelligence/mainframe` remains a synthetic adapter during
this extraction. Production CareOS stays under `lib/intelligence/careos` until
a future compatibility migration is separately approved.
