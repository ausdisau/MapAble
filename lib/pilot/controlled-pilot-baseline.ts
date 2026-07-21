/**
 * Machine-readable controlled-pilot baseline.
 * Canonical narrative: docs/operations/CONTROLLED_PILOT_CHARTER.md
 *
 * Fail-closed: validation reports missing owner fields; it never invents names
 * or marks human/owner evidence complete.
 */

export const CONTROLLED_PILOT_CHARTER_PATH =
  "docs/operations/CONTROLLED_PILOT_CHARTER.md" as const;

export const PILOT_STRUCTURE = {
  participantMin: 5,
  participantMax: 10,
  region: "NSW",
  providerMin: 2,
  providerMax: 3,
  durationWeeks: 4,
  timezone: "Australia/Sydney",
  staffedDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  staffedHoursLocal: { start: "09:00", end: "17:00" },
  excludeNswPublicHolidays: true,
  humanReviewBeforeCareOrTransportProgression: true,
  noUnattendedAutomatedDelivery: true,
} as const;

export const OPERATIONAL_TARGETS = {
  rtoHours: 4,
  rpoHours: 1,
  backupRetentionDays: 30,
  criticalAlertAckMinutesStaffed: 15,
  highAlertAckMinutesStaffed: 30,
  independentReleaseApprovers: 1,
  rateLimitFailureMode: "fail_closed_sensitive_mutations",
  providerSelection: "human_only",
  participantCommunications: "human_approved_templates_only",
  emergencyBoundary: "not_an_emergency_service",
} as const;

export const IN_SCOPE_JOURNEY_IDS = [
  "G1",
  "G2",
  "G3",
  "G4",
  "G5",
  "G6",
  "G7",
  "G8",
  "G9",
  "G10",
] as const;

export const EXCLUDED_CAPABILITIES = [
  "ndia_claim_submission",
  "automated_payments",
  "automated_invoice_approval",
  "pbs_generation_or_recommendation",
  "clinical_recommendations",
  "emergency_dispatch_or_response_claims",
  "autonomous_safeguarding",
  "automated_provider_selection",
  "unreviewed_participant_provider_matching",
  "production_csp_enforcement",
  "at_continuity_before_release_gate",
  "geoscape_before_licensing_privacy",
] as const;

export const MANDATORY_ROLES = [
  "pilot_and_release_owner",
  "technical_incident_owner",
  "privacy_and_safeguarding_owner",
  "independent_accessibility_and_release_reviewer",
  "database_recovery_operator",
  "provider_operations_contact",
] as const;

export type MandatoryRole = (typeof MANDATORY_ROLES)[number];

export type OwnerAssignment = {
  role: MandatoryRole;
  name?: string;
  contactMethod?: string;
  deputy?: string;
  availability?: string;
  acknowledgement?: string;
  approvalDate?: string;
};

export type EvidenceStatus =
  | "VERIFIED"
  | "FAILED"
  | "NOT_RUN"
  | "BLOCKED"
  | "OWNER_ACTION_REQUIRED"
  | "NOT_APPLICABLE";

const EVIDENCE_STATUSES: readonly EvidenceStatus[] = [
  "VERIFIED",
  "FAILED",
  "NOT_RUN",
  "BLOCKED",
  "OWNER_ACTION_REQUIRED",
  "NOT_APPLICABLE",
] as const;

export function isEvidenceStatus(value: string): value is EvidenceStatus {
  return (EVIDENCE_STATUSES as readonly string[]).includes(value);
}

/**
 * Fail-closed owner-assignment check. Empty/missing fields are reported;
 * inventing names is forbidden — callers must leave OWNER_ACTION_REQUIRED.
 */
export function validateOwnerAssignments(assignments: OwnerAssignment[]): {
  ok: boolean;
  missing: string[];
  status: EvidenceStatus;
} {
  const byRole = new Map(assignments.map((a) => [a.role, a]));
  const missing: string[] = [];

  for (const role of MANDATORY_ROLES) {
    const row = byRole.get(role);
    if (!row) {
      missing.push(`${role}:record`);
      continue;
    }
    for (const field of [
      "name",
      "contactMethod",
      "deputy",
      "availability",
      "acknowledgement",
      "approvalDate",
    ] as const) {
      if (!row[field]?.trim()) {
        missing.push(`${role}:${field}`);
      }
    }
  }

  if (missing.length > 0) {
    return {
      ok: false,
      missing,
      status: "OWNER_ACTION_REQUIRED",
    };
  }

  return { ok: true, missing: [], status: "VERIFIED" };
}

/** Sensitive pilot mutations remain blocked without distributed rate limiting. */
export function sensitivePilotMutationsAllowed(options: {
  distributedRateLimitVerified: boolean;
}): boolean {
  return options.distributedRateLimitVerified === true;
}
