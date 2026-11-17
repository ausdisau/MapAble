import { describe, expect, it } from "vitest";
import {
  assessCoDesign,
  canonicalJson,
  prepareLivedExperienceBrief,
  proposalDigest,
  requiredStagesFor,
  requiresLivedExperienceGate,
  type CoDesignManifest,
  type CoDesignReceipt,
  type GovernedChange,
  type TrustedRegistry,
} from "@/lib/governance/lived-experience-loop/agent";
import { generateKeyPairSync, sign } from "node:crypto";

const NOW = new Date("2026-11-17T10:00:00.000Z");
const { publicKey, privateKey } = generateKeyPairSync("ed25519");
const { publicKey: public2, privateKey: private2 } = generateKeyPairSync("ed25519");
const registry: TrustedRegistry = {
  keys: [
    { keyId: "a", organisationId: "disabled-led-a", publicKeyPem: publicKey.export({ type: "spki", format: "pem" }).toString(), active: true, disabilityLed: true, categories: ["physical_disability"] },
    { keyId: "b", organisationId: "disabled-led-b", publicKeyPem: public2.export({ type: "spki", format: "pem" }).toString(), active: true, disabilityLed: true, categories: ["physical_disability"] },
  ],
  revokedReceiptIds: [],
};
const change: GovernedChange = {
  changeId: "PR-999",
  title: "Improve switch-accessible navigation",
  summary: "Improve a synthetic participant-facing flow",
  codeDigest: "a".repeat(64),
  affectedModules: ["care"],
  affectedCohorts: ["physical_disability"],
  participantFacing: true,
  affectsRights: true,
  includesAi: false,
  milestone: "discovery",
  accessibleBriefRef: "docs/co-design/briefs/pr-999.md",
  feedbackDispositionRef: "docs/co-design/dispositions/pr-999.md",
};
const paths = ["apps/web/components/care/Example.tsx"];
function signed(stage: "S0" | "S1", org: "a" | "b", decision: "acknowledge" | "approve" | "object" = "approve"): CoDesignReceipt {
  const receipt: CoDesignReceipt = {
    receiptId: stage + "-" + org,
    keyId: org,
    organisationId: org === "a" ? "disabled-led-a" : "disabled-led-b",
    stage,
    decision,
    changeDigest: proposalDigest(change),
    issuedAt: "2026-11-16T10:00:00.000Z",
    participationPaidConfirmed: true,
    accessArrangementsConfirmed: true,
    evidenceRef: "restricted-evidence:" + stage + ":" + org,
    signatureBase64: "",
  };
  const { signatureBase64: _ignore, ...payload } = receipt;
  void _ignore;
  const privateKey = org === "a" ? privateKeyA : privateKeyB;
  receipt.signatureBase64 = sign(null, Buffer.from(canonicalJson(payload), "utf8"), privateKey).toString("base64");
  return receipt;
}
const privateKeyA = privateKey;
const privateKeyB = private2;
const manifest = (receipts: CoDesignReceipt[]): CoDesignManifest => ({
  schemaVersion: "leil-gate-v1",
  change,
  receipts,
});
const assess = (value: unknown, override: Partial<Parameters<typeof assessCoDesign>[0]> = {}) =>
  assessCoDesign({ manifest: value, changedPaths: paths, trustedRegistry: registry, now: NOW, expectedCodeDigest: change.codeDigest, expectedChangeId: change.changeId, ...override });

describe("LEIL lived-experience governance gate", () => {
  it("classifies participant-facing code and workflow changes", () => {
    expect(requiresLivedExperienceGate(paths)).toBe(true);
    expect(requiresLivedExperienceGate([".github/workflows/ci.yml"])).toBe(true);
    expect(requiresLivedExperienceGate(["apps/web/docs/co-design/reviews/PR-999.json"])).toBe(false);
    expect(requiresLivedExperienceGate(["apps/web/tests/leil.test.ts"])).toBe(false);
  });
  it("fails closed with no manifest or human-trusted registry", () => {
    expect(assess(undefined).verdict).toBe("HOLD_FOR_CO_DESIGN");
    expect(assess(manifest([]), { trustedRegistry: undefined }).verdict).toBe("HOLD_FOR_CO_DESIGN");
  });
  it("does not treat self-declarations as a signed co-design review", () => {
    const unsigned = { ...signed("S0","a"), signatureBase64: "unsigned" };
    expect(assess(manifest([unsigned])).reasons).toContain("receipt_invalid_signature");
  });
  it("requires two different verified disability-led organisations for every stage", () => {
    const result = assess(manifest([signed("S0","a","acknowledge"), signed("S1","a")]));
    expect(result.verdict).toBe("HOLD_FOR_CO_DESIGN");
    expect(result.reasons).toContain("insufficient_independent_organisations_S1");
  });
  it("accepts valid signed evidence only for independent human release review", () => {
    const result = assess(manifest([
      signed("S0","a","acknowledge"), signed("S0","b","acknowledge"),
      signed("S1","a"), signed("S1","b"),
    ]));
    expect(result.verdict).toBe("EVIDENCE_READY_FOR_HUMAN_RELEASE_REVIEW");
    expect(result.productionAuthorised).toBe(false);
  });
  it("refuses a genuine signed objection even when approvals exist", () => {
    const result = assess(manifest([
      signed("S0","a","acknowledge"), signed("S0","b","acknowledge"),
      signed("S1","a"), signed("S1","b"), signed("S1","b","object"),
    ]));
    expect(result.verdict).toBe("HOLD_FOR_CO_DESIGN");
    expect(result.reasons).toContain("unresolved_signed_objection");
  });
  it("rejects stale code and mismatched scope", () => {
    const receipts = [signed("S0","a","acknowledge"),signed("S0","b","acknowledge"),signed("S1","a"),signed("S1","b")];
    expect(assess(manifest(receipts), { expectedCodeDigest: "b".repeat(64) }).reasons).toContain("code_digest_mismatch");
    expect(assess(manifest(receipts), { expectedChangeId: "PR-1000" }).reasons).toContain("change_id_mismatch");
  });
  it("checks receipt revocation and reviewer deactivation", () => {
    const evidence = manifest([signed("S0","a","acknowledge"),signed("S0","b","acknowledge"),signed("S1","a"),signed("S1","b")]);
    expect(assess(evidence, { trustedRegistry: { ...registry, revokedReceiptIds: ["S1-a"] } }).reasons).toContain("receipt_revoked_receipt");
    expect(assess(evidence, { trustedRegistry: { ...registry, keys: registry.keys.map(k => k.keyId === "b" ? { ...k, active: false } : k) } }).reasons).toContain("receipt_untrusted_or_disabled_reviewer");
  });
  it("requires relevant lived experience rather than invented generic endorsements", () => {
    const firstNations = { ...change, affectedCohorts: ["first_nations_disability"], milestone: "participant_pilot" as const };
    const result = assess({ ...manifest([]), change: firstNations });
    expect(result.verdict).toBe("HOLD_FOR_CO_DESIGN");
    expect(result.requiredStages).toContain("S4");
  });
  it("prepares questions but never fabricates participant testimony", () => {
    const brief = prepareLivedExperienceBrief(change);
    expect(brief.mode).toBe("draft_only_not_lived_experience");
    expect(brief.questions.some(q => q.includes("AAC"))).toBe(true);
    expect(brief.safeguards.some(s => s.includes("AI-generated personas"))).toBe(true);
    expect(requiredStagesFor("general_release")).toContain("S5");
  });
  it("excludes non-product docs while never granting production authority", () => {
    const result = assessCoDesign({ manifest: null, changedPaths: ["README.md"] });
    expect(result.verdict).toBe("NOT_APPLICABLE");
    expect(result.productionAuthorised).toBe(false);
  });
});
