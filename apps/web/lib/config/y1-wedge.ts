export const y1WedgeConfig = {
  supportProfileEnabled: process.env.SUPPORT_PROFILE_ENABLED === "true",
  participantMatchReviewEnabled:
    process.env.PARTICIPANT_MATCH_REVIEW_ENABLED === "true",
  incidentIntakeV2Enabled: process.env.INCIDENT_INTAKE_V2_ENABLED === "true",
  microConsentEnabled: process.env.MICRO_CONSENT_ENABLED === "true",
  backupShiftRecoveryEnabled:
    process.env.BACKUP_SHIFT_RECOVERY_ENABLED === "true",
};
