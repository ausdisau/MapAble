import { describe, expect, it } from "vitest";

import { isWebAlphaAllowed } from "@/lib/marketplace/alpha/web-alpha-access";
import {
  WEB_ALPHA_ITEMS, alphaPlanSubtotal, alphaWebFilter, makeAlphaTrialNote,
  toggleCompareItem, togglePlanningItem,
} from "@/lib/marketplace/alpha/web-alpha-model";
import {
  BETA_CONNECTED_ADAPTERS, BETA_PUBLISHED_RECORDS, BETA_SOURCE_REGISTRY,
  publishExternalReadOnlyCandidate, resolveBetaPhase,
  type BetaFlags, type BetaPublicationReview, type ExternalCandidate,
} from "@/lib/marketplace/alpha/open-beta-source-contract";

const ALLOWED = {
  MAPABLE_MARKETPLACE_WEB_ALPHA_ENABLED: "true",
  MAPABLE_MARKETPLACE_ALPHA_ALLOWED_USER_IDS: "user-1,user-2",
};
const BETA_ALLOWED: BetaFlags = {
  MAPABLE_MARKETPLACE_OPEN_BETA_ENABLED: "true",
  MAPABLE_MARKETPLACE_EXTERNAL_DATA_ENABLED: "true",
  MAPABLE_MARKETPLACE_BETA_SECURITY_REVIEW_APPROVED: "true",
  MAPABLE_MARKETPLACE_BETA_PRIVACY_REVIEW_APPROVED: "true",
  MAPABLE_MARKETPLACE_BETA_LICENCE_REVIEW_APPROVED: "true",
  MAPABLE_MARKETPLACE_BETA_PUBLISH_APPROVED: "true",
};
const record: ExternalCandidate = {
  source: "openstreetmap-places",
  sourceRecordId: "way:12345",
  title: "Fictional accessible place — sample for schema validation",
  sourceUrl: "https://www.openstreetmap.org/way/12345",
  retrievedAt: "2026-10-30T00:00:00.000Z",
  claimedType: "access-place",
  evidenceState: "human-reviewed",
  reviewerId: "synthetic-reviewer",
  reviewDate: "2026-10-30T00:00:00.000Z",
  licenceDecisionId: "synthetic-licence-review-1",
};
const review: BetaPublicationReview = {
  sourceId: "openstreetmap-places",
  licenceDecisionId: "synthetic-licence-review-1",
  reviewedRecordIds: ["way:12345"],
  allowedDomain: "www.openstreetmap.org",
  approvedByHuman: true, revocationActive: false, maxAgeDays: 7,
};
const NOW = "2026-10-31T00:00:00.000Z";
const APPROVED_SOURCES = {
  ...BETA_SOURCE_REGISTRY,
  "openstreetmap-places": {
    ...BETA_SOURCE_REGISTRY["openstreetmap-places"],
    rightsStatus: "approved" as const,
  },
};

describe("Marketplace closed-alpha web data and invitation gate", () => {
  it("rejects absent, wildcard, wrong and unknown tester identity", () => {
    expect(isWebAlphaAllowed("user-1", ALLOWED)).toBe(true);
    expect(isWebAlphaAllowed("user-2", ALLOWED)).toBe(true);
    expect(isWebAlphaAllowed("user-3", ALLOWED)).toBe(false);
    expect(isWebAlphaAllowed(null, ALLOWED)).toBe(false);
    expect(isWebAlphaAllowed("user-1 ", ALLOWED)).toBe(false);
    expect(isWebAlphaAllowed("user-1", { ...ALLOWED, MAPABLE_MARKETPLACE_WEB_ALPHA_ENABLED: "false" })).toBe(false);
    expect(isWebAlphaAllowed("user-1", {
      MAPABLE_MARKETPLACE_WEB_ALPHA_ENABLED: "true",
    })).toBe(false);
    expect(isWebAlphaAllowed("user-3", {
      MAPABLE_MARKETPLACE_WEB_ALPHA_ENABLED: "true",
      MAPABLE_MARKETPLACE_ALPHA_ALLOWED_USER_IDS: "*",
    })).toBe(false);
  });
  it("blocks production alpha even with a tester on the allowlist", () => {
    expect(isWebAlphaAllowed("user-1", { ...ALLOWED, VERCEL_ENV: "production" })).toBe(false);
  });
  it("keeps exactly eight fictional catalogue records aligned to mobile demo", () => {
    expect(WEB_ALPHA_ITEMS).toHaveLength(8);
    expect(WEB_ALPHA_ITEMS.every((x) => x.provenance === "synthetic")).toBe(true);
    expect(WEB_ALPHA_ITEMS.every((x) => x.id.startsWith("apl-"))).toBe(true);
    expect(WEB_ALPHA_ITEMS.filter((x) => x.risk === "review")).toHaveLength(4);
  });
  it("filters by functional access and risk, not diagnosis", () => {
    const found = alphaWebFilter("aac");
    expect(found.map((x) => x.id)).toEqual(["apl-03", "apl-08"]);
    expect(alphaWebFilter("", "review")).toHaveLength(4);
    expect(alphaWebFilter("zzzzz")).toHaveLength(0);
  });
  it("allows planning only for lower-risk examples and blocks duplicates", () => {
    expect(togglePlanningItem([], "apl-01")).toEqual(["apl-01"]);
    expect(togglePlanningItem(["apl-01"], "apl-01")).toEqual([]);
    expect(() => togglePlanningItem([], "apl-05")).toThrow(/review/);
    expect(() => togglePlanningItem([], "not-found")).toThrow();
    expect(alphaPlanSubtotal(["apl-01", "apl-02"])).toBe(15700);
    expect(() => alphaPlanSubtotal(["apl-01", "apl-01"])).toThrow();
    expect(() => alphaPlanSubtotal(["apl-05"])).toThrow();
  });
  it("supports three-item comparison, including specialist-review examples", () => {
    const compared = ["apl-01", "apl-04", "apl-08"];
    expect(() => toggleCompareItem(compared, "apl-02")).toThrow(/three/);
    expect(toggleCompareItem(compared, "apl-04")).toEqual(["apl-01", "apl-08"]);
  });
  it("exports only a synthetic, local-only test note without personal fields", () => {
    const note = makeAlphaTrialNote(["compare", "accessibility"], "Labels were clear.");
    expect(note).toMatch(/not automatically sent/i);
    expect(note).toContain("[x] Compare");
    expect(note).toContain("Labels were clear.");
    expect(() => makeAlphaTrialNote([], "X".repeat(501))).toThrow();
  });
});

describe("External data progression to open-beta is fail-closed", () => {
  it("starts with zero registered adapters and zero published records", () => {
    expect(BETA_CONNECTED_ADAPTERS).toEqual([]);
    expect(BETA_PUBLISHED_RECORDS).toEqual([]);
    expect(BETA_SOURCE_REGISTRY["ndis-commission-register"].classification).toBe("provider-directory");
    expect(BETA_SOURCE_REGISTRY["ndia-market-aggregates"].classification).toBe("market-statistic");
    expect(BETA_SOURCE_REGISTRY["openstreetmap-places"].classification).toBe("access-place");
    expect(BETA_SOURCE_REGISTRY["consented-supplier-feed"].classification).toBe("supplier-offer");
  });
  it("requires every independent review switch", () => {
    expect(resolveBetaPhase({})).toBe("closed-alpha");
    for (const key of Object.keys(BETA_ALLOWED) as Array<keyof BetaFlags>) {
      expect(resolveBetaPhase({ ...BETA_ALLOWED, [key]: "false" })).toBe("closed-alpha");
    }
    expect(resolveBetaPhase(BETA_ALLOWED)).toBe("open-beta-readonly");
  });
  it("rejects an external record while any gate remains closed", () => {
    expect(() => publishExternalReadOnlyCandidate(record, review, {}, NOW)).toThrow(/disabled/);
    expect(() => publishExternalReadOnlyCandidate(
      record, review, BETA_ALLOWED, NOW,
    )).toThrow(/licence gate/);
    expect(() => publishExternalReadOnlyCandidate(
      record, { ...review, allowedDomain: "unexpected.example" },
      BETA_ALLOWED, NOW, APPROVED_SOURCES,
    )).toThrow(/source domain/);
  });
  it("rejects unreviewed records, rights exceptions and forged source types", () => {
    expect(() => publishExternalReadOnlyCandidate({ ...record, evidenceState: "external-unverified" }, review, BETA_ALLOWED, NOW, APPROVED_SOURCES)).toThrow();
    expect(() => publishExternalReadOnlyCandidate(record, { ...review, revocationActive: true }, BETA_ALLOWED, NOW, APPROVED_SOURCES)).toThrow();
    expect(() => publishExternalReadOnlyCandidate({ ...record, claimedType: "supplier-offer" }, review, BETA_ALLOWED, NOW, APPROVED_SOURCES)).toThrow();
    expect(() => publishExternalReadOnlyCandidate({ ...record, licenceDecisionId: "wrong" }, review, BETA_ALLOWED, NOW, APPROVED_SOURCES)).toThrow();
  });
  it("rejects cross-host, insecure, malformed and stale record URLs", () => {
    const urls = [
      "http://www.openstreetmap.org/way/12345",
      "https://untrusted.example/way/12345",
      "https://user:pass@www.openstreetmap.org/way/12345",
      "javascript:alert(1)",
    ];
    for (const sourceUrl of urls) {
      expect(() => publishExternalReadOnlyCandidate({ ...record, sourceUrl }, review, BETA_ALLOWED, NOW, APPROVED_SOURCES)).toThrow();
    }
    expect(() => publishExternalReadOnlyCandidate(record, review, BETA_ALLOWED,
      "2027-01-01T00:00:00.000Z", APPROVED_SOURCES)).toThrow(/stale/);
  });
  it("permits only source-dated, read-only nonpayable directory evidence", () => {
    const value = publishExternalReadOnlyCandidate(record, review, BETA_ALLOWED, NOW, APPROVED_SOURCES);
    expect(value.id).toContain("openstreetmap-places");
    expect(value.kind).toBe("access-place");
    expect(value.priceCents).toBeNull();
    expect(value.verifiedSupplier).toBe(false);
    expect(value.canPurchase).toBe(false);
    expect(value.disclaimer).toContain("No supplier suitability");
  });
});
