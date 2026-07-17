import { describe, expect, it } from "vitest";

import { CANONICAL_DOMAIN_SEEDS } from "@/lib/convergence-os/seed/canonical-domains";
import { CAPABILITY_SEEDS } from "@/lib/convergence-os/seed/capabilities";
import {
  PILOT_DEPENDENCY_SEEDS,
  PILOT_PR_SEEDS,
} from "@/lib/convergence-os/seed/pilot-prs";
import { FOUNDATION_MERGE_TRAIN } from "@/lib/convergence-os/trains/foundation-merge-train";
import { DECISION_PROPOSAL_SEEDS } from "@/lib/convergence-os/seed/decisions";

describe("ConvergenceOS seed inventory", () => {
  it("includes CareOSMission, Vault, AccessPlace, TransportTrip domains", () => {
    const keys = CANONICAL_DOMAIN_SEEDS.map((d) => d.domainKey);
    expect(keys).toEqual(
      expect.arrayContaining([
        "missions.careos_mission",
        "vault.personal_access",
        "places.access_place",
        "transport.trip",
        "convergence.control_plane",
      ])
    );
  });

  it("labels AURA stacked PR ancestry edges", () => {
    const basedOn = PILOT_DEPENDENCY_SEEDS.filter(
      (d) => d.edgeType === "based_on"
    );
    expect(basedOn).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ fromPr: 267, toPr: 266 }),
        expect.objectContaining({ fromPr: 268, toPr: 267 }),
        expect.objectContaining({ fromPr: 277, toPr: 275 }),
      ])
    );
  });

  it("marks vault before rightsos and CareOSMission multi-PR warnings", () => {
    const vault = PILOT_PR_SEEDS.find((p) => p.number === 281);
    const rights = PILOT_PR_SEEDS.find((p) => p.number === 280);
    const aura = PILOT_PR_SEEDS.find((p) => p.number === 267);
    expect(vault?.warningLabels).toContain("merge_before_rightsos");
    expect(rights?.warningLabels).toContain("duplicate_vault_models");
    expect(aura?.warningLabels).toContain("adds_careos_mission_ddl");
  });

  it("keeps capability honesty dimensions distinct", () => {
    const auraExec = CAPABILITY_SEEDS.find(
      (c) => c.capabilityKey === "aura.approved_execution"
    );
    expect(auraExec?.honesty.implemented).toBe(true);
    expect(auraExec?.honesty.featureEnabled).toBe(false);
    expect(auraExec?.honesty.productionSupported).toBe(false);
    expect(auraExec?.productionClaimStatus).toBe("unsupported");
  });

  it("defines foundation merge train with human-only execution steps", () => {
    expect(FOUNDATION_MERGE_TRAIN.trainType).toBe("FOUNDATION");
    expect(FOUNDATION_MERGE_TRAIN.steps[0]?.prNumber).toBe(285);
    expect(
      FOUNDATION_MERGE_TRAIN.steps.some((s) => s.action === "defer" && s.prNumber === 252)
    ).toBe(true);
    expect(
      FOUNDATION_MERGE_TRAIN.steps.some(
        (s) => s.prNumber === 281 && s.action === "merge"
      )
    ).toBe(true);
  });

  it("marks architecture decisions as AI proposals not approvals", () => {
    expect(DECISION_PROPOSAL_SEEDS.every((d) => d.isAiProposal)).toBe(true);
    expect(
      DECISION_PROPOSAL_SEEDS.some((d) => d.decisionKey === "ADR-CONV-001")
    ).toBe(true);
  });
});
