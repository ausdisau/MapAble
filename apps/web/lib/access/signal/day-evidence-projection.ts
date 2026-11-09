/**
 * MapAble Access -> MapAble Day read-only projection for Signal exercises.
 *
 * Reuses Access Infrastructure observation/provenance vocabulary. This
 * deliberately cannot mint a Green rating, publish a place, assign access
 * requirements to someone or infer whole-journey suitability.
 */
import type { AccessObservation } from "@/lib/access/infrastructure/types";
import { buildProvenanceDisplay } from "@/lib/access/infrastructure/provenance";

export const SIGNAL_EVIDENCE_EXAMPLE_IDS = [
  "unknown",
  "community_reported",
  "disputed",
  "feature_verified",
] as const;

export type SignalEvidenceExampleId = (typeof SIGNAL_EVIDENCE_EXAMPLE_IDS)[number];

type ScopedEvidenceFields = Pick<
  AccessObservation,
  "sourceType" | "observedAt" | "verificationStatus" | "evidenceKinds" | "reviewDue" | "disputed"
>;

export type SignalEvidencePreview = ScopedEvidenceFields & {
  synthetic: true;
  scope: "single_feature";
};

export type SignalDayAccessProjection = {
  evidenceLabel: string;
  featureEvidenceState: "unknown" | "reported" | "disputed" | "outdated" | "feature_verified";
  dayReadiness: "review";
  reason: string;
  sourceType: ScopedEvidenceFields["sourceType"];
  independentWholeJourneyCheck: false;
  participantFitEstablished: false;
  publicRating: "unknown";
  publicPublicationAllowed: false;
  productionClaim: "none";
};

const MOCK_DATE = "2026-11-09T00:00:00.000Z";

/** Fixed fictional evidence examples, never real places or contributor data. */
export function getSignalEvidenceExample(id: SignalEvidenceExampleId): SignalEvidencePreview {
  const base: SignalEvidencePreview = {
    synthetic: true,
    scope: "single_feature",
    sourceType: "synthetic",
    observedAt: MOCK_DATE,
    verificationStatus: "unknown",
    evidenceKinds: [],
    reviewDue: null,
    disputed: false,
  };

  switch (id) {
    case "community_reported":
      return { ...base, sourceType: "community", verificationStatus: "community_reported" };
    case "disputed":
      return { ...base, sourceType: "community", verificationStatus: "disputed", disputed: true };
    case "feature_verified":
      return { ...base, sourceType: "trained_assessor", verificationStatus: "verified" };
    case "unknown":
      return base;
  }
}

/**
 * A function can accept a canonical observation only after its caller
 * explicitly identifies it as synthetic for this preview. Live reads later
 * require Core participant/tenant permissions and purpose-bound consent.
 */
export function projectSignalEvidenceForDay(
  evidence: SignalEvidencePreview,
  now: Date = new Date(),
): SignalDayAccessProjection {
  if (evidence.synthetic !== true || evidence.scope !== "single_feature") {
    throw new Error("Signal Day preview accepts fictional feature evidence only.");
  }

  const observed = Date.parse(evidence.observedAt);
  const due = evidence.reviewDue ? Date.parse(evidence.reviewDue) : null;
  const invalidDate =
    !Number.isFinite(observed) ||
    observed > now.getTime() ||
    (due !== null && !Number.isFinite(due));
  const outdated = invalidDate || (
    due !== null &&
    Number.isFinite(due) &&
    due <= now.getTime()
  ) || evidence.verificationStatus === "outdated";

  const provenance = buildProvenanceDisplay({
    sourceType: evidence.sourceType,
    verificationStatus: evidence.verificationStatus,
    evidenceKinds: evidence.evidenceKinds,
    freshnessExpired: outdated,
  });

  let state: SignalDayAccessProjection["featureEvidenceState"];
  let reason: string;
  if (evidence.disputed || evidence.verificationStatus === "disputed") {
    state = "disputed";
    reason = "The feature evidence is disputed; review both accounts before planning.";
  } else if (outdated) {
    state = "outdated";
    reason = "The evidence is old, invalid or due for reinspection.";
  } else if (evidence.verificationStatus === "verified" && evidence.sourceType === "trained_assessor") {
    state = "feature_verified";
    reason = "This fictional feature has an assessor-review example, but no complete route or personal fit assessment.";
  } else if (
    evidence.verificationStatus === "community_reported" ||
    evidence.verificationStatus === "venue_reported" ||
    evidence.verificationStatus === "observed"
  ) {
    state = "reported";
    reason = "The feature has a report but is not independently verified.";
  } else {
    state = "unknown";
    reason = "Missing or insufficient evidence. Unknown does not mean accessible or inaccessible.";
  }

  return {
    evidenceLabel: provenance.displayLabel + " (fictional example)",
    featureEvidenceState: state,
    dayReadiness: "review",
    reason,
    sourceType: evidence.sourceType,
    independentWholeJourneyCheck: false,
    participantFitEstablished: false,
    publicRating: "unknown",
    publicPublicationAllowed: false,
    productionClaim: "none",
  };
}
