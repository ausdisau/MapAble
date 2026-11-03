import { describe, expect, it } from "vitest";
import { CLOSED_ALPHA_ITEMS, canIngestExternal, prepareAlphaBasket, assertPaymentMode } from "../packages/marketplace-inclusive/src/alpha-catalogue";
describe("Marketplace closed-alpha safety gates", () => {
  it("never ingests external sources in closed-alpha", () => {
    expect(canIngestExternal({ stage:"closed-alpha",externalCataloguesEnabled:true,approvedSources:["wikidata"],humanReviewed:true},"wikidata")).toBe(false);
  });
  it("needs explicit beta review, source allowlist and switch", () => {
    expect(canIngestExternal({ stage:"open-beta",externalCataloguesEnabled:true,approvedSources:["wikidata"],humanReviewed:true},"wikidata")).toBe(true);
    expect(canIngestExternal({ stage:"open-beta",externalCataloguesEnabled:true,approvedSources:[],humanReviewed:true},"wikidata")).toBe(false);
  });
  it("uses only canonical sample prices and never a payable order", () => {
    expect(prepareAlphaBasket(["alpha-aac-board","alpha-reacher"])).toEqual({items:[CLOSED_ALPHA_ITEMS[0],CLOSED_ALPHA_ITEMS[1]],totalCents:7400,payable:false});
    expect(() => prepareAlphaBasket(["alpha-hoist"])).toThrow("ALPHA_ITEM_NOT_ORDERABLE");
    expect(() => prepareAlphaBasket(["alpha-switch-mount"])).toThrow("ALPHA_ITEM_NOT_ORDERABLE");
    expect(() => prepareAlphaBasket(["missing"])).toThrow("ALPHA_ITEM_NOT_ORDERABLE");
  });
  it("refuses Stripe live and any external checkout", () => {
    expect(() => assertPaymentMode({alpha:true,stripeLiveMode:false,externalCheckoutEnabled:false})).not.toThrow();
    expect(() => assertPaymentMode({alpha:true,stripeLiveMode:true,externalCheckoutEnabled:false})).toThrow();
    expect(() => assertPaymentMode({alpha:true,stripeLiveMode:false,externalCheckoutEnabled:true})).toThrow();
  });
});
