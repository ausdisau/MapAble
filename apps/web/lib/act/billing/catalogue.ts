/**
 * Example NDIS support-item catalogue rows for Act draft calculation.
 * Rates are illustrative unit caps (cents/hour) — never auto-approved.
 */

export type ActCatalogueItem = {
  supportItemCode: string;
  name: string;
  unit: "hour" | "each";
  /** National price guide style unit rate in cents (example). */
  unitRateCents: number;
  notes: string;
};

export const ACT_EXAMPLE_CATALOGUE: readonly ActCatalogueItem[] = [
  {
    supportItemCode: "10_016_0102_5_3",
    name: "Employment Supports — Workplace Assistance",
    unit: "hour",
    unitRateCents: 6577, // example $65.77/hr
    notes: "Example employment support item for Act draft calculator",
  },
  {
    supportItemCode: "02_051_0108_1_1",
    name: "Transport — General",
    unit: "hour",
    unitRateCents: 10000, // example $100.00/hr (or per trip band)
    notes: "Example general transport item for Act draft calculator",
  },
] as const;

const byCode = new Map(
  ACT_EXAMPLE_CATALOGUE.map((item) => [item.supportItemCode, item]),
);

export function getActCatalogueItem(
  supportItemCode: string,
): ActCatalogueItem | null {
  return byCode.get(supportItemCode) ?? null;
}

export function listActCatalogueItems(): ActCatalogueItem[] {
  return [...ACT_EXAMPLE_CATALOGUE];
}
