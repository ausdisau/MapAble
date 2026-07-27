import { afterEach, describe, expect, it, vi } from "vitest";

import { adsenseAdvertisingProvider } from "@/components/ads/adsense-provider";
import {
  AD_UNIT_REGISTRY,
  EXPECTED_FOOTER_MONETIZATION,
  getAdUnit,
} from "@/lib/ads/ad-unit";
import {
  canRenderAdSenseDisplayUnit,
  getAdSenseFooterSlot,
  isAdSenseEnabled,
} from "@/lib/ads/adsense-config";
import { isContentRichMarketingPath } from "@/lib/ads/content-rich-routes";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("ad unit registry", () => {
  it("resolves marketing.footer to an AdSense display unit", () => {
    const unit = getAdUnit("marketing.footer");
    expect(unit).toEqual(AD_UNIT_REGISTRY["marketing.footer"]);
    expect(unit?.provider).toBe("adsense");
    expect(unit?.format).toBe("display");
    expect(unit?.placement).toBe("footer");
    expect(EXPECTED_FOOTER_MONETIZATION).toBe("adsense.marketing.footer");
  });

  it("returns undefined for unknown unit keys", () => {
    expect(getAdUnit("marketing.unknown")).toBeUndefined();
  });
});

describe("content-rich route gate", () => {
  it("allows content-rich marketing paths", () => {
    expect(isContentRichMarketingPath("/")).toBe(true);
    expect(isContentRichMarketingPath("/resources")).toBe(true);
    expect(isContentRichMarketingPath("/guides")).toBe(true);
    expect(isContentRichMarketingPath("/guides/nsw/sydney")).toBe(true);
    expect(isContentRichMarketingPath("/about")).toBe(true);
    expect(isContentRichMarketingPath("/contact")).toBe(true);
  });

  it("blocks thin CTA-heavy paths", () => {
    expect(isContentRichMarketingPath("/telehealth")).toBe(false);
    expect(isContentRichMarketingPath("/peer")).toBe(false);
    expect(isContentRichMarketingPath("/providers")).toBe(false);
    expect(isContentRichMarketingPath("/pricing")).toBe(false);
  });
});

describe("AdSense config and provider", () => {
  it("requires production and a footer slot to render", () => {
    expect(
      canRenderAdSenseDisplayUnit({
        NODE_ENV: "development",
        NEXT_PUBLIC_ADSENSE_FOOTER_SLOT: "1234567890",
      }),
    ).toBe(false);

    expect(
      canRenderAdSenseDisplayUnit({
        NODE_ENV: "production",
        NEXT_PUBLIC_ADSENSE_ENABLED: "false",
        NEXT_PUBLIC_ADSENSE_FOOTER_SLOT: "1234567890",
      }),
    ).toBe(false);

    expect(
      canRenderAdSenseDisplayUnit({
        NODE_ENV: "production",
        NEXT_PUBLIC_ADSENSE_FOOTER_SLOT: "",
      }),
    ).toBe(false);

    expect(
      canRenderAdSenseDisplayUnit({
        NODE_ENV: "production",
        NEXT_PUBLIC_ADSENSE_FOOTER_SLOT: "1234567890",
      }),
    ).toBe(true);
  });

  it("reads the footer slot from env", () => {
    expect(
      getAdSenseFooterSlot({ NEXT_PUBLIC_ADSENSE_FOOTER_SLOT: " 99 " }),
    ).toBe("99");
    expect(getAdSenseFooterSlot({})).toBeUndefined();
  });

  it("provider canRender is false without slot / when disabled", () => {
    const unit = getAdUnit("marketing.footer");
    expect(unit).toBeDefined();
    if (!unit) return;

    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_FOOTER_SLOT", "");
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_ENABLED", "");
    expect(adsenseAdvertisingProvider.canRender(unit)).toBe(false);

    vi.stubEnv("NEXT_PUBLIC_ADSENSE_FOOTER_SLOT", "1234567890");
    expect(adsenseAdvertisingProvider.canRender(unit)).toBe(true);

    vi.stubEnv("NEXT_PUBLIC_ADSENSE_ENABLED", "false");
    expect(adsenseAdvertisingProvider.canRender(unit)).toBe(false);
    expect(isAdSenseEnabled(process.env)).toBe(false);
  });
});
