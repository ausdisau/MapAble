export type SyntheticAuditEvent = {
  requestId: string;
  promptHash: string;
  outcome: string;
  reasonCodes: string[];
  sourceIds: string[];
  threatSignals: string[];
  createdAt: string;
};

const events: SyntheticAuditEvent[] = [];
const LIMIT = 100;

export function recordSyntheticAudit(event: SyntheticAuditEvent): void {
  events.unshift(event);
  events.splice(LIMIT);
}

export function listSyntheticAudit(): readonly SyntheticAuditEvent[] {
  return events;
}

export function resetSyntheticAudit(): void {
  events.length = 0;
}
