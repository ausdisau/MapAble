/**
 * Capability Passport + Skills Bridge v1.
 * Default OFF. Production is hard-denied even if the env flag is true.
 * Training completion is not demonstrated competence.
 * Worker screening clearance is not a general safety guarantee.
 */
function envTrue(name: string): boolean {
  return process.env[name] === "true";
}

export function isCapabilityPassportFlagOn(): boolean {
  return envTrue("MAPABLE_CAPABILITY_PASSPORT_V1_ENABLED");
}

export function isVercelProduction(): boolean {
  return process.env.VERCEL_ENV === "production";
}

/** Preview-only: flag on AND not Vercel production. */
export function isCapabilityPassportPreviewEnabled(): boolean {
  return isCapabilityPassportFlagOn() && !isVercelProduction();
}

export const CAPABILITY_PASSPORT_POLICY_VERSION = "capability-passport-v1";

export const DEFAULT_SCREENING_DISPLAY =
  "Current screening status: NOT INDEPENDENTLY VERIFIED";

export const MOCK_NOT_CLEARANCE_COPY =
  "Mock issuer presentations are not a worker screening clearance, WWCC, first-aid certificate, insurance confirmation, or competence assessment.";

export const TRAINING_NOT_COMPETENCE_COPY =
  "Training completed. Practical competence not yet assessed.";
