/**
 * Access Intelligence Next — Living Access Fabric feature flags.
 * All product flags default OFF. Permanent deny flags cannot be enabled by client params.
 */

function envTrue(name: string): boolean {
  const v = process.env[name];
  return v === "true" || v === "1";
}

export type AccessIntelligenceNextMode =
  | "documentation"
  | "synthetic"
  | "shadow"
  | "supervised_pilot"
  | "limited_release"
  | "production";

function readMode(): AccessIntelligenceNextMode {
  const raw = (process.env.MAPABLE_ACCESS_INTELLIGENCE_NEXT_MODE ?? "shadow").toLowerCase();
  switch (raw) {
    case "documentation":
    case "synthetic":
    case "shadow":
    case "supervised_pilot":
    case "limited_release":
    case "production":
      return raw;
    default:
      return "shadow";
  }
}

/** Permanent denies — always false regardless of env (defence in depth for client override attempts). */
export const PERMANENT_DENY_FLAGS = {
  universalScore: false,
  diagnosisInference: false,
  aiAutoPublish: false,
  aiCertification: false,
  aiExecution: false,
  paidConfidence: false,
  physicalActions: false,
  faceIdentification: false,
  backgroundSurveillance: false,
} as const;

export const accessIntelligenceNextFlags = {
  get enabled() {
    return envTrue("MAPABLE_ACCESS_INTELLIGENCE_NEXT_ENABLED");
  },
  get mode(): AccessIntelligenceNextMode {
    return readMode();
  },
  get ontology() {
    return envTrue("MAPABLE_ACCESS_ONTOLOGY_ENABLED");
  },
  get queryLanguage() {
    return envTrue("MAPABLE_ACCESS_QUERY_LANGUAGE_ENABLED");
  },
  get personalAccessCompiler() {
    return envTrue("MAPABLE_PERSONAL_ACCESS_COMPILER_ENABLED");
  },
  get livingAccessGraph() {
    return envTrue("MAPABLE_LIVING_ACCESS_GRAPH_ENABLED");
  },
  get temporalAccessEngine() {
    return envTrue("MAPABLE_TEMPORAL_ACCESS_ENGINE_ENABLED");
  },
  get proofCarryingResults() {
    return envTrue("MAPABLE_PROOF_CARRYING_RESULTS_ENABLED");
  },
  get changeDetection() {
    return envTrue("MAPABLE_ACCESS_CHANGE_DETECTION_ENABLED");
  },
  get reliability() {
    return envTrue("MAPABLE_ACCESS_RELIABILITY_ENABLED");
  },
  get journeyFailureGraph() {
    return envTrue("MAPABLE_JOURNEY_FAILURE_GRAPH_ENABLED");
  },
  get counterfactuals() {
    return envTrue("MAPABLE_ACCESS_COUNTERFACTUALS_ENABLED");
  },
  get burdenEngine() {
    return envTrue("MAPABLE_ACCESS_BURDEN_ENGINE_ENABLED");
  },
  get recoveryAdapter() {
    return envTrue("MAPABLE_ACCESS_RECOVERY_ADAPTER_ENABLED");
  },
  /** Synthetic fixture execution is allowed when next is enabled and mode is synthetic or shadow. */
  get allowSyntheticExecution() {
    if (!this.enabled) return false;
    const mode = this.mode;
    return mode === "synthetic" || mode === "shadow" || mode === "documentation";
  },
};

export function assertClientCannotEnableDenyFlags(
  clientParams: Record<string, string | undefined>,
): string[] {
  const blocked: string[] = [];
  const denyKeys = [
    "MAPABLE_ACCESS_UNIVERSAL_SCORE_ENABLED",
    "MAPABLE_ACCESS_DIAGNOSIS_INFERENCE_ENABLED",
    "MAPABLE_ACCESS_AI_AUTO_PUBLISH_ENABLED",
    "MAPABLE_ACCESS_AI_CERTIFICATION_ENABLED",
    "MAPABLE_ACCESS_AI_EXECUTION_ENABLED",
    "MAPABLE_ACCESS_PAID_CONFIDENCE_ENABLED",
    "MAPABLE_ACCESS_PHYSICAL_ACTIONS_ENABLED",
    "MAPABLE_ACCESS_FACE_IDENTIFICATION_ENABLED",
    "MAPABLE_ACCESS_BACKGROUND_SURVEILLANCE_ENABLED",
  ];
  for (const key of denyKeys) {
    const v = clientParams[key];
    if (v === "true" || v === "1") blocked.push(key);
  }
  return blocked;
}
