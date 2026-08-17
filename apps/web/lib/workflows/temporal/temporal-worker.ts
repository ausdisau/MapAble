/**
 * Temporal worker entry — run as separate process when TEMPORAL_ENABLED=true.
 * Local MVP mirrors workflow state in Postgres via temporal-client.ts.
 */
export function registerTemporalActivities() {
  return {
    sendAcknowledgementReminder: async () => ({ ok: true }),
    notifyWorkerCredentialExpiry: async () => ({ ok: true }),
  };
}
