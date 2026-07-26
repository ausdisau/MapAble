/**
 * New Zealand funding / transport scheme parameters (Year-One foundation).
 * Parallel to AU NDIS framing — not a live payment integration claim.
 */

export type MapAbleJurisdiction = "AU" | "NZ";

export const SUPPORTED_LOCALES = ["en-AU", "en-NZ"] as const;
export type MapAbleLocale = (typeof SUPPORTED_LOCALES)[number];

export const JURISDICTION_DEFAULTS: Record<
  MapAbleJurisdiction,
  {
    locale: MapAbleLocale;
    currency: "AUD" | "NZD";
    timezone: string;
    fundingLabel: string;
  }
> = {
  AU: {
    locale: "en-AU",
    currency: "AUD",
    timezone: "Australia/Sydney",
    fundingLabel: "NDIS",
  },
  NZ: {
    locale: "en-NZ",
    currency: "NZD",
    timezone: "Pacific/Auckland",
    fundingLabel: "Whaikaha / Ministry of Health",
  },
};

/**
 * Total Mobility (NZ) — regional councils subsidise approved taxi / specialist
 * transport. Typical subsidy is 75% of the fare for eligible cardholders;
 * exact rates and caps vary by region and are partner-configured.
 */
export const TOTAL_MOBILITY_SCHEME = {
  id: "nz_total_mobility",
  jurisdiction: "NZ" as const,
  name: "Total Mobility",
  authority: "Regional councils (NZ) / Waka Kotahi framework",
  /** Default subsidy fraction when a partner has not supplied a regional override. */
  defaultSubsidyFraction: 0.75,
  fareCurrency: "NZD" as const,
  notes: [
    "Eligibility is card-based and region-specific — MapAble must not invent eligibility.",
    "Subsidy percentage and trip caps are configured per regional partner.",
    "Year-One: configuration + quote display only; no live Total Mobility claiming.",
  ],
} as const;

export type RegionalTransportSubsidy = {
  schemeId: string;
  subsidyFraction: number;
  currency: "AUD" | "NZD";
  regionCode?: string;
};

export function resolveTransportSubsidyHint(
  jurisdiction: MapAbleJurisdiction,
  regionCode?: string,
): RegionalTransportSubsidy | null {
  if (jurisdiction !== "NZ") return null;
  return {
    schemeId: TOTAL_MOBILITY_SCHEME.id,
    subsidyFraction: TOTAL_MOBILITY_SCHEME.defaultSubsidyFraction,
    currency: TOTAL_MOBILITY_SCHEME.fareCurrency,
    regionCode,
  };
}

export function isSupportedLocale(locale: string): locale is MapAbleLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(locale);
}

export function isMapAbleJurisdiction(
  value: string,
): value is MapAbleJurisdiction {
  return value === "AU" || value === "NZ";
}

export function localeForJurisdiction(
  jurisdiction: MapAbleJurisdiction,
): MapAbleLocale {
  return JURISDICTION_DEFAULTS[jurisdiction].locale;
}
