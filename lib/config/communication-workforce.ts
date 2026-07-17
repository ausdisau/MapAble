/**
 * Communication Passport + Workforce readiness flags.
 * All default off — not evidence of production readiness.
 */
export const communicationWorkforceConfig = {
  communicationPassportEnabled:
    process.env.MAPABLE_COMMUNICATION_PASSPORT_ENABLED === "true",
  workforceReadinessEnabled:
    process.env.MAPABLE_WORKFORCE_READINESS_ENABLED === "true",
  /** Permanent prohibition — never enable auto-assignment via this module. */
  autoAssignmentEnabled: false,
};

export function isCommunicationPassportEnabled(): boolean {
  return communicationWorkforceConfig.communicationPassportEnabled;
}

export function isWorkforceReadinessEnabled(): boolean {
  return communicationWorkforceConfig.workforceReadinessEnabled;
}
