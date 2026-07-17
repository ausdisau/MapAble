import { describe, expect, it } from "vitest";
import { CAPABILITY_SEEDS } from "@/lib/convergence-os/seed/capabilities";
import {
  PR_ACTION_LEDGER,
  SUPERSEDED_CLOSE_TARGETS,
  MAX_UNMERGED_STACK_DEPTH,
  PRODUCTISATION_TRAIN_HEADS,
  assertSupersededCloseTargetsInLedger,
  assertStackDepthPolicy,
  assertProductisationTrainDepth,
  ledgerEntriesByAction,
} from "@/lib/convergence-os/seed/pr-action-ledger";
import {
  PUBLIC_CLAIM_REGISTRY,
  assertNoProductionClaimsWithoutEvidence,
} from "@/lib/convergence-os/seed/public-claims";
import { PRODUCTISATION_MERGE_TRAIN } from "@/lib/convergence-os/trains/productisation-merge-train";
import { FOUNDATION_MERGE_TRAIN } from "@/lib/convergence-os/trains/foundation-merge-train";
import { readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

describe("Productisation Wave 0 registries", () => {
  it("keeps foundation train and adds productisation train", () => {
    expect(FOUNDATION_MERGE_TRAIN.trainKey).toBe("foundation_governance_prep_v1");
    expect(PRODUCTISATION_MERGE_TRAIN.trainKey).toBe(
      "productisation_connected_service_v1",
    );
    expect(PRODUCTISATION_MERGE_TRAIN.trainType).toBe("PRODUCTISATION");
    expect(PRODUCTISATION_MERGE_TRAIN.steps.length).toBeGreaterThanOrEqual(14);
  });

  it("requires superseded PRs to be close actions", () => {
    expect(() => assertSupersededCloseTargetsInLedger()).not.toThrow();
    for (const n of SUPERSEDED_CLOSE_TARGETS) {
      const entry = PR_ACTION_LEDGER.find((e) => e.number === n);
      expect(entry?.action).toBe("close");
      expect(entry?.productionClaimAllowed).toBe(false);
    }
    const closeNumbers = ledgerEntriesByAction("close")
      .map((e) => e.number)
      .sort((a, b) => a - b);
    expect(closeNumbers).toEqual([...SUPERSEDED_CLOSE_TARGETS].sort((a, b) => a - b));
  });

  it("enforces stack depth policy and train heads ≤ 3", () => {
    expect(MAX_UNMERGED_STACK_DEPTH).toBe(3);
    expect(PRODUCTISATION_TRAIN_HEADS).toEqual([312, 313, 314]);
    expect(() => assertStackDepthPolicy()).not.toThrow();
    expect(() => assertProductisationTrainDepth()).not.toThrow();
    for (const entry of PR_ACTION_LEDGER) {
      if (
        entry.stackDepth !== undefined &&
        entry.stackDepth > MAX_UNMERGED_STACK_DEPTH
      ) {
        expect(entry.action).not.toBe("merge");
      }
    }
  });

  it("records AccessCast #324 as merged and duplicates as close", () => {
    expect(existsSync(join(process.cwd(), "lib/accesscast/index.ts"))).toBe(true);
    const merged = PR_ACTION_LEDGER.find((e) => e.number === 324);
    expect(merged?.state).toBe("MERGED");
    expect(merged?.action).toBe("retain_as_reference");
    for (const n of [320, 321, 322, 325]) {
      expect(PR_ACTION_LEDGER.find((e) => e.number === n)?.action).toBe("close");
    }
  });

  it("refuses to merge RC1 mega-branch", () => {
    const rc1 = PR_ACTION_LEDGER.find((e) => e.number === 323);
    expect(rc1?.action).toBe("split");
    expect(rc1?.action).not.toBe("merge");
  });

  it("forbids public production claims without maturity evidence", () => {
    expect(() => assertNoProductionClaimsWithoutEvidence()).not.toThrow();
    expect(PUBLIC_CLAIM_REGISTRY.every((c) => !c.publicClaimAllowed)).toBe(true);
    expect(
      PUBLIC_CLAIM_REGISTRY.some((c) =>
        c.prohibitedWording.some((w) => w.toLowerCase().includes("guaranteed")),
      ),
    ).toBe(true);
  });

  it("records honest missing packages as not implemented", () => {
    const readiness = CAPABILITY_SEEDS.find(
      (c) => c.capabilityKey === "workforce.readiness",
    );
    const companion = CAPABILITY_SEEDS.find(
      (c) => c.capabilityKey === "mobile.companion",
    );
    const ops = CAPABILITY_SEEDS.find(
      (c) => c.capabilityKey === "provider.ops_attention",
    );
    const passport = CAPABILITY_SEEDS.find(
      (c) => c.capabilityKey === "communication.passport",
    );
    expect(readiness?.honesty.implemented).toBe(false);
    expect(companion?.honesty.productionSupported).toBe(false);
    expect(ops?.readWrite).toBe("read");
    expect(passport?.participantApprovalRequired).toBe(true);
  });

  it("has unique capability keys", () => {
    const keys = CAPABILITY_SEEDS.map((c) => c.capabilityKey);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("has unique migration directory timestamps under prisma/migrations", () => {
    const root = join(process.cwd(), "prisma/migrations");
    const dirs = readdirSync(root, { withFileTypes: true })
      .filter((d) => d.isDirectory() && /^\d{14}/.test(d.name))
      .map((d) => d.name.slice(0, 14));
    const unique = new Set(dirs);
    expect(unique.size).toBe(dirs.length);
  });

  it("merge train closes superseded before product merges", () => {
    const closeSteps = PRODUCTISATION_MERGE_TRAIN.steps.filter((s) =>
      s.action.startsWith("close"),
    );
    const wave0 = PRODUCTISATION_MERGE_TRAIN.steps.find((s) => s.prNumber === 312);
    expect(closeSteps.length).toBeGreaterThanOrEqual(4);
    expect(closeSteps[0]!.stepOrder).toBeLessThan(wave0!.stepOrder);
  });

  it("archives or defers CareOS parallel platform", () => {
    const careos = PR_ACTION_LEDGER.find((e) => e.number === 231);
    expect(["archive", "defer"]).toContain(careos?.action);
    expect(careos?.productionClaimAllowed).toBe(false);
  });
});
