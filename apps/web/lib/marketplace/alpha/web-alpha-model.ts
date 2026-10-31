/**
 * MapAble closed alpha: web copy of the mobile v0.1 synthetic catalogue.
 * Source categories were INSPIRED by the WHO Priority Assistive Products List
 * and NDIS public AT guidance. NONE of these are real product records.
 * Prices, seller names, stock, availability, performance and funding are invented.
 */
export type AlphaItem = {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly function: string;
  readonly cents: number | null;
  readonly risk: "lower" | "review";
  readonly provenance: "synthetic";
};
export type AlphaRiskFilter = "all" | "lower" | "review";

export const WEB_ALPHA_ITEMS: readonly AlphaItem[] = [
  { id: "apl-01", name: "Adapted kitchen grips — example", category: "Daily living",
    function: "Grip and dexterity", cents: 2800, risk: "lower", provenance: "synthetic" },
  { id: "apl-02", name: "Large-print keyboard — example", category: "Vision and computing",
    function: "Low-vision access", cents: 12900, risk: "lower", provenance: "synthetic" },
  { id: "apl-03", name: "Communication picture board — example", category: "Communication",
    function: "AAC", cents: 6900, risk: "lower", provenance: "synthetic" },
  { id: "apl-04", name: "Tablet mount — example", category: "Communication",
    function: "Device positioning", cents: null, risk: "review", provenance: "synthetic" },
  { id: "apl-05", name: "Wheelchair trial — example", category: "Mobility",
    function: "Mobility and fit", cents: null, risk: "review", provenance: "synthetic" },
  { id: "apl-06", name: "Shower chair — example", category: "Self care",
    function: "Bathing and transfers", cents: null, risk: "review", provenance: "synthetic" },
  { id: "apl-07", name: "Noise-reduction headphones — example", category: "Sensory",
    function: "Noise management", cents: 7800, risk: "lower", provenance: "synthetic" },
  { id: "apl-08", name: "AAC training session — example", category: "Services",
    function: "Accessible communication", cents: null, risk: "review", provenance: "synthetic" },
];

export const ALPHA_CLASSIFICATION_SOURCES = [
  {
    source: "WHO Priority Assistive Products List (2016)",
    url: "https://www.who.int/publications/i/item/priority-assistive-products-list",
    use: "Broad product-group inspiration only; not WHO listings or endorsements.",
  },
  {
    source: "NDIA assistive technology guidance",
    url: "https://www.ndis.gov.au/participants/assistive-technology",
    use: "Terminology and risks; not proof of fundability, clinical suitability or price.",
  },
] as const;

export function alphaWebFilter(
  query: string, risk: AlphaRiskFilter = "all",
  items: readonly AlphaItem[] = WEB_ALPHA_ITEMS,
): AlphaItem[] {
  const text = query.trim().toLocaleLowerCase("en-AU").slice(0, 90);
  return items.filter((item) =>
    (risk === "all" || item.risk === risk) &&
    [item.name, item.category, item.function]
      .join(" ").toLocaleLowerCase("en-AU").includes(text)
  );
}

export function alphaItem(id: string): AlphaItem | undefined {
  return WEB_ALPHA_ITEMS.find((item) => item.id === id);
}

export function togglePlanningItem(ids: readonly string[], id: string): string[] {
  const item = alphaItem(id);
  if (!item || item.risk !== "lower" || item.cents === null) {
    throw new Error("This example requires review and cannot enter a priced planning list.");
  }
  if (ids.includes(id)) return ids.filter((value) => value !== id);
  if (ids.length >= 8) throw new Error("The example planning list is full.");
  return [...ids, id];
}

export function toggleCompareItem(ids: readonly string[], id: string): string[] {
  if (!alphaItem(id)) throw new Error("Unknown synthetic item.");
  if (ids.includes(id)) return ids.filter((value) => value !== id);
  if (ids.length >= 3) throw new Error("Compare up to three examples at once.");
  return [...ids, id];
}

export function alphaPlanSubtotal(ids: readonly string[]): number {
  const seen = new Set<string>();
  return ids.reduce((sum, id) => {
    const item = alphaItem(id);
    if (seen.has(id) || !item || item.risk !== "lower" ||
        item.cents === null || !Number.isSafeInteger(item.cents) || item.cents < 0) {
      throw new Error("Invalid synthetic planning list.");
    }
    seen.add(id);
    return sum + item.cents;
  }, 0);
}

export function alphaMoney(cents: number | null): string {
  return cents === null ? "No example price" :
    new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(cents / 100);
}

export type AlphaTrialTask = "discovery" | "compare" | "shortlist" | "exchange" | "accessibility";
export const ALPHA_TRIAL_TASKS: ReadonlyArray<{ id: AlphaTrialTask; label: string }> = [
  { id: "discovery", label: "Find a product by its functional access feature" },
  { id: "compare", label: "Compare a lower-risk and a specialist-review example" },
  { id: "shortlist", label: "Save and remove an item from the private planning list" },
  { id: "exchange", label: "Review how the participant shares and withdraws an enquiry" },
  { id: "accessibility", label: "Test keyboard, screen reader, AAC, switch, zoom or text size" },
];

/** Local-only export. No identities, diagnosis, health information or payment objects. */
export function makeAlphaTrialNote(
  completed: readonly AlphaTrialTask[],
  observation: string,
): string {
  if (observation.length > 500) throw new Error("Keep general observations under 500 characters.");
  return [
    "MAPABLE MARKETPLACE — CLOSED ALPHA LOCAL RESEARCH NOTE",
    "Synthetic research only. Not automatically sent to Australian Disability Ltd.",
    "Do not add names, diagnoses, NDIS plan numbers, addresses or personal details.",
    "",
    ...ALPHA_TRIAL_TASKS.map((task) =>
      (completed.includes(task.id) ? "[x] " : "[ ] ") + task.label),
    "",
    "General observation (unsubmitted):",
    observation.trim() || "No observation recorded.",
  ].join("\n");
}
