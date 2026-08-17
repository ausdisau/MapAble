import { describe, expect, it } from "vitest";

import {
  buildGuidedSearchUrl,
  getSearchResultHref,
  supportAreaLandingRoutes,
  supportAreaToSupportTypeId,
} from "@/lib/marketing/mapable-care-routes";

describe("mapable-care-routes", () => {
  it("maps support areas to public discovery routes", () => {
    expect(supportAreaLandingRoutes.Places).toBe("/accessibility-map");
    expect(supportAreaLandingRoutes["NDIS Help"]).toBe("/ask");
    expect(supportAreaLandingRoutes.Care).toBe("/provider-finder?area=Care");
  });

  it("routes NDIS Help searches to Ask MapAble", () => {
    expect(buildGuidedSearchUrl("transport funding", "NDIS Help")).toBe(
      "/ask?q=transport+funding",
    );
    expect(buildGuidedSearchUrl("", "NDIS Help")).toBe("/ask");
  });

  it("routes other areas to provider finder with area filter", () => {
    expect(buildGuidedSearchUrl("wheelchair transport", "Transport")).toBe(
      "/provider-finder?q=wheelchair+transport&area=Transport",
    );
    expect(buildGuidedSearchUrl("", "Jobs")).toBe("/provider-finder?area=Jobs");
  });

  it("maps search result categories to feature routes", () => {
    expect(getSearchResultHref("Places")).toBe("/accessibility-map");
    expect(getSearchResultHref("NDIS Help")).toBe("/ask");
    expect(getSearchResultHref("Care")).toBe("/provider-finder?area=Care");
  });

  it("maps marketing area query params to provider finder support types", () => {
    expect(supportAreaToSupportTypeId("Care")).toBe("personal-care");
    expect(supportAreaToSupportTypeId("Transport")).toBe("transport");
    expect(supportAreaToSupportTypeId("Jobs")).toBe("employment");
    expect(supportAreaToSupportTypeId("All")).toBeNull();
    expect(supportAreaToSupportTypeId(null)).toBeNull();
  });
});
