/** AI Evidence Intake Studio flags. All default false — no OCR, no canonical writes. */

function envFlag(name: string, defaultEnabled = false): boolean {
  const raw = process.env[name];
  if (raw === undefined) return defaultEnabled;
  return raw === "true";
}

export const aiIntakeConfig = {
  get enabled() {
    return envFlag("MAPABLE_AI_INTAKE_ENABLED", false);
  },
  get modelEnabled() {
    return envFlag("MAPABLE_AI_INTAKE_MODEL_ENABLED", false);
  },
  /** Must remain false until a later wave explicitly enables approved writes. */
  get canonicalWriteEnabled() {
    return envFlag("MAPABLE_AI_INTAKE_CANONICAL_WRITE_ENABLED", false);
  },
  authorityCeiling: "DRAFT_ONLY" as const,
};
