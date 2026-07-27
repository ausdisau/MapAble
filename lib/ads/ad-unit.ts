import type { ReactNode } from "react";

/** Extensible provider id — AdSense first; others can plug in later. */
export type AdProviderId = "adsense";

export type AdUnitFormat = "display" | "in_article" | "multiplex";

export type AdUnitPlacement = "footer" | "search" | "article";

/**
 * Meaning-focused ad inventory definition.
 * Describes purpose (key/placement/format), not presentation.
 */
export type AdUnitDefinition = {
  key: string;
  provider: AdProviderId;
  placement: AdUnitPlacement;
  format: AdUnitFormat;
  /** Visible disclosure label, e.g. "Advertisement". */
  disclosureLabel: string;
};

export type AdvertisingUnitProvider = {
  id: AdProviderId;
  canRender(unit: AdUnitDefinition): boolean;
  render(unit: AdUnitDefinition): ReactNode;
};

/** Single source of truth for monetization units. */
export const AD_UNIT_REGISTRY: Record<string, AdUnitDefinition> = {
  "marketing.footer": {
    key: "marketing.footer",
    provider: "adsense",
    placement: "footer",
    format: "display",
    disclosureLabel: "Advertisement",
  },
};

export function getAdUnit(unitKey: string): AdUnitDefinition | undefined {
  return AD_UNIT_REGISTRY[unitKey];
}

/** Design-test / docs expectation for footer monetization. */
export const EXPECTED_FOOTER_MONETIZATION = "adsense.marketing.footer";
