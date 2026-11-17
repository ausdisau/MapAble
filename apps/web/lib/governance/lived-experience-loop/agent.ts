/**
 * Lived Experience in the Loop (LEIL) — deterministic, read-only governance agent.
 *
 * Builds co-design review briefs, checks signed independent human evidence,
 * and fails closed before release. It is not a substitute for disabled
 * co-designers, a consent source of truth, or a release authorisation system.
 * No model calls, sensitive participant records, DB writes or external actions.
 *
 * Source of policy: docs/co-design-protocol.md (S0-S6) and
 * docs/innovation/PORTFOLIO_STAGE_GATES.md (G0-G6).
 */
import {
  createHash,
  createPublicKey,
  verify as verifySignature,
} from "node:crypto";

export const LEIL_POLICY_VERSION = "leil-gate-v1" as const;
export const CO_DESIGN_STAGES = ["S0", "S1", "S2", "S3", "S4", "S5", "S6"] as const;
export type CoDesignStage = (typeof CO_DESIGN_STAGES)[number];
export type ChangeMilestone =
  | "discovery"
  | "prototype"
  | "coordinator_pilot"
  | "participant_pilot"
  | "general_release"
  | "continuous_review";

export interface GovernedChange {
  changeId: string;
  title: string;
  summary: string;
  codeDigest: string;
  affectedModules: string[];
  affectedCohorts: string[];
  participantFacing: boolean;
  affectsRights: boolean;
  includesAi: boolean;
  milestone: ChangeMilestone;
  accessibleBriefRef: string;
  feedbackDispositionRef: string;
}

export type HumanDecision = "acknowledge" | "approve" | "neutral" | "object";

/** Public/pseudonymous receipt. Human identities and payment details stay in restricted records. */
export interface CoDesignReceipt {
  receiptId: string;
  keyId: string;
  organisationId: string;
  stage: CoDesignStage;
  decision: HumanDecision;
  changeDigest: string;
  issuedAt: string;
  participationPaidConfirmed: boolean;
  accessArrangementsConfirmed: boolean;
  evidenceRef: string;
  signatureBase64: string;
}

/**
 * This registry MUST be provisioned from a trusted, human-controlled secret or
 * an equivalent authenticated authority, not a PR file or model output.
 * Keys are enrolled only after independent identity and mandate verification.
 */
export interface TrustedReviewKey {
  keyId: string;
  organisationId: string;
  publicKeyPem: string;
  active: boolean;
  disabilityLed: boolean;
  categories: string[];
}
export interface TrustedRegistry {
  keys: TrustedReviewKey[];
  revokedReceiptIds: string[];
}

export interface CoDesignManifest {
  schemaVersion: typeof LEIL_POLICY_VERSION;
  change: GovernedChange;
  receipts: CoDesignReceipt[];
}

export type CoDesignVerdict =
  | "NOT_APPLICABLE"
  | "HOLD_FOR_CO_DESIGN"
  | "EVIDENCE_READY_FOR_HUMAN_RELEASE_REVIEW";

export interface CoDesignAssessment {
  policyVersion: typeof LEIL_POLICY_VERSION;
  mode: "deterministic_no_model";
  verdict: CoDesignVerdict;
  /** Never means "permission to merge / deploy"; human release authority stays separate. */
  productionAuthorised: false;
  applicable: boolean;
  changeDigest: string | null;
  requiredStages: CoDesignStage[];
  verifiedOrganisationsByStage: Partial<Record<CoDesignStage, number>>;
  reasons: string[];
  nextHumanActions: string[];
}

const STAGES_BY_MILESTONE: Record<ChangeMilestone, CoDesignStage[]> = {
  discovery: ["S0", "S1"],
  prototype: ["S0", "S1", "S2"],
  coordinator_pilot: ["S0", "S1", "S2", "S3"],
  participant_pilot: ["S0", "S1", "S2", "S3", "S4"],
  general_release: ["S0", "S1", "S2", "S3", "S4", "S5"],
  continuous_review: [...CO_DESIGN_STAGES],
};

const SHA256 = /^[0-9a-f]{64}$/;
const REVIEW_FRESHNESS_DAYS = 180;
const CONTINUOUS_REVIEW_DAYS = 90;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return "[" + value.map(canonicalJson).join(",") + "]";
  if (isRecord(value)) {
    return "{" + Object.keys(value).sort()
      .filter((key) => value[key] !== undefined)
      .map((key) => JSON.stringify(key) + ":" + canonicalJson(value[key]))
      .join(",") + "}";
  }
  return JSON.stringify(value) ?? "null";
}

export function proposalDigest(change: GovernedChange): string {
  return createHash("sha256").update(canonicalJson(change), "utf8").digest("hex");
}

export function receiptPayload(receipt: CoDesignReceipt): Omit<CoDesignReceipt, "signatureBase64"> {
  const { signatureBase64: _signature, ...signed } = receipt;
  void _signature;
  return signed;
}

/** A relevant change includes participant experiences, governance or AI risk. */
export function requiresLivedExperienceGate(paths: string[]): boolean {
  return paths.some((untrusted) => {
    const path = untrusted.replaceAll("\\", "/").replace(/^\.?\//, "");
    if (path.startsWith("apps/web/tests/") || path.startsWith("apps/web/docs/co-design/reviews/")) return false;
    if (path === "package.json" || path.startsWith("apps/mobile/") || path.startsWith("apps/web/packages/")) return true;
    if (path.startsWith("apps/web/docs/co-design/") || path.startsWith("apps/web/docs/governance/") || path.startsWith("apps/web/docs/ai-platform/") || path === "apps/web/docs/co-design-protocol.md") return true;
    if (path === "apps/web/docs/innovation/PORTFOLIO_STAGE_GATES.md") return true;
    if (path.startsWith(".github/workflows/")) return true;
    return /^(apps\/web\/(app|components|lib|mcp|prisma|packages|scripts\/ci)\/)/.test(path);
  });
}

export function requiredStagesFor(milestone: ChangeMilestone): CoDesignStage[] {
  return [...(STAGES_BY_MILESTONE[milestone] ?? [])];
}

export function validateManifest(manifest: unknown): string[] {
  const errors: string[] = [];
  if (!isRecord(manifest) || manifest.schemaVersion !== LEIL_POLICY_VERSION ||
      !isRecord(manifest.change) || !Array.isArray(manifest.receipts)) {
    return ["invalid_manifest_shape"];
  }
  const c = manifest.change;
  for (const field of ["changeId", "title", "summary", "codeDigest", "accessibleBriefRef", "feedbackDispositionRef"]) {
    if (typeof c[field] !== "string" || !c[field].trim()) errors.push("invalid_" + field);
  }
  if (typeof c.codeDigest !== "string" || !SHA256.test(c.codeDigest)) errors.push("invalid_code_digest");
  if (!Array.isArray(c.affectedModules) || !c.affectedModules.length ||
      !c.affectedModules.every((v: unknown) => typeof v === "string" && v.length > 0)) {
    errors.push("missing_affected_modules");
  }
  if (!Array.isArray(c.affectedCohorts) || !c.affectedCohorts.length ||
      !c.affectedCohorts.every((v: unknown) => typeof v === "string" && v.length > 0)) {
    errors.push("missing_affected_cohorts");
  }
  if (typeof c.participantFacing !== "boolean" || typeof c.affectsRights !== "boolean" ||
      typeof c.includesAi !== "boolean") errors.push("invalid_scope_flags");
  if (!Object.hasOwn(STAGES_BY_MILESTONE, String(c.milestone))) errors.push("invalid_milestone");
  if (manifest.receipts.length > 100) errors.push("too_many_receipts");
  return errors;
}

function verifyReceipt(
  value: unknown,
  expectedDigest: string,
  registry: TrustedRegistry,
  now: Date,
): { ok: boolean; reason?: string; receipt?: CoDesignReceipt; key?: TrustedReviewKey } {
  if (!isRecord(value)) return { ok: false, reason: "malformed_receipt" };
  const receipt = value as unknown as CoDesignReceipt;
  if (
    !receipt.receiptId || !receipt.keyId || !receipt.organisationId ||
    !CO_DESIGN_STAGES.includes(receipt.stage) ||
    !["acknowledge", "approve", "neutral", "object"].includes(receipt.decision) ||
    !receipt.evidenceRef || !receipt.signatureBase64 || receipt.changeDigest !== expectedDigest
  ) return { ok: false, reason: "malformed_or_stale_receipt" };
  if (registry.revokedReceiptIds.includes(receipt.receiptId)) return { ok: false, reason: "revoked_receipt" };
  if (!receipt.participationPaidConfirmed || !receipt.accessArrangementsConfirmed) {
    return { ok: false, reason: "unconfirmed_access_or_remuneration" };
  }
  const issuedAt = new Date(receipt.issuedAt);
  const ageDays = (now.getTime() - issuedAt.getTime()) / 86_400_000;
  if (!Number.isFinite(ageDays) || ageDays < 0 || ageDays > REVIEW_FRESHNESS_DAYS ||
      (receipt.stage === "S6" && ageDays > CONTINUOUS_REVIEW_DAYS)) {
    return { ok: false, reason: "expired_or_invalid_review" };
  }
  const key = registry.keys.find((k) => k.keyId === receipt.keyId);
  if (!key || !key.active || !key.disabilityLed || key.organisationId !== receipt.organisationId) {
    return { ok: false, reason: "untrusted_or_disabled_reviewer" };
  }
  try {
    const signature = Buffer.from(receipt.signatureBase64, "base64");
    if (!signature.length || !verifySignature(
      null,
      Buffer.from(canonicalJson(receiptPayload(receipt)), "utf8"),
      createPublicKey(key.publicKeyPem),
      signature,
    )) return { ok: false, reason: "invalid_signature" };
  } catch {
    return { ok: false, reason: "invalid_signature" };
  }
  return { ok: true, receipt, key };
}

/**
 * Advisory gate only. Always returns productionAuthorised:false. Actual release
 * requires independent governance and GitHub repository protections.
 */
export function assessCoDesign(input: {
  manifest: unknown;
  changedPaths: string[];
  trustedRegistry?: TrustedRegistry;
  now?: Date;
  expectedCodeDigest?: string;
  expectedChangeId?: string;
}): CoDesignAssessment {
  const applicable = requiresLivedExperienceGate(input.changedPaths);
  const reasons: string[] = [];
  const base: CoDesignAssessment = {
    policyVersion: LEIL_POLICY_VERSION,
    mode: "deterministic_no_model",
    verdict: "HOLD_FOR_CO_DESIGN",
    productionAuthorised: false,
    applicable,
    changeDigest: null,
    requiredStages: [],
    verifiedOrganisationsByStage: {},
    reasons,
    nextHumanActions: [],
  };
  if (!applicable) return {
    ...base, verdict: "NOT_APPLICABLE", nextHumanActions: ["Use ordinary independent code review and security gates."],
  };
  const problems = validateManifest(input.manifest);
  if (problems.length) {
    return {
      ...base,
      reasons: problems,
      nextHumanActions: ["Prepare a scoped accessible brief and co-design manifest for this exact change."],
    };
  }
  const manifest = input.manifest as CoDesignManifest;
  const change = manifest.change;
  const digest = proposalDigest(change);
  base.changeDigest = digest;
  base.requiredStages = requiredStagesFor(change.milestone);
  if (!input.expectedChangeId) reasons.push("missing_independent_change_id");
  else if (change.changeId !== input.expectedChangeId) reasons.push("change_id_mismatch");
  if (!input.expectedCodeDigest || !SHA256.test(input.expectedCodeDigest)) reasons.push("missing_independent_code_digest");
  else if (change.codeDigest !== input.expectedCodeDigest) reasons.push("code_digest_mismatch");
  if (!input.trustedRegistry?.keys?.length) reasons.push("no_human_vetted_reviewer_registry");
  if (!input.trustedRegistry?.revokedReceiptIds) reasons.push("missing_revocation_registry");
  if (input.trustedRegistry?.keys?.length && input.trustedRegistry.revokedReceiptIds) {
    const now = input.now ?? new Date();
    const accepted: Array<{ receipt: CoDesignReceipt; key: TrustedReviewKey }> = [];
    const seenIds = new Set<string>();
    for (const raw of manifest.receipts) {
      const verified = verifyReceipt(raw, digest, input.trustedRegistry, now);
      if (!verified.ok) {
        reasons.push("receipt_" + verified.reason);
        continue;
      }
      const receipt = verified.receipt!;
      if (seenIds.has(receipt.receiptId)) reasons.push("duplicate_receipt");
      seenIds.add(receipt.receiptId);
      accepted.push({ receipt, key: verified.key! });
    }
    if (accepted.some(({receipt}) => receipt.decision === "object")) {
      reasons.push("unresolved_signed_objection");
    }
    for (const stage of base.requiredStages) {
      const applicableReceipts = accepted.filter(({receipt}) =>
        receipt.stage === stage &&
        (stage === "S0"
          ? receipt.decision === "acknowledge" || receipt.decision === "approve"
          : stage === "S5"
          ? receipt.decision === "approve" || receipt.decision === "neutral"
          : receipt.decision === "approve"),
      );
      const orgs = new Set(applicableReceipts.map((r) => r.key.organisationId));
      base.verifiedOrganisationsByStage[stage] = orgs.size;
      if (orgs.size < 2) reasons.push("insufficient_independent_organisations_" + stage);
      if (["S2", "S3", "S4", "S5"].includes(stage) &&
          change.affectedCohorts.includes("first_nations_disability") &&
          !applicableReceipts.some(({key}) => key.categories.includes("first_nations_disability_led"))) {
        reasons.push("first_nations_disability_led_review_required_" + stage);
      }
      if (["S2", "S3", "S4", "S5"].includes(stage) &&
          change.affectedCohorts.includes("intellectual_disability") &&
          !applicableReceipts.some(({key}) => key.categories.includes("intellectual_disability_led"))) {
        reasons.push("intellectual_disability_lived_experience_review_required_" + stage);
      }
    }
  } else {
    for (const stage of base.requiredStages) reasons.push("unverified_human_review_" + stage);
  }
  const blocked = reasons.length > 0;
  return {
    ...base,
    verdict: blocked ? "HOLD_FOR_CO_DESIGN" : "EVIDENCE_READY_FOR_HUMAN_RELEASE_REVIEW",
    nextHumanActions: blocked
      ? [
          "Commission appropriately paid and accessible review by independent disability-led contributors.",
          "Record concerns, material dissent, design responses and independently signed stage evidence.",
          "Resolve missing authority, expired consent or scope changes before another assessment.",
        ]
      : [
          "Independent human governance must verify the review process, impact and ongoing obligations.",
          "A separately authorised maintainer decides whether to merge or deploy; this agent cannot approve release.",
        ],
  };
}

export interface ReviewBrief {
  mode: "draft_only_not_lived_experience";
  changeId: string;
  title: string;
  affectedCohorts: string[];
  requiredStages: CoDesignStage[];
  questions: string[];
  safeguards: string[];
}

/** Questions for actual disabled co-designers; never simulated participant opinions. */
export function prepareLivedExperienceBrief(change: GovernedChange): ReviewBrief {
  return {
    mode: "draft_only_not_lived_experience",
    changeId: change.changeId,
    title: change.title,
    affectedCohorts: [...change.affectedCohorts],
    requiredStages: requiredStagesFor(change.milestone),
    questions: [
      "What part of this experience would you want to control, refuse, pause or change?",
      "What is difficult, unsafe or frustrating in the current real-world experience?",
      "What needs to work for AAC, Auslan, Easy Read, switch, keyboard and screen-reader access?",
      "What assumptions about disability, capacity, support or independence are incorrect?",
      "How should consent, correction, complaints, opt-out and human assistance work?",
      "What would meaningful benefit look like in the lives of people affected?",
      "Whose perspectives are missing and how should they be included and paid?",
      "Which concerns remain unresolved, including minority or opposing views?",
      "What changed in the design because of contributors' recommendations?",
    ],
    safeguards: [
      "Pay contributors fairly and supply preferred communication and accessible formats.",
      "Do not require diagnosis disclosure or treat any individual as representative of all disabled people.",
      "Respect withdrawn participation, confidential records, objections and conflicts of interest.",
      "Do not replace co-design with AI-generated personas, simulated testimonials or checkboxes.",
      "Keep AI non-authoritative; real human partners retain their own decision and publication rights.",
    ],
  };
}
