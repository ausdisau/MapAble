/**
 * Compatibility projection for DRAFT Marketplace PR #10 (not on main).
 * No import from its unmerged branch, so PR #14 remains independently testable.
 * Example catalogue data is never a verified seller, price, NDIS support or order.
 */
export type Pr10AlphaKind = "product" | "rental" | "reuse" | "service";
export interface Pr10CatalogueItem {
  readonly id: string;
  readonly name: string;
  readonly kind: Pr10AlphaKind;
  readonly priceCents: number | null;
  readonly safety: "low-risk-demo" | "specialist-enquiry" | "blocked";
  readonly seller: string;
  readonly evidence: {
    readonly source: "synthetic" | "wikidata" | "approved-supplier";
    readonly sourceId: string;
    readonly fetchedAt: string;
    readonly licence: string;
    readonly evidenceStatus: "synthetic" | "unverified" | "reviewed";
  };
}
export interface AgenticAlphaPreview {
  readonly source: "pr10_draft_synthetic";
  readonly itemId: string;
  readonly label: string;
  readonly kind: Pr10AlphaKind;
  readonly samplePriceCents: number | null;
  readonly evidenceSourceId: string;
  readonly observedAt: string;
  readonly verification: "fictional_unverified";
  readonly needsSpecialistReview: boolean;
  readonly checkoutAllowed: false;
  readonly ndisFunding: "NOT_DETERMINED";
  readonly sellerRealIdentityVerified: false;
}
export function projectPr10SyntheticItem(item: Pr10CatalogueItem): AgenticAlphaPreview {
  if (!item.id.trim() || !item.name.trim() || !item.evidence.sourceId.trim()) {
    throw new Error("PR10_IDENTITY_OR_EVIDENCE_MISSING");
  }
  if (item.evidence.source !== "synthetic" || item.evidence.evidenceStatus !== "synthetic") {
    throw new Error("PR10_NON_SYNTHETIC_SOURCE_NOT_APPROVED");
  }
  if (item.priceCents !== null &&
      (!Number.isSafeInteger(item.priceCents) || item.priceCents < 0)) {
    throw new Error("PR10_SAMPLE_PRICE_INVALID");
  }
  return {
    source: "pr10_draft_synthetic",
    itemId: item.id,
    label: item.name,
    kind: item.kind,
    samplePriceCents: item.priceCents,
    evidenceSourceId: item.evidence.sourceId,
    observedAt: item.evidence.fetchedAt,
    verification: "fictional_unverified",
    needsSpecialistReview: item.safety !== "low-risk-demo" || item.kind === "service",
    checkoutAllowed: false,
    ndisFunding: "NOT_DETERMINED",
    sellerRealIdentityVerified: false,
  };
}
export function mayReconcilePr10WithAgentic(input: {
  readonly pr10Merged: boolean;
  readonly catalogueContractReviewed: boolean;
  readonly explicitHumanIntegrationApproval: boolean;
}): { readonly approvedForIntegration: boolean; readonly reason: string } {
  const allowed = input.pr10Merged &&
    input.catalogueContractReviewed && input.explicitHumanIntegrationApproval;
  return {
    approvedForIntegration: allowed,
    reason: allowed
      ? "Code integration may be reviewed; real commerce remains independently gated."
      : "Keep PR #10 and PR #14 separate until the catalogue contract, merge state and human approval are verified.",
  };
}
