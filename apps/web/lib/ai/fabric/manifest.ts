/**
 * MapAble AI Fabric inventory — repository-level integration manifest.
 * This is a source inventory, NOT a deployment manifest or permission grant.
 * Snapshot: 2026-11-10. Review branch SHA and CI before adopting any candidate.
 *
 * The existing AI capability registry remains the source of truth for AI
 * capability maturity, feature flags, model references and authority ceilings.
 */
import { listAiCapabilities } from "@/lib/ai/platform/capabilities/registry";

export type FabricState = "in_main" | "branch_candidate" | "research_only";
export type FabricAuthority = "READ_ONLY" | "DRAFT" | "RECOMMEND";

export type FabricModule = {
  id: string;
  label: string;
  domain: string;
  state: FabricState;
  maximumAuthority: FabricAuthority;
  owner: string;
  sourceRepo: "ausdisau/MapAble" | "ausdisau/mapableau-new";
  sourceRef: string;
  sourcePaths: readonly string[];
  optionalRelatedBranches: readonly string[];
  dataBoundary: "public_only" | "purpose_limited";
  integration: "already_present" | "review_required";
  notes: string;
};

const CANONICAL = "ausdisau/MapAble" as const;
const LEGACY = "ausdisau/mapableau-new" as const;

/**
 * No automatic imports from historical branches: they may be hundreds of
 * commits behind main and may contain incompatible authentication or migrations.
 */
export const FABRIC_MODULES: readonly FabricModule[] = [
  {
    id: "core.capability_registry",
    label: "AI Gateway, capability inventory and model governance",
    domain: "core",
    state: "in_main",
    maximumAuthority: "READ_ONLY",
    owner: "ai-platform",
    sourceRepo: CANONICAL,
    sourceRef: "main",
    sourcePaths: ["apps/web/lib/ai/platform"],
    optionalRelatedBranches: [
      "cursor/ai-platform-foundation-6ea8",
      "cursor/ai-platform-wave1-6ea8",
      "cursor/ai-platform-wave2-6ea8",
      "cursor/ai-platform-wave3-6ea8"
    ],
    dataBoundary: "purpose_limited",
    integration: "already_present",
    notes: "Reuse the existing AI capability registry and kill switches. Do not create a second authority store."
  },
  {
    id: "access.intelligence_next",
    label: "Access Intelligence Next, ontology and evidence",
    domain: "access",
    state: "in_main",
    maximumAuthority: "READ_ONLY",
    owner: "access-intelligence",
    sourceRepo: CANONICAL,
    sourceRef: "main",
    sourcePaths: ["apps/web/lib/access/intelligence-next"],
    optionalRelatedBranches: [
      "cursor/access-intelligence-next-living-fabric-a178",
      "feat/access-dynamic-evidence-fabric-20261101"
    ],
    dataBoundary: "purpose_limited",
    integration: "already_present",
    notes: "Evidence candidates cannot overwrite verified AccessPlace records; AI publication remains permanently denied."
  },
  {
    id: "careos.agent_network",
    label: "CareOS multi-agent coordination",
    domain: "care",
    state: "in_main",
    maximumAuthority: "RECOMMEND",
    owner: "careos",
    sourceRepo: CANONICAL,
    sourceRef: "main",
    sourcePaths: ["apps/web/intelligence/network", "apps/web/intelligence/orchestrator.ts"],
    optionalRelatedBranches: ["cursor/merge-all-agent-branches-a08f", "agent/mapable-intelligence-fabric"],
    dataBoundary: "purpose_limited",
    integration: "already_present",
    notes: "Use the existing specialist-agent network; no automatic bookings, clinical or safeguarding decisions."
  },
  {
    id: "participant.navigator",
    label: "Participant-controlled navigator and consent gates",
    domain: "participant",
    state: "in_main",
    maximumAuthority: "DRAFT",
    owner: "participant-experience",
    sourceRepo: CANONICAL,
    sourceRef: "main",
    sourcePaths: ["apps/web/lib/ai/navigator"],
    optionalRelatedBranches: ["cursor/my-mapable-pai-foundation-0014"],
    dataBoundary: "purpose_limited",
    integration: "already_present",
    notes: "Preserve user choice, correction, communication preferences and non-AI route."
  },
  {
    id: "core.evaluations",
    label: "AI evaluations and human-review contracts",
    domain: "core",
    state: "in_main",
    maximumAuthority: "READ_ONLY",
    owner: "ai-assurance",
    sourceRepo: CANONICAL,
    sourceRef: "main",
    sourcePaths: ["apps/web/lib/ai/platform/evaluations", "apps/web/lib/ai/platform/human-review"],
    optionalRelatedBranches: ["cursor/ai-evals-harness-6ea8", "feature/agentic-care-openai-evals"],
    dataBoundary: "purpose_limited",
    integration: "already_present",
    notes: "Consolidate tests by capability, not by vendor. Maintain adversarial and rights-focused cases."
  },
  {
    id: "core.control_plane_candidate",
    label: "AI control plane, budgets and observability",
    domain: "core",
    state: "branch_candidate",
    maximumAuthority: "READ_ONLY",
    owner: "ai-operations",
    sourceRepo: LEGACY,
    sourceRef: "cursor/ai-control-plane-a99d",
    sourcePaths: ["lib/ai/platform/control-plane"],
    optionalRelatedBranches: ["cursor/ai-gateway-realtime-speech-7b66"],
    dataBoundary: "purpose_limited",
    integration: "review_required",
    notes: "Diverged legacy branch; extract contracts only after auth, budgets and data-retention review."
  },
  {
    id: "core.durable_workflow_candidate",
    label: "Durable agent missions and recovery",
    domain: "core",
    state: "branch_candidate",
    maximumAuthority: "DRAFT",
    owner: "ai-operations",
    sourceRepo: LEGACY,
    sourceRef: "feat/mapable-durable-agent-workflow",
    sourcePaths: ["lib/ai/platform/runtime", "workflows"],
    optionalRelatedBranches: [],
    dataBoundary: "purpose_limited",
    integration: "review_required",
    notes: "Do not import runtime jobs without cancellation, idempotency and authorization tests."
  },
  {
    id: "core.agent_studio_candidate",
    label: "Governed Agent Studio",
    domain: "core",
    state: "branch_candidate",
    maximumAuthority: "DRAFT",
    owner: "ai-platform",
    sourceRepo: LEGACY,
    sourceRef: "feat/mapable-care-agent-studio",
    sourcePaths: ["lib/ai/platform/agent-studio"],
    optionalRelatedBranches: [],
    dataBoundary: "purpose_limited",
    integration: "review_required",
    notes: "No user-authored prompt may expand agent authority or enable tools without review."
  },
  {
    id: "care.aura_maira_candidate",
    label: "AURA / MAIRA care perceptual-frame contracts",
    domain: "care",
    state: "branch_candidate",
    maximumAuthority: "RECOMMEND",
    owner: "care-intelligence",
    sourceRepo: CANONICAL,
    sourceRef: "feat/aura-maira-care-perceptual-frame-contract-20261106",
    sourcePaths: ["apps/web/docs/ai-platform/perceptual-frame"],
    optionalRelatedBranches: ["cursor/mapable-aura-wave7-10-6ea8"],
    dataBoundary: "purpose_limited",
    integration: "review_required",
    notes: "Schema/documentation candidate only; no autonomous assessment or participant profiling."
  },
  {
    id: "marketplace.agentic_sandbox_candidate",
    label: "Marketplace evidence and agentic sandbox",
    domain: "marketplace",
    state: "branch_candidate",
    maximumAuthority: "DRAFT",
    owner: "marketplace",
    sourceRepo: CANONICAL,
    sourceRef: "feat/marketplace-agentic-evidence-sandbox-20261102",
    sourcePaths: ["apps/web/lib/marketplace/agentic-lab"],
    optionalRelatedBranches: [],
    dataBoundary: "purpose_limited",
    integration: "review_required",
    notes: "Payments, listings, moderation and regulated recommendations remain human-governed."
  },
  {
    id: "access.survey_candidate",
    label: "Access and Inclusion surveys",
    domain: "access",
    state: "branch_candidate",
    maximumAuthority: "READ_ONLY",
    owner: "community-research",
    sourceRepo: CANONICAL,
    sourceRef: "feature/access-inclusion-real-ai-surveys-20261109",
    sourcePaths: ["apps/web/lib/access/formhug-surveys.ts"],
    optionalRelatedBranches: [],
    dataBoundary: "purpose_limited",
    integration: "review_required",
    notes: "Check CSP, embedded provider data handling, participant consent and accessible fallback."
  },
  {
    id: "gais.demand_candidate",
    label: "Regional access and support demand intelligence",
    domain: "analytics",
    state: "branch_candidate",
    maximumAuthority: "READ_ONLY",
    owner: "regional-intelligence",
    sourceRepo: LEGACY,
    sourceRef: "feat/access-demand-intelligence",
    sourcePaths: ["lib/gais/demand"],
    optionalRelatedBranches: ["feat/gais-regional-demand-intelligence"],
    dataBoundary: "public_only",
    integration: "review_required",
    notes: "Aggregate-only reporting; assess reidentification, suppressed counts and provenance."
  },
  {
    id: "research.maco_candidate",
    label: "Multi-agent critical-observation research",
    domain: "research",
    state: "research_only",
    maximumAuthority: "READ_ONLY",
    owner: "research",
    sourceRepo: LEGACY,
    sourceRef: "research/maco-a0-agent-network",
    sourcePaths: ["intelligence/research/maco"],
    optionalRelatedBranches: [],
    dataBoundary: "public_only",
    integration: "review_required",
    notes: "Research adapter only; never use experimental inferences as service or clinical facts."
  },
  {
    id: "research.foundation_model_candidate",
    label: "From-scratch model research",
    domain: "research",
    state: "research_only",
    maximumAuthority: "READ_ONLY",
    owner: "research",
    sourceRepo: CANONICAL,
    sourceRef: "research/scratch-foundation-model-20261109",
    sourcePaths: ["research/mapable-scratch"],
    optionalRelatedBranches: ["feat/mapable-model-dataset-vercel-v0-1"],
    dataBoundary: "public_only",
    integration: "review_required",
    notes: "Sandbox training and evaluation only; no user data or production model routing."
  }
] as const;

export function listFabricModules(): FabricModule[] {
  return FABRIC_MODULES.map((m) => ({
    ...m,
    sourcePaths: [...m.sourcePaths],
    optionalRelatedBranches: [...m.optionalRelatedBranches]
  }));
}

export function getFabricModule(id: string): FabricModule | undefined {
  return FABRIC_MODULES.find((module) => module.id === id);
}

/** Snapshot of the existing canonical capability registry, without invocation. */
export function listFabricCapabilities() {
  return listAiCapabilities().map((cap) => ({
    key: cap.key,
    domain: cap.responsibleDomain,
    maturity: cap.maturity,
    modelBacked: cap.backend !== "deterministic",
    productionClaimStatus: cap.productionClaimStatus,
    authorityCeiling: cap.authorityCeiling,
    featureFlag: cap.featureFlag,
    humanReviewRequired: cap.humanReviewRequired,
    participantApprovalRequired: cap.participantApprovalRequired
  }));
}
