/**
 * Closed-alpha catalogue gateway shared by web and Expo.
 * External sources are not allowed to set prices, seller verification or safety.
 */
export type AlphaSource = "synthetic" | "wikidata" | "approved-supplier";
export type AlphaStage = "closed-alpha" | "open-beta";
export type AlphaEvidence = {
  source: AlphaSource;
  sourceId: string;
  fetchedAt: string;
  licence: string;
  evidenceStatus: "synthetic" | "unverified" | "reviewed";
};
export type AlphaItem = {
  id: string;
  name: string;
  description: string;
  kind: "product" | "rental" | "reuse" | "service";
  category: "daily-living" | "communication" | "technology" | "mobility";
  priceCents: number | null;
  evidence: AlphaEvidence;
  safety: "low-risk-demo" | "specialist-enquiry" | "blocked";
  seller: string;
};
export const CLOSED_ALPHA_ITEMS: readonly AlphaItem[] = [
  { id: "alpha-aac-board", name: "Portable communication board", description: "Fictional paper AAC demonstration product.", kind: "product", category: "communication", priceCents: 4500, evidence: {source:"synthetic",sourceId:"seed:aac-board",fetchedAt:"2026-10-31",licence:"original synthetic data",evidenceStatus:"synthetic"}, safety:"low-risk-demo", seller:"Fictional seller" },
  { id: "alpha-reacher", name: "Easy-grip reacher", description: "Fictional everyday access product.", kind: "product", category: "daily-living", priceCents: 2900, evidence: {source:"synthetic",sourceId:"seed:reacher",fetchedAt:"2026-10-31",licence:"original synthetic data",evidenceStatus:"synthetic"}, safety:"low-risk-demo", seller:"Fictional seller" },
  { id: "alpha-switch-mount", name: "Tablet switch mount", description: "Illustrative fitted mount; specialist review required.", kind: "rental", category: "technology", priceCents: null, evidence: {source:"synthetic",sourceId:"seed:mount",fetchedAt:"2026-10-31",licence:"original synthetic data",evidenceStatus:"synthetic"}, safety:"specialist-enquiry", seller:"Fictional seller" },
  { id: "alpha-hoist", name: "Powered transfer hoist", description: "Restricted illustrative item; not available to order.", kind: "product", category: "mobility", priceCents: null, evidence: {source:"synthetic",sourceId:"seed:hoist",fetchedAt:"2026-10-31",licence:"original synthetic data",evidenceStatus:"synthetic"}, safety:"blocked", seller:"Fictional seller" },
];
export interface AlphaSettings {
  stage: AlphaStage;
  externalCataloguesEnabled: boolean;
  approvedSources: readonly AlphaSource[];
  humanReviewed: boolean;
}
export function canIngestExternal(settings: AlphaSettings, source: AlphaSource): boolean {
  return settings.stage === "open-beta" && settings.externalCataloguesEnabled
    && settings.humanReviewed && source !== "synthetic"
    && settings.approvedSources.includes(source);
}
export function listAlphaItems(search = ""): readonly AlphaItem[] {
  const q = search.trim().toLocaleLowerCase("en-AU");
  return CLOSED_ALPHA_ITEMS.filter((item) => !q || (item.name + " " + item.description).toLocaleLowerCase("en-AU").includes(q));
}
export function prepareAlphaBasket(ids: readonly string[]): { items: AlphaItem[]; totalCents: number; payable: false } {
  if (ids.length > 8) throw new Error("ALPHA_BASKET_LIMIT");
  const items = ids.map((id) => CLOSED_ALPHA_ITEMS.find((item) => item.id === id));
  if (items.some((item) => !item || item.safety !== "low-risk-demo" || item.priceCents === null)) {
    throw new Error("ALPHA_ITEM_NOT_ORDERABLE");
  }
  const safeItems = items as AlphaItem[];
  return { items: safeItems, totalCents: safeItems.reduce((sum, item) => sum + (item.priceCents ?? 0), 0), payable: false };
}
export function assertPaymentMode(input: { alpha: boolean; stripeLiveMode: boolean; externalCheckoutEnabled: boolean }): void {
  if (!input.alpha || input.stripeLiveMode || input.externalCheckoutEnabled) throw new Error("ALPHA_PAYMENT_FORBIDDEN");
}
