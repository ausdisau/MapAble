/**
 * MapAble uses Prisma against PostgreSQL without Supabase RLS in the default stack.
 * All sensitive access MUST be enforced in application services:
 * - lib/auth/guards.ts and lib/auth/permissions.ts (RBAC)
 * - ConsentRecord checks (e.g. lib/support/coordinator/consent-gate.ts)
 * - lib/messages/message-access-policy.ts (thread participants)
 * - Document access via lib/storage/document-storage-service.ts
 *
 * If migrating to Supabase RLS, mirror these policies in SQL and keep server-side checks.
 */
export const RLS_POLICY_NOTES = {
  participantDocuments: "participant can only read own documents",
  providerDocuments: "provider scoped to organisation membership",
  messages: "conversation participants only",
  auditLogs: "admin and authorised quality roles",
} as const;
