import { describe, expect, it } from "vitest";
import {
  computeBlastSeverity,
  finalizeSeverity,
  maxSeverity,
} from "@/lib/platform/convergence-os/blast/simulator";
import {
  evaluateStopConditions,
  renderContractMarkdown,
} from "@/lib/platform/convergence-os/agent/preflight";

describe("Blast radius severity", () => {
  it("never lets AI lower final severity", () => {
    const computed = computeBlastSeverity({
      domainCount: 4,
      writerCount: 2,
      apiCount: 10,
      sensitiveData: true,
      executionAuthority: true,
      migrationIrreversible: true,
      integrations: 2,
      productionUse: true,
      rollbackAbility: "hard",
      essentialWorkflow: true,
    });
    const { final } = finalizeSeverity({
      computed,
      aiExplained: "local",
      changeSummary: "CareOSMission becomes canonical",
      changeType: "canonical_promotion",
    });
    expect(maxSeverity(final, "local")).toBe(final);
    expect(final).not.toBe("local");
  });

  it("escalates payment changes to financial", () => {
    const { final } = finalizeSeverity({
      computed: "module",
      changeSummary: "Disable Stripe payout path",
      changeType: "integration",
    });
    expect(final).toBe("financial");
  });
});

describe("Agent preflight", () => {
  it("escalates authority expansion and missing rollback", () => {
    const stops = evaluateStopConditions({
      contractKey: "t1",
      objective: "test",
      answers: {
        canonicalDomains: "unclear",
        authorityExpansion: "yes",
      },
    });
    expect(stops.some((s) => s.code === "authority_expansion")).toBe(true);
    expect(stops.some((s) => s.code === "no_rollback")).toBe(true);
    expect(stops.some((s) => s.code === "unclear_ownership")).toBe(true);
  });

  it("renders markdown contract export", () => {
    const md = renderContractMarkdown({
      contractKey: "demo",
      objective: "Ship advisory twin",
      nonGoals: "No auto-merge",
      canonicalModels: ["RepositorySnapshot"],
      reusableServices: ["lib/platform/convergence-os"],
      prohibitedConcepts: ["parallel_User"],
      allowedPaths: ["lib/platform/convergence-os/"],
      protectedPaths: ["prisma/schema.prisma"],
      migrationsPermitted: false,
      testsRequired: ["tests/convergence-os"],
      authorityCeiling: "propose_only",
      releaseMode: "audit",
      rollbackExpectation: "Revert PR",
      stopConditions: [],
      status: "ready_for_human_review",
    });
    expect(md).toContain("Agent Implementation Contract");
    expect(md).toContain("No auto-merge");
  });
});
