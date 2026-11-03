import { describe, expect, it } from "vitest";

import {
  MARKETPLACE_PILOT_LISTINGS,
  exportMarketEnquiryDraft,
  filterMarketListings,
  isUnsafeMarketplaceInvoice,
  previewMarketEstimate,
} from "../packages/marketplace-inclusive/src/index";

describe("MapAble inclusive Marketplace pilot",()=>{
  it("offers goods, services, rentals, reuse and digital examples",()=>{
    const kinds=new Set(MARKETPLACE_PILOT_LISTINGS.map((x)=>x.kind));
    expect([...kinds].sort()).toEqual(["digital","product","rental","reuse","service"]);
    expect(MARKETPLACE_PILOT_LISTINGS.every((x)=>x.sellerName.startsWith("Synthetic "))).toBe(true);
  });
  it("shows funding and availability as unassessed",()=>{
    expect(MARKETPLACE_PILOT_LISTINGS.every((x)=>x.funding==="not-assessed"&&x.availability==="unconfirmed")).toBe(true);
    expect(MARKETPLACE_PILOT_LISTINGS.every((x)=>x.evidence.every((e)=>["seller-stated","unknown"].includes(e.status)))).toBe(true);
  });
  it("filters by function and service type without diagnosis",()=>{
    const items=filterMarketListings({kind:"service",access:"remote"});
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((x)=>x.kind==="service"&&x.accessFeatures.includes("remote"))).toBe(true);
  });
  it("keeps safety and high-risk examples out of simple search when requested",()=>{
    const items=filterMarketListings({includeSpecialist:false});
    expect(items.every((x)=>x.risk==="reviewed-low-risk-type")).toBe(true);
  });
  it("resolves illustration prices only from canonical inventory",()=>{
    const first=previewMarketEstimate([{id:"demo-jar",quantity:2}]);
    expect(first.knownItemsSubtotalCents).toBe(4800);
    expect(first.allItemsEstimatedCents).toBe(4800);
    expect(first.checkoutAvailable).toBe(false);
  });
  it("keeps specialist and unpriced items out of a payable total",()=>{
    const p=previewMarketEstimate([{id:"demo-jar",quantity:1},{id:"demo-wheelchair",quantity:1}]);
    expect(p.knownItemsSubtotalCents).toBe(2400);
    expect(p.allItemsEstimatedCents).toBeNull();
    expect(p.needsReview).toBe(true);
  });
  it("rejects restricted equipment, unknown IDs and duplicated items",()=>{
    expect(()=>previewMarketEstimate([{id:"demo-hoist",quantity:1}])).toThrow();
    expect(()=>previewMarketEstimate([{id:"external",quantity:1}])).toThrow();
    expect(()=>previewMarketEstimate([{id:"demo-jar",quantity:1},{id:"demo-jar",quantity:1}])).toThrow();
  });
  it("rejects zero, fractional and high quantities",()=>{
    for(const quantity of [0,1.1,6,-1]){
      expect(()=>previewMarketEstimate([{id:"demo-jar",quantity}])).toThrow();
    }
  });
  it("rejects empty and oversized cart inputs",()=>{
    expect(()=>previewMarketEstimate([])).toThrow();
    const lines=Array.from({length:9},(_,i)=>({id:MARKETPLACE_PILOT_LISTINGS[i].id,quantity:1}));
    expect(()=>previewMarketEstimate(lines)).toThrow();
  });
  it("exports no private participant identifiers and no sale instruction",()=>{
    const text=exportMarketEnquiryDraft([{id:"demo-jar",quantity:1}],"coordinator");
    expect(text).toContain("NOT SENT");
    expect(text).toContain("NO NDIS");
    expect(text).toContain("does not grant access");
  });
  it("denies generic invoices with marketplace metadata",()=>{
    expect(isUnsafeMarketplaceInvoice({serviceType:"marketplace",lineItems:[]})).toBe(true);
    expect(isUnsafeMarketplaceInvoice({serviceType:"other",lineItems:[{metadata:{productId:"demo-jar"}}]})).toBe(true);
    expect(isUnsafeMarketplaceInvoice({serviceType:"other",lineItems:[{metadata:{marketplaceListingId:"x"}}]})).toBe(true);
    expect(isUnsafeMarketplaceInvoice({serviceType:"care",lineItems:[{metadata:{bookingId:"b"}}]})).toBe(false);
  });
});
