/**
 * Read-only worker shift brief contract for offline cache (Y1 wedge).
 * Sync via GET /api/worker/shifts/:shiftId/brief
 */
export type WorkerShiftBriefContract = {
  displayLabel: string;
  location?: string;
  tasks: unknown[];
  accessSummary?: string;
  communicationNotes?: string;
  supportProfileBrief?: {
    routines: { label: string; detail: string }[];
    preferences: { label: string; detail: string }[];
    boundaries: { label: string; detail: string }[];
    escalation: Record<string, string | undefined>;
    version: number;
  };
  cachedAt?: string;
};

export const WORKER_SHIFT_BRIEF_API = "/api/worker/shifts/{shiftId}/brief";
