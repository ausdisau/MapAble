export interface PreflightFinding {
  code: string;
  severity: "info" | "warning" | "requires_human";
  message: string;
  field?: string;
}

export interface ApplicationPreflightResult {
  canProceed: boolean;
  findings: PreflightFinding[];
  requiresHumanDecision: boolean;
}

export interface ApplicationPreflightService {
  runPreflight(input: {
    programmeId: string;
    participantId: string;
    applicationType: string;
    payload: Record<string, unknown>;
  }): Promise<ApplicationPreflightResult>;
}
