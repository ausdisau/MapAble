import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { CAPABILITY_SEEDS } from "@/lib/platform/convergence-os/seed/capabilities";
import {
  PUBLIC_CLAIM_REGISTRY,
  assertNoProductionClaimsWithoutEvidence,
} from "@/lib/platform/convergence-os/seed/public-claims";

const ROOT = process.cwd();

const REQUIRED_STRATEGY_DOCS = [
  "docs/strategy/OPERATING_LANES.md",
  "docs/strategy/COMPETITIVE_POSITION.md",
  "docs/strategy/BUILD_PARTNER_DEFER.md",
  "docs/strategy/STRATEGIC_OPPORTUNITIES.md",
  "docs/productisation/CAPABILITY_REGISTRY.md",
];

const PRODUCTISATION_PATHS: Record<string, string[]> = {
  "communication.passport": ["lib/support/communication-passport/service.ts"],
  "workforce.readiness": ["lib/workforce/readiness/evaluate.ts"],
  "provider.ops_attention": ["lib/provider/ops/attention-queue.ts"],
  "mobile.companion": ["apps/companion/App.tsx", "lib/companion/visit-pack-compile.ts"],
  "pilot.starting_work": ["lib/pilot/starting-work/golden-journey.ts"],
  "transport.quotes": ["lib/transport/quotes/quote-service.ts"],
  "accesscast.outlook": ["lib/accesscast/index.ts"],
  "billing.centre": ["lib/billing/index.ts"],
  "care.request_loop": ["lib/care/care-booking-service.ts"],
};

describe("Strategic opportunity registry honesty", () => {
  it("ships required strategy and capability registry docs", () => {
    for (const rel of REQUIRED_STRATEGY_DOCS) {
      expect(existsSync(join(ROOT, rel)), `missing ${rel}`).toBe(true);
    }
  });

  it("documents four operating lanes without fabricating registration", () => {
    const lanes = readFileSync(join(ROOT, "docs/strategy/OPERATING_LANES.md"), "utf8");
    expect(lanes).toMatch(/MapAble Connect/i);
    expect(lanes).toMatch(/MapAble Network/i);
    expect(lanes).toMatch(/MapAble Managed Support/i);
    expect(lanes).toMatch(/MapAble Infrastructure/i);
    expect(lanes).toMatch(/do not fabricate/i);
    expect(lanes).not.toMatch(/\bMapAble\s+is\s+an?\s+NDIS[- ]registered\b/i);
  });

  it("sequences the next four implementation PRs after reconciliation", () => {
    const seq = readFileSync(
      join(ROOT, "docs/strategy/STRATEGIC_OPPORTUNITIES.md"),
      "utf8",
    );
    expect(seq).toMatch(/persistent-transport-quotes/i);
    expect(seq).toMatch(/recurring-care-agreements/i);
    expect(seq).toMatch(/starting-work-db-journey/i);
    expect(seq).toMatch(/worker-cancel-recovery/i);
    expect(seq).toMatch(/No Prisma product migration/i);
  });

  it("marks transport quotes as Prisma-durable but not production_supported", () => {
    const quotes = CAPABILITY_SEEDS.find((c) => c.capabilityKey === "transport.quotes");
    expect(quotes).toBeTruthy();
    expect(quotes!.persistenceType).toBe("prisma");
    expect(quotes!.honesty.durable).toBe(true);
    expect(quotes!.honesty.productionSupported).toBe(false);
    expect(quotes!.honesty.implemented).toBe(true);

    const quoteSource = readFileSync(
      join(ROOT, "lib/transport/quotes/quote-service.ts"),
      "utf8",
    );
    expect(quoteSource).toMatch(/Prisma-persisted/i);
    expect(quoteSource).not.toMatch(/new Map</);
    expect(
      existsSync(
        join(
          ROOT,
          "prisma/migrations/20260717150000_transport_quotes_persistent/migration.sql",
        ),
      ),
    ).toBe(true);
  });

  it("records synthetic AccessCast and Starting Work honestly", () => {
    const accesscast = CAPABILITY_SEEDS.find(
      (c) => c.capabilityKey === "accesscast.outlook",
    );
    const starting = CAPABILITY_SEEDS.find(
      (c) => c.capabilityKey === "pilot.starting_work",
    );
    expect(accesscast?.maturity).toBe("fixture_only");
    expect(accesscast?.honesty.productionSupported).toBe(false);
    expect(starting?.maturity).toBe("fixture_only");
    expect(starting?.honesty.implemented).toBe(true);
    expect(starting?.honesty.durable).toBe(false);
    expect(starting?.honesty.productionSupported).toBe(false);
  });

  it("marks landed productisation packages as implemented but not production_supported", () => {
    for (const [key, paths] of Object.entries(PRODUCTISATION_PATHS)) {
      const seed = CAPABILITY_SEEDS.find((c) => c.capabilityKey === key);
      expect(seed, `missing capability seed ${key}`).toBeTruthy();
      expect(seed!.honesty.implemented, `${key} implemented`).toBe(true);
      expect(seed!.honesty.productionSupported, `${key} production`).toBe(false);
      for (const rel of paths) {
        expect(existsSync(join(ROOT, rel)), `${key} path ${rel}`).toBe(true);
      }
    }
  });

  it("keeps Provider Ops read-only and Managed Support unsupported", () => {
    const ops = CAPABILITY_SEEDS.find(
      (c) => c.capabilityKey === "provider.ops_attention",
    );
    const managed = CAPABILITY_SEEDS.find(
      (c) => c.capabilityKey === "managed.support_delivery",
    );
    expect(ops?.readWrite).toBe("read");
    expect(ops?.honesty.implemented).toBe(true);
    expect(managed?.maturity).toBe("concept");
    expect(managed?.honesty.productionSupported).toBe(false);
    expect(managed?.honesty.implemented).toBe(false);
  });

  it("forbids public claims that exceed maturity evidence", () => {
    expect(() => assertNoProductionClaimsWithoutEvidence()).not.toThrow();
    expect(PUBLIC_CLAIM_REGISTRY.every((c) => !c.publicClaimAllowed)).toBe(true);

    const capabilityKeys = new Set(CAPABILITY_SEEDS.map((c) => c.capabilityKey));
    for (const claim of PUBLIC_CLAIM_REGISTRY) {
      expect(
        capabilityKeys.has(claim.capabilityKey),
        `claim ${claim.claimKey} references missing capability ${claim.capabilityKey}`,
      ).toBe(true);
      if (claim.publicClaimAllowed) {
        expect(["production_ready", "generally_available", "limited_release"]).toContain(
          claim.currentMaturity,
        );
      }
    }
  });

  it("documents Care agreements and Transport persistent quotes in module docs", () => {
    const care = readFileSync(join(ROOT, "docs/modules/care.md"), "utf8");
    const transport = readFileSync(join(ROOT, "docs/modules/transport.md"), "utf8");
    expect(care).toMatch(/billing-handoff/i);
    expect(care).toMatch(/agreement/i);
    expect(care).not.toMatch(/Service agreement placeholder/i);
    expect(transport).toMatch(/TransportQuote/i);
    expect(transport).toMatch(/TransportTrip/i);
  });

  it("never enables productionSupported without durable + tested + implemented", () => {
    for (const seed of CAPABILITY_SEEDS) {
      if (!seed.honesty.productionSupported) continue;
      expect(seed.honesty.implemented).toBe(true);
      expect(seed.honesty.durable).toBe(true);
      expect(seed.honesty.tested).toBe(true);
    }
  });
});
