/**
 * MapAble Marketplace: commerce reference-design lab only.
 * Every item, supplier, price, availability and evidence value is fictional.
 * Zero routes for real commerce, plan funds, seller contact or provider approval.
 */
export type OfferKind = "product" | "rental" | "service" | "digital" | "reuse";
export type OfferCategory = "daily-living" | "communication" | "computing" | "mobility" | "home" | "creative" | "professional";
export type AccessNeed = "dexterity" | "communication" | "low-vision" | "sensory" | "mobility" | "cognitive" | "remote";
export type OfferRoute = "plan" | "enquire" | "specialist" | "unavailable";
export type ShopperPerspective = "participant" | "supporter" | "coordinator";
export type EvidenceState = "example-statement" | "unknown";

export type OfferEvidence = {
  readonly label: string;
  readonly detail: string;
  readonly state: EvidenceState;
};

export type CommerceOffer = {
  readonly id: string;
  readonly title: string;
  readonly category: OfferCategory;
  readonly kind: OfferKind;
  readonly description: string;
  readonly needs: readonly AccessNeed[];
  readonly route: OfferRoute;
  readonly priceCents: number | null;
  readonly condition: "illustrative-new" | "illustrative-used" | "not-applicable";
  readonly sellerName: "Synthetic seller";
  readonly evidence: readonly OfferEvidence[];
  readonly compatibility: string;
  readonly note: string;
};

export type PlanningLine = { readonly offerId: string; readonly quantity: number };
export type LabFilters = {
  search?: string;
  category?: OfferCategory | "all";
  kind?: OfferKind | "all";
  need?: AccessNeed | "all";
  specialist?: "include" | "exclude";
  order?: "alpha" | "price";
};

export const KIND_LABELS: Readonly<Record<OfferKind, string>> = {
  product: "Products", rental: "Equipment hire", service: "Services",
  digital: "Digital goods", reuse: "Reuse and exchange",
};
export const CATEGORY_LABELS: Readonly<Record<OfferCategory, string>> = {
  "daily-living": "Everyday living", communication: "Communication and AAC",
  computing: "Accessible computing", mobility: "Mobility", home: "Home and bathroom",
  creative: "Creative and learning", professional: "Professional services",
};
export const NEED_LABELS: Readonly<Record<AccessNeed, string>> = {
  dexterity: "Grip and dexterity", communication: "Communication access",
  "low-vision": "Low-vision access", sensory: "Sensory considerations",
  mobility: "Movement and positioning", cognitive: "Plain-language and memory support",
  remote: "Remote participation",
};
export const ROUTE_LABELS: Readonly<Record<OfferRoute, string>> = {
  plan: "Add to planning list", enquire: "Prepare an enquiry",
  specialist: "Specialist review first", unavailable: "Not offered",
};

const unknown = (label: string): OfferEvidence => ({
  label, detail: "Not independently established in this demonstration", state: "unknown",
});
const described = (label: string, detail: string): OfferEvidence => ({
  label, detail, state: "example-statement",
});

/** All evidence is either hypothetical seller text or explicitly unknown. */
function offer(
  id: string, title: string, category: OfferCategory, kind: OfferKind,
  description: string, needs: readonly AccessNeed[], route: OfferRoute,
  priceCents: number | null, condition: CommerceOffer["condition"],
  compatibility: string, note: string,
): CommerceOffer {
  return {
    id, title, category, kind, description, needs, route, priceCents, condition,
    sellerName: "Synthetic seller",
    compatibility, note,
    evidence: [
      described("Example product description", description),
      unknown("Seller identity, business registration and reputation"),
      unknown("Product specifications, safety checks and recalls"),
      unknown("Stock, service availability, warranty and returns"),
      unknown("Actual GST, delivery and NDIS funding status"),
    ],
  };
}

export const COMMERCE_LAB_OFFERS: readonly CommerceOffer[] = [
  offer("demo-jar", "Easy-grip jar opener", "daily-living", "product",
    "Example wide-grip kitchen accessory for reduced hand strength.", ["dexterity"], "plan", 2400,
    "illustrative-new", "Grip size and operating force have not been measured.",
    "A lower-complexity illustrative product; it is not assessed or ready for sale."),
  offer("demo-reacher", "Lightweight reach extender", "daily-living", "product",
    "Example reach tool for retrieving nearby household objects.", ["dexterity", "mobility"], "plan", 3900,
    "illustrative-new", "Maximum load and reach are unknown.",
    "Use must be considered against the person's circumstances."),
  offer("demo-jacket", "Easy-fastening adaptive jacket", "daily-living", "product",
    "Sample apparel with lower-force fastenings and seated-wear considerations.",
    ["dexterity", "mobility"], "plan", 8400, "illustrative-new",
    "Sizes, materials and laundering instructions are unknown.",
    "Fit and accessible returns need seller evidence before real purchase."),
  offer("demo-board", "Portable communication board", "communication", "product",
    "Low-tech picture and text communication example for everyday situations.",
    ["communication", "cognitive"], "plan", 5500, "illustrative-new",
    "Symbols and vocabulary must fit the person's communication preferences.",
    "No speech-language assessment or suitability claim is made."),
  offer("demo-mount", "Adjustable tablet and switch mount", "communication", "product",
    "Illustrative mounting accessory for tablets and access switches.",
    ["communication", "dexterity"], "specialist", null, "illustrative-new",
    "Mounting surface, load and switch compatibility require checking.",
    "Refer to qualified assessment where appropriate."),
  offer("demo-trackball", "Accessible trackball", "computing", "product",
    "Alternative pointing-device example with large movement controls.",
    ["dexterity", "low-vision"], "plan", 12900, "illustrative-new",
    "Operating system and reach requirements have not been tested.",
    "Software and physical compatibility require validation."),
  offer("demo-keyboard", "High-contrast large-key keyboard", "computing", "product",
    "Example keyboard with visually distinct larger key labels.",
    ["low-vision", "dexterity"], "plan", 16900, "illustrative-new",
    "Connectivity and assistive-software compatibility are unknown.",
    "Does not imply fitness for any particular user."),
  offer("demo-headphones", "Noise-reduction headphones", "home", "product",
    "Example headphones intended for managing everyday sound exposure.",
    ["sensory"], "plan", 7900, "illustrative-new",
    "Attenuation and suitability are unknown; not clinical hearing protection.",
    "Avoid broad sensory-health performance claims."),
  offer("demo-home", "Shower chair", "home", "product",
    "Illustrative bathing and seating aid with adjustable features.",
    ["mobility"], "specialist", null, "illustrative-new",
    "Load rating, stability, fit and wet-area suitability are not assessed.",
    "Specialist or trained-supplier review is required before supply."),
  offer("demo-chair", "Adjustable manual wheelchair", "mobility", "product",
    "Illustrative mobility equipment with adjustable seat components.",
    ["mobility"], "specialist", null, "illustrative-new",
    "Seating, fitting, maintenance, load and safety require assessment.",
    "Never present as a one-click purchase in the design lab."),
  offer("demo-rental", "Short-term wheelchair hire", "mobility", "rental",
    "Example equipment hire while waiting for repairs or during travel.",
    ["mobility"], "specialist", null, "not-applicable",
    "Supplier, hygiene, repair, fit, insurance and return terms unknown.",
    "Booking and availability have not been established."),
  offer("demo-repair", "Mobility equipment repair enquiry", "professional", "service",
    "Example request for a qualified equipment maintenance provider.",
    ["mobility"], "enquire", null, "not-applicable",
    "Repairer qualifications, service scope and parts are not verified.",
    "Requests are saved only as local drafts."),
  offer("demo-training", "AAC technology training session", "professional", "service",
    "Example session to learn device settings and accessible communication options.",
    ["communication", "remote"], "enquire", null, "not-applicable",
    "Trainer credentials, scope and session availability are unknown.",
    "Training is not medical advice."),
  offer("demo-audit", "Digital accessibility audit", "professional", "service",
    "Sample audit of a website or accessible document workflow.",
    ["low-vision", "communication", "remote"], "enquire", null, "not-applicable",
    "Auditor competence, scope and deliverables are unverified.",
    "An enquiry does not create a booking."),
  offer("demo-download", "Accessible planning template", "creative", "digital",
    "Example screen-reader-friendly weekly planning document.",
    ["cognitive", "low-vision"], "plan", 1200, "not-applicable",
    "Actual file accessibility, licence and refund terms unverified.",
    "No paid file download is available."),
  offer("demo-exchange", "Pre-owned walking frame", "mobility", "reuse",
    "Illustrative community equipment reuse listing.",
    ["mobility"], "specialist", null, "illustrative-used",
    "Ownership, safety, hygiene, condition and recalls unknown.",
    "Do not transfer real mobility equipment through this sample."),
  offer("demo-hoist", "Used patient hoist — restricted example", "mobility", "reuse",
    "Demonstrates how higher-consequence items are excluded from open checkout.",
    ["mobility"], "unavailable", null, "illustrative-used",
    "No service inspection, ownership, safe-working load or maintenance evidence.",
    "Excluded from planning and enquiry actions."),
];

export function getCommerceOffer(id: string): CommerceOffer | undefined {
  return COMMERCE_LAB_OFFERS.find((entry) => entry.id === id);
}

export function filterCommerceOffers(
  filters: LabFilters,
  data: readonly CommerceOffer[] = COMMERCE_LAB_OFFERS,
): CommerceOffer[] {
  const term = (filters.search ?? "").trim().toLocaleLowerCase("en-AU").slice(0, 100);
  return data
    .filter((item) => !term || [item.title, item.description,
      ...item.needs.map((need) => NEED_LABELS[need])].join(" ").toLocaleLowerCase("en-AU").includes(term))
    .filter((item) => !filters.kind || filters.kind === "all" || item.kind === filters.kind)
    .filter((item) => !filters.category || filters.category === "all" || item.category === filters.category)
    .filter((item) => !filters.need || filters.need === "all" || item.needs.includes(filters.need))
    .filter((item) => filters.specialist !== "exclude" || item.route === "plan" || item.route === "enquire")
    .sort((a, b) => {
      if (filters.order === "price") {
        const first = a.priceCents ?? Number.MAX_SAFE_INTEGER;
        const second = b.priceCents ?? Number.MAX_SAFE_INTEGER;
        if (first !== second) return first - second;
      }
      return a.title.localeCompare(b.title, "en-AU");
    });
}

export function formatDemoPrice(amount: number | null): string {
  if (amount === null) return "Price not provided";
  if (!Number.isSafeInteger(amount) || amount < 0) return "Invalid example price";
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(amount / 100);
}

export function addPlanningLine(
  lines: readonly PlanningLine[], offerId: string,
): PlanningLine[] {
  const item = getCommerceOffer(offerId);
  if (!item || item.route === "unavailable") throw new Error("This example is not available for a planning list.");
  const existing = lines.find((line) => line.offerId === offerId);
  if (existing) return lines.filter((line) => line.offerId !== offerId);
  if (lines.length >= 8) throw new Error("The planning list can include up to eight items.");
  return [...lines, { offerId, quantity: 1 }];
}

export function updatePlanningQuantity(
  lines: readonly PlanningLine[], offerId: string, quantity: number,
): PlanningLine[] {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 5)
    throw new Error("Choose a whole quantity from one to five.");
  if (!lines.some((line) => line.offerId === offerId)) throw new Error("Item is not in this list.");
  return lines.map((line) => line.offerId === offerId ? { ...line, quantity } : line);
}

export function summaryOfPlanning(lines: readonly PlanningLine[]): {
  knownExampleSubtotalCents: number;
  unpricedCount: number;
  totalIsKnown: boolean;
  payable: false;
} {
  let amount = 0;
  let unpricedCount = 0;
  for (const line of lines) {
    const item = getCommerceOffer(line.offerId);
    if (!item || item.route === "unavailable" ||
        !Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 5)
      throw new Error("Invalid planning line.");
    if (item.priceCents === null) unpricedCount++;
    else amount += item.priceCents * line.quantity;
  }
  return {
    knownExampleSubtotalCents: amount,
    unpricedCount,
    totalIsKnown: unpricedCount === 0 && lines.length > 0,
    payable: false,
  };
}

export function makePrivatePlanningNote(
  lines: readonly PlanningLine[], perspective: ShopperPerspective,
): string {
  summaryOfPlanning(lines);
  return [
    "MAPABLE MARKETPLACE — PRIVATE DESIGN-LAB PLANNING NOTE",
    "Not sent. No order, booking, payment or NDIS funding assessment.",
    "Perspective: " + perspective + " (guidance only; no delegated authority).",
    "",
    ...lines.map((line) => {
      const item = getCommerceOffer(line.offerId)!;
      return line.quantity + " x " + item.title + " — " + ROUTE_LABELS[item.route];
    }),
    "",
    "Please verify supplier, safety, suitability, licence, GST, shipping, refunds and pricing.",
    "Avoid adding diagnoses, plan numbers, addresses or sensitive information to this draft.",
  ].join("\n");
}

export type SellerConcept = {
  title: string;
  description: string;
  kind: OfferKind;
  evidenceNote: string;
};
export function sellerConceptErrors(value: SellerConcept): string[] {
  const errors: string[] = [];
  if (value.title.trim().length < 3 || value.title.trim().length > 100)
    errors.push("Use a title of 3 to 100 characters.");
  if (value.description.trim().length < 15 || value.description.trim().length > 500)
    errors.push("Describe the item or service in 15 to 500 characters.");
  if (!Object.prototype.hasOwnProperty.call(KIND_LABELS, value.kind))
    errors.push("Choose a supported listing type.");
  if (value.evidenceNote.length > 400)
    errors.push("Keep evidence notes under 400 characters.");
  return errors;
}

export const EXEMPLAR_PATTERN = [
  { name: "Adobe Commerce", focus: "Quote review and reusable lists",
    application: "Planning list, explicit participant sign-off and quote versioning." },
  { name: "PrestaShop", focus: "Seller catalogue and back-office workflow",
    application: "Seller draft, evidence queue, scoped editing and accessible updates." },
  { name: "Zen Cart", focus: "Attributes, virtual goods and call-for-price",
    application: "Product-specific action: shortlist, enquiry, rental or assessment." },
  { name: "osCommerce", focus: "Inventory and operational administration",
    application: "Condition, provenance, stock checks and cross-channel service records." },
] as const;
