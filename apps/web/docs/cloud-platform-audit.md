# CareOS cloud platform audit

## Current deployment

MapAble is a Next.js modular monolith deployed primarily to Vercel with
PostgreSQL/Prisma. The repository has an optional Socket.IO workspace,
integration adapters, workflow mirrors, in-app notifications and local
document storage.

## Findings

- Tenant and membership models exist, but most operational rows are scoped
  through organisations rather than direct tenant columns.
- The existing tenant query helper contained an undefined organisation list;
  the cloud foundation now carries server-verified organisation IDs.
- PostgreSQL workflow mirrors exist, but there was no transactional event
  outbox or delivery retry/dead-letter path.
- Document storage implements local disk only; non-local modes are declarations
  rather than working adapters and must not be enabled in production.
- Notifications are in-app only and synchronous.
- Integrations have a mature registry/health model, but many connectors remain
  stubs.
- Environment validation exists but is not a startup or CI production gate.
- Observability is limited to audit events, health routes, Vercel Speed
  Insights and optional PostHog.

## Foundation decision

Keep the modular monolith and one PostgreSQL database. Introduce portable
interfaces and a PostgreSQL outbox before adding queues, Redis or object
storage vendors. All recording providers are test/development only and are
rejected by production configuration validation.
