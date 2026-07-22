import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { CAPABILITY_SEEDS } from "@/lib/convergence-os/seed/capabilities";

const ROOT = process.cwd();

const WAVE0_DOCS = [
  "docs/programmes/NDIS_EXPANSION_MASTER_PLAN.md",
  "docs/programmes/NDIS_EXPANSION_DOMAIN_MAP.md",
  "docs/programmes/NDIS_EXPANSION_PR_RECONCILIATION.md",
  "docs/programmes/NDIS_REGULATORY_GATE_MATRIX.md",
  "docs/programmes/NDIS_EXPANSION_DELIVERY_SEQUENCE.md",
] as const;

const EXPANSION_CAPABILITY_KEYS = [
  "ndis.expansion_foundation",
  "ndis.at_continuity",
  "ndis.plan_evidence_navigator",
  "ndis.support_coordination_outcomes",
  "ndis.home_living_navigator",
  "ndis.workforce_assurance",
  "ndis.psychosocial_recovery",
  "ndis.pbs_operations",
  "ndis.early_childhood_workspace",
  "ndis.allied_health_exchange",
  "ndis.plan_manager_infrastructure",
  "ndis.regional_capacity_exchange",
] as const;

const HARD_OFF_FLAGS = [
  "MAPABLE_NDIA_CLAIM_SUBMISSION_ENABLED",
  "MAPABLE_AUTOMATED_PAYMENT_APPROVAL_ENABLED",
] as const;

describe("NDIS Expansion Wave 0 registry honesty", () => {
  it("ships Wave 0 programme foundation docs", () => {
    for (const rel of WAVE0_DOCS) {
      expect(existsSync(join(ROOT, rel)), `missing ${rel}`).toBe(true);
    }
  });

  it("documents migrate-from-zero as a product-wave blocker", () => {
    const sequence = readFileSync(
      join(ROOT, "docs/programmes/NDIS_EXPANSION_DELIVERY_SEQUENCE.md"),
      "utf8",
    );
    expect(sequence).toMatch(/migrate-from-zero/i);
    expect(sequence).toMatch(/P3018|hard stop|Fail/i);
    expect(sequence).toMatch(/Wave 1/);
  });

  it("registers expansion capabilities as documented/scaffolded and not production-supported", () => {
    for (const key of EXPANSION_CAPABILITY_KEYS) {
      const seed = CAPABILITY_SEEDS.find((c) => c.capabilityKey === key);
      expect(seed, `missing capability seed ${key}`).toBeTruthy();
      if (key === "ndis.at_continuity") {
        expect(seed!.maturity).toBe("scaffolded");
        expect(seed!.honesty.durable).toBe(true);
      } else {
        expect(seed!.maturity).toBe("documented");
      }
      expect(seed!.productionClaimStatus).toBe("unsupported");
      expect(seed!.honesty.featureEnabled).toBe(false);
      expect(seed!.honesty.productionSupported).toBe(false);
      if (key !== "ndis.expansion_foundation") {
        expect(seed!.honesty.implemented).toBe(false);
      }
    }
  });

  it("keeps NDIA submit and automated payment approval hard-off in .env.example", () => {
    const envExample = readFileSync(join(ROOT, ".env.example"), "utf8");
    for (const flag of HARD_OFF_FLAGS) {
      expect(envExample).toMatch(new RegExp(`${flag}=false`));
      expect(envExample).not.toMatch(new RegExp(`${flag}\\s*=\\s*true`, "i"));
    }
  });

  it("does not claim MapAble is an NDIS-registered provider in programme docs", () => {
    for (const rel of WAVE0_DOCS) {
      const text = readFileSync(join(ROOT, rel), "utf8");
      expect(text).not.toMatch(/\bMapAble\s+is\s+an?\s+NDIS[- ]registered\b/i);
      expect(text).not.toMatch(/\bMapAble\s+Managed\s+Support\s+is\s+live\b/i);
    }
  });

  it("classifies CareOS feature-branch merges as not available on main", () => {
    const recon = readFileSync(
      join(ROOT, "docs/programmes/NDIS_EXPANSION_PR_RECONCILIATION.md"),
      "utf8",
    );
    expect(recon).toMatch(/#241/);
    expect(recon).toMatch(/#243/);
    expect(recon).toMatch(/#245/);
    expect(recon).toMatch(/feature-branch-only/);
    expect(recon).toMatch(/#378/);
    expect(recon).toMatch(/already on main/);
  });
});
