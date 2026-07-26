/**
 * Permanent safety invariants for AT Continuity.
 * Independent of feature flag — unsafe claims are always refused.
 */

const CLINICAL_CLAIM_PATTERNS = [
  /\bclinically\s+suitable\b/i,
  /\bprescrib(e|ed|ing)\b/i,
  /\bMapAble\s+certif(ies|ied|y)\b/i,
  /\bsuitability\s+(approved|determined|certified)\b/i,
  /\bfunctional\s+behaviour\s+assessment\b/i,
];

const EMERGENCY_CLAIM_PATTERNS = [
  /\bemergency\s+dispatch\b/i,
  /\breplace(s|ment)?\s+000\b/i,
  /\bcall\s+MapAble\s+instead\s+of\s+000\b/i,
];

export class AtContinuityInvariantError extends Error {
  readonly status = 400;

  constructor(message: string) {
    super(message);
    this.name = "AtContinuityInvariantError";
  }
}

export function assertNoClinicalSuitabilityClaim(text: string): void {
  for (const pattern of CLINICAL_CLAIM_PATTERNS) {
    if (pattern.test(text)) {
      throw new AtContinuityInvariantError(
        "AT Continuity must not claim clinical suitability, prescribing, or MapAble certification",
      );
    }
  }
}

export function assertNoEmergencyDispatchClaim(text: string): void {
  for (const pattern of EMERGENCY_CLAIM_PATTERNS) {
    if (pattern.test(text)) {
      throw new AtContinuityInvariantError(
        "AT Continuity must not claim emergency dispatch or replace 000",
      );
    }
  }
}

export function assertHumanApprovedNotification(input: {
  humanApproved: boolean;
}): void {
  if (!input.humanApproved) {
    throw new AtContinuityInvariantError(
      "AT Continuity notifications require explicit human approval before send",
    );
  }
}

export function assertSafeParticipantFacingCopy(text: string): void {
  assertNoClinicalSuitabilityClaim(text);
  assertNoEmergencyDispatchClaim(text);
}
