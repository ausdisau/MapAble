/**
 * Documented evidence pick rule for Capability Passport v1.
 * Canonical implementation lives in @mapable/domain-workforce so booking
 * eligibility and passport engines cannot diverge.
 */
export {
  evaluateWorkforceEvidence,
  selectBestEvidenceForType,
  workforceEvidenceSchema,
  type WorkforceEvidenceRecord,
} from "@mapable/domain-workforce";

export const EVIDENCE_SELECTION_RULE = [
  "For each credential or competency type, inspect every matching row.",
  "Prefer a current verified record that is not expired and not revoked.",
  "Otherwise prefer a pending or unverified record that is still current.",
  "Expired or revoked rows never outrank a valid record of the same type.",
  "If nothing matches, the type is missing (unknown / blocked), not inferred.",
].join(" ");
