import { describe, expect, it } from "vitest";

import {
  reviewA2AReadOnlyTask,
  REMOTE_AGENT_TRANSPORT_ENABLED,
  MCP_EXECUTION_ENABLED,
  type A2AApprovalEvidence,
} from "@/lib/marketplace/agentic-lab/a2a-mcp-boundary";
import {
  mayReconcilePr10WithAgentic,
  projectPr10SyntheticItem,
  type Pr10CatalogueItem,
} from "@/lib/marketplace/agentic-lab/pr10-bridge";
import {
  evaluateSaleorConnection,
  prepareSaleorPublicQuery,
  projectSaleorPublicResponse,
  SALEOR_PUBLIC_NETWORK_ENABLED,
} from "@/lib/marketplace/agentic-lab/saleor-public-query";

const samplePr10: Pr10CatalogueItem = {
  id: "alpha-reacher",
  name: "Easy-grip reacher",
  kind: "product",
  priceCents: 2900,
  safety: "low-risk-demo",
  seller: "Fictional seller",
  evidence: {
    source: "synthetic",
    sourceId: "seed:reacher",
    fetchedAt: "2026-10-31",
    licence: "original synthetic data",
    evidenceStatus: "synthetic",
  },
};
const saleorFixture = {
  data: { products: {
    edges: [{ node: { id: "product-demo-1", name: "Fictional switch mount",
      variants: [{ id: "variant-demo-1", name: "Demo variant" }] } }],
  } },
};
function validEvidence(): A2AApprovalEvidence {
  return {
    core: {
      source: "server_resolved_mapable_core",
      sessionAuthenticated: true,
      humanUserId: "participant-1",
      participantId: "participant-1",
      tenantId: "tenant-a",
      hasDecisionSpecificAuthority: true,
    },
    consent: {
      source: "server_checked_consent_grant",
      receiptId: "consent-receipt-1",
      subjectParticipantId: "participant-1",
      grantedByHumanUserId: "participant-1",
      scope: "public_marketplace_catalogue.search",
      purpose: "preview_public_offers",
      recipientAgentId: "approved-provider-agent-1",
      tenantId: "tenant-a",
      expiresAt: "2026-11-02T11:00:00.000Z",
      revoked: false,
      verifiedAt: "2026-11-02T10:29:55.000Z",
      currentGrantRechecked: true,
    },
    agent: {
      source: "server_verified_agent_registry",
      agentId: "approved-provider-agent-1",
      tenantId: "tenant-a",
      enabled: true,
      transportAuthenticated: true,
      approvedTools: ["public_marketplace_catalogue.search"],
    },
    task: {
      taskId: "task-1",
      nonce: "nonce-1",
      participantId: "participant-1",
      tenantId: "tenant-a",
      fromAgentId: "approved-provider-agent-1",
      toAgentId: "mapable-marketplace-public-broker",
      audience: "mapable-marketplace-public-broker",
      purpose: "preview_public_offers",
      tool: "public_marketplace_catalogue.search",
      requestedData: "public",
      expiresAt: "2026-11-02T10:35:00.000Z",
    },
    replayNonceAlreadySeen: false,
    evaluatedAt: "2026-11-02T10:30:00.000Z",
  };
}

describe("PR #10 independent catalogue reconciliation", () => {
  it("preserves source provenance without granting checkout authority", () => {
    const item = projectPr10SyntheticItem(samplePr10);
    expect(item.source).toBe("pr10_draft_synthetic");
    expect(item.evidenceSourceId).toBe("seed:reacher");
    expect(item.checkoutAllowed).toBe(false);
    expect(item.sellerRealIdentityVerified).toBe(false);
    expect(item.ndisFunding).toBe("NOT_DETERMINED");
  });
  it("requires separate specialist review for a powered or blocked sample", () => {
    const item = projectPr10SyntheticItem({
      ...samplePr10, id: "alpha-hoist", safety: "blocked", priceCents: null,
    });
    expect(item.needsSpecialistReview).toBe(true);
    expect(item.checkoutAllowed).toBe(false);
  });
  it("does not treat an AT product bridge as authority over care services", () => {
    expect(projectPr10SyntheticItem({
      ...samplePr10, id: "synthetic-service", kind: "service",
    }).needsSpecialistReview).toBe(true);
  });
  it("rejects non-synthetic and malformed-price input", () => {
    expect(() => projectPr10SyntheticItem({
      ...samplePr10,
      evidence: { ...samplePr10.evidence, source: "approved-supplier", evidenceStatus: "reviewed" },
    })).toThrow("PR10_NON_SYNTHETIC_SOURCE_NOT_APPROVED");
    expect(() => projectPr10SyntheticItem({ ...samplePr10, priceCents: -50 })).toThrow();
  });
  it("holds integration until PR #10 merges and humans approve contracts", () => {
    expect(mayReconcilePr10WithAgentic({
      pr10Merged: false,
      catalogueContractReviewed: true,
      explicitHumanIntegrationApproval: true,
    }).approvedForIntegration).toBe(false);
    expect(mayReconcilePr10WithAgentic({
      pr10Merged: true,
      catalogueContractReviewed: false,
      explicitHumanIntegrationApproval: true,
    }).approvedForIntegration).toBe(false);
  });
});

describe("Saleor public GraphQL mapping without a network connection", () => {
  it("only specifies public catalogue fields and a fixed channel", () => {
    const request = prepareSaleorPublicQuery("australia-synthetic");
    expect(request.operationName).toBe("MapAblePublicCatalogue");
    expect(request.query).toContain("products(first: 6, channel: $channel)");
    expect(request.query.toLowerCase()).not.toContain("mutation");
    expect(request.query).not.toContain("checkout");
    expect(request.variables.channel).toBe("australia-synthetic");
  });
  it("refuses unvalidated channel strings", () => {
    for (const input of ["", "AU", "australia\nmutation", "http://example.com", "abc / x"]) {
      expect(() => prepareSaleorPublicQuery(input)).toThrow();
    }
  });
  it("preserves unknown price, vendor, availability and funding status", () => {
    const items = projectSaleorPublicResponse(
      saleorFixture, "australia-synthetic", "2026-11-02T10:00:00Z",
    );
    expect(items).toHaveLength(1);
    expect(items[0].productName).toBe("Fictional switch mount");
    expect(items[0].variantIds).toEqual(["variant-demo-1"]);
    expect(items[0].samplePriceCents).toBeNull();
    expect(items[0].available).toBe("NOT_VERIFIED");
    expect(items[0].ndisFunding).toBe("NOT_DETERMINED");
    expect(items[0].checkoutEnabled).toBe(false);
  });
  it("refuses GraphQL errors, partial responses and oversized data", () => {
    expect(() => projectSaleorPublicResponse({ errors: [{ message: "Denied" }] },
      "australia", "2026-11-02T10:00:00Z")).toThrow();
    expect(() => projectSaleorPublicResponse({ data: {} },
      "australia", "2026-11-02T10:00:00Z")).toThrow();
    expect(() => projectSaleorPublicResponse({ data: { products: { edges:
      Array.from({ length: 7 }, () => saleorFixture.data.products.edges[0]) } } },
      "australia", "2026-11-02T10:00:00Z")).toThrow();
  });
  it("contains no active network, checkout or credentials", () => {
    expect(SALEOR_PUBLIC_NETWORK_ENABLED).toBe(false);
    expect(evaluateSaleorConnection().liveConnectionEnabled).toBe(false);
    expect(evaluateSaleorConnection().requiredApprovals.length).toBeGreaterThan(2);
  });
});

describe("A2A/MCP server-resolution and participant-consent contract", () => {
  it("allows only a synthetic dry-run result even with complete staged evidence", () => {
    const decision = reviewA2AReadOnlyTask(validEvidence());
    expect(decision.decision).toBe("DRY_RUN_READ_ONLY");
    expect(decision.executionAllowed).toBe(false);
    expect(REMOTE_AGENT_TRANSPORT_ENABLED).toBe(false);
    expect(MCP_EXECUTION_ENABLED).toBe(false);
  });
  it("blocks missing authentication or participant authority", () => {
    const base = validEvidence();
    expect(reviewA2AReadOnlyTask({ ...base, core: null }).decision).toBe("HOLD");
    expect(reviewA2AReadOnlyTask({ ...base,
      core: { ...base.core!, sessionAuthenticated: false } }).decision).toBe("HOLD");
    expect(reviewA2AReadOnlyTask({ ...base,
      core: { ...base.core!, hasDecisionSpecificAuthority: false } }).decision).toBe("HOLD");
  });
  it("rejects unauthorised agents and untrusted transport", () => {
    const base = validEvidence();
    expect(reviewA2AReadOnlyTask({ ...base, agent: null }).decision).toBe("HOLD");
    expect(reviewA2AReadOnlyTask({ ...base,
      agent: { ...base.agent!, transportAuthenticated: false } }).decision).toBe("HOLD");
  });
  it("refuses other tenants, audiences and impersonated participants", () => {
    const base = validEvidence();
    expect(reviewA2AReadOnlyTask({ ...base,
      task: { ...base.task, tenantId: "tenant-b" } }).decision).toBe("HOLD");
    expect(reviewA2AReadOnlyTask({ ...base,
      task: { ...base.task, participantId: "another" } }).decision).toBe("HOLD");
    expect(reviewA2AReadOnlyTask({ ...base,
      task: { ...base.task, toAgentId: "malicious-agent" } }).decision).toBe("HOLD");
  });
  it("refuses expiry, excessive TTL and duplicate nonce", () => {
    const base = validEvidence();
    expect(reviewA2AReadOnlyTask({ ...base, replayNonceAlreadySeen: true }).decision).toBe("HOLD");
    expect(reviewA2AReadOnlyTask({ ...base,
      task: { ...base.task, expiresAt: "2026-11-02T10:29:59Z" } }).decision).toBe("HOLD");
    expect(reviewA2AReadOnlyTask({ ...base,
      task: { ...base.task, expiresAt: "2026-11-02T11:00:00Z" } }).decision).toBe("HOLD");
  });
  it("requires current human consent and a live grant recheck", () => {
    const base = validEvidence();
    expect(reviewA2AReadOnlyTask({ ...base, consent: null }).decision).toBe("HOLD");
    expect(reviewA2AReadOnlyTask({ ...base,
      consent: { ...base.consent!, revoked: true } }).decision).toBe("HOLD");
    expect(reviewA2AReadOnlyTask({ ...base,
      consent: { ...base.consent!, currentGrantRechecked: false } }).decision).toBe("HOLD");
    expect(reviewA2AReadOnlyTask({ ...base,
      consent: { ...base.consent!, verifiedAt: "2026-11-02T10:20:00Z" } }).decision).toBe("HOLD");
  });
  it("rejects consent for different recipient, purpose or scope", () => {
    const base = validEvidence();
    expect(reviewA2AReadOnlyTask({ ...base,
      consent: { ...base.consent!, recipientAgentId: "other-agent" } }).decision).toBe("HOLD");
    expect(reviewA2AReadOnlyTask({ ...base,
      consent: { ...base.consent!, grantedByHumanUserId: "provider-agent" } }).decision).toBe("HOLD");
    expect(reviewA2AReadOnlyTask({ ...base,
      consent: { ...base.consent!, scope: "public_provider_evidence.read" } }).decision).toBe("HOLD");
  });
  it("blocks worker clearance, payments and private or health information even with consent", () => {
    const base = validEvidence();
    for (const tool of ["worker.clearance.read", "stripe.payment.capture",
      "provider.inquiry.send", "saleor.checkout.create"] as const) {
      expect(reviewA2AReadOnlyTask({ ...base, task: { ...base.task, tool } }).decision).toBe("HOLD");
    }
    expect(reviewA2AReadOnlyTask({ ...base,
      task: { ...base.task, requestedData: "health" } }).decision).toBe("HOLD");
  });
});
