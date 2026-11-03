/**
 * MapAble Marketplace pilot domain.
 * No individual user profiles, real suppliers, real stock, live payments, GST
 * determination, NDIS eligibility or product safety assessments are stored here.
 * Portable TS can be reused by web, Expo and future desktop clients.
 */
export type MarketKind = "product" | "rental" | "service" | "digital" | "reuse";
export type MarketCategory = "daily-living" | "communication" | "technology" | "mobility" | "home" | "sensory" | "creative" | "services";
export type AccessFeature = "dexterity" | "communication" | "vision" | "sensory" | "mobility" | "cognition" | "remote";
export type RiskBand = "reviewed-low-risk-type" | "specialist-assessment" | "not-offered";
export type EvidenceStatus = "seller-stated" | "document-reviewed" | "independently-verified" | "unknown";
export type ShoppingView = "participant" | "supporter" | "coordinator";

export interface MarketEvidence {
  readonly field: string;
  readonly value: string;
  readonly status: EvidenceStatus;
}

export interface MarketListing {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly sellerName: string;
  readonly category: MarketCategory;
  readonly kind: MarketKind;
  readonly accessFeatures: readonly AccessFeature[];
  readonly risk: RiskBand;
  readonly condition: "example-new" | "example-used" | "not-applicable";
  readonly examplePriceCents: number | null;
  readonly availability: "unconfirmed";
  readonly funding: "not-assessed";
  readonly evidence: readonly MarketEvidence[];
  readonly disclaimer: string;
}

export interface DraftLine {
  readonly id: string;
  readonly quantity: number;
}

export interface EstimateLine {
  readonly id: string;
  readonly title: string;
  readonly quantity: number;
  readonly estimatedUnitCents: number | null;
  readonly estimatedLineCents: number | null;
  readonly nextStep: "information-only" | "specialist-review";
}

export interface EstimatePreview {
  readonly lines: readonly EstimateLine[];
  readonly knownItemsSubtotalCents: number;
  readonly allItemsEstimatedCents: number | null;
  readonly needsReview: boolean;
  readonly checkoutAvailable: false;
  readonly warning: string;
}

export const MARKET_KIND_LABELS: Readonly<Record<MarketKind, string>> = {
  product: "Products", rental: "Trials and rentals",
  service: "Services", digital: "Digital goods", reuse: "Reuse and exchanges",
};
export const MARKET_CATEGORY_LABELS: Readonly<Record<MarketCategory, string>> = {
  "daily-living": "Daily living", communication: "Communication and AAC",
  technology: "Accessible computing", mobility: "Mobility",
  home: "Home and bathroom", sensory: "Sensory and cognition",
  creative: "Creative and digital", services: "Services and repairs",
};
export const MARKET_FEATURE_LABELS: Readonly<Record<AccessFeature, string>> = {
  dexterity: "Grip and dexterity", communication: "Communication access",
  vision: "Low vision", sensory: "Sensory access", mobility: "Mobility and positioning",
  cognition: "Easy-to-follow use", remote: "Remote access",
};
export const RISK_LABELS: Readonly<Record<RiskBand, string>> = {
  "reviewed-low-risk-type": "Lower-risk example — suitability not checked",
  "specialist-assessment": "Specialist review or fitting required",
  "not-offered": "Not available for direct enquiry",
};
export const EVIDENCE_STATUS_LABELS: Readonly<Record<EvidenceStatus, string>> = {
  "seller-stated": "Example seller statement, unverified",
  "document-reviewed": "Document reviewed",
  "independently-verified": "Independently checked",
  unknown: "Not confirmed",
};
const unknown=(field:string):MarketEvidence=>({field,value:"No information available",status:"unknown"});
const stated=(field:string,value:string):MarketEvidence=>({field,value,status:"seller-stated"});

/** Six-digit AUD prices are synthetic design inputs, NEVER payment or funding authority. */
function seed(
  id: string, title: string, kind: MarketKind, category: MarketCategory,
  risk: RiskBand, price: number | null, features: AccessFeature[],
  summary: string, note: string,
  condition: MarketListing["condition"]="example-new"
): MarketListing {
  return {
    id, title, kind, category, risk, examplePriceCents:price,
    accessFeatures:features, summary, condition,
    sellerName:"Synthetic seller — demonstration",
    availability:"unconfirmed",funding:"not-assessed",
    evidence:[
      stated("Described features",features.map((f)=>MARKET_FEATURE_LABELS[f]).join("; ")),
      unknown("Stock and seller identity"),
      unknown("Product-specific safety, warranty and suitability"),
      unknown("Delivery, service area and GST treatment"),
    ],
    disclaimer:note,
  };
}

export const MARKETPLACE_PILOT_LISTINGS: readonly MarketListing[] = [
  seed("demo-jar","Easy-grip jar opener","product","daily-living","reviewed-low-risk-type",2400,["dexterity"],"Example everyday kitchen aid with a wide grip.","Illustrative features only; compatibility and individual suitability unassessed."),
  seed("demo-reacher","Lightweight reach extender","product","daily-living","reviewed-low-risk-type",3900,["dexterity","mobility"],"Long-reach daily living tool for objects at a distance.","Example only; grip force and safe use need checking."),
  seed("demo-cutlery","Adaptive cutlery set","product","daily-living","reviewed-low-risk-type",4500,["dexterity"],"Wide-handle, angled eating utensils.","Example dimensions, cleaning instructions and materials unknown."),
  seed("demo-keyboard","Large-key computer keyboard","product","technology","reviewed-low-risk-type",16900,["vision","dexterity"],"High-contrast large-key keyboard example.","Connection type and accessibility vary across devices."),
  seed("demo-trackball","Accessible trackball mouse","product","technology","reviewed-low-risk-type",12500,["dexterity"],"Pointing-device alternative for some computer users.","Physical fit and operating-system compatibility unverified."),
  seed("demo-aac","Portable communication board","product","communication","reviewed-low-risk-type",5500,["communication","cognition"],"Low-tech vocabulary and choice board.","Language and communication-system suitability not assessed."),
  seed("demo-switch","External access switch","product","communication","specialist-assessment",null,["communication","dexterity"],"Example switch-input accessory for supported access.","Professional compatibility assessment recommended."),
  seed("demo-sensory","Noise-reduction headphones","product","sensory","reviewed-low-risk-type",7900,["sensory"],"Adjustable example for managing noise exposure.","Not medical hearing protection; acoustic performance unknown."),
  seed("demo-planner","Visual routine cards","product","sensory","reviewed-low-risk-type",2600,["cognition"],"Picture prompts for everyday activity planning.","Images and symbols must reflect the individual's communication preferences."),
  seed("demo-clothing","Easy-fastening jacket","product","daily-living","reviewed-low-risk-type",8500,["dexterity"],"Adapted clothing with low-force fastening examples.","Sizing and materials need confirmation."),
  seed("demo-game","Accessible gaming controller","product","creative","reviewed-low-risk-type",11900,["dexterity"],"Example controller with remappable buttons.","Console support and firmware compatibility unknown."),
  seed("demo-download","Accessible weekly planner template","digital","creative","reviewed-low-risk-type",1200,["vision","cognition"],"Example downloadable text-first planning template.","Licence and format must be reviewed before real sale."),
  seed("demo-art","Handcrafted ceramic cup","product","creative","reviewed-low-risk-type",4000,["dexterity"],"Example creative product from a simulated storefront.","No actual maker or disability-owned status is asserted."),
  seed("demo-wheelchair","Adjustable manual wheelchair","product","mobility","specialist-assessment",null,["mobility"],"Example wheelchair requiring fitting and inspection.","No sale, transfer, seating recommendation or repair advice."),
  seed("demo-ramp","Portable threshold ramp","product","home","specialist-assessment",null,["mobility"],"Example threshold aid with site-specific loading considerations.","Slope, load rating and installation must be checked."),
  seed("demo-chair","Shower chair with arms","product","home","specialist-assessment",null,["mobility"],"Example bathing support equipment.","Water environment, stability and fitting must be assessed."),
  seed("demo-wheelchair-rental","Temporary wheelchair rental","rental","mobility","specialist-assessment",null,["mobility"],"Example temporary mobility equipment enquiry.","Condition, hygiene, insurance, return and maintenance rules unresolved.","not-applicable"),
  seed("demo-repair","Wheelchair repair and maintenance","service","services","specialist-assessment",null,["mobility"],"Example service request for inspection or repair.","Qualified provider, service scope and warranty must be verified.","not-applicable"),
  seed("demo-aac-training","Accessible technology training","service","services","reviewed-low-risk-type",null,["communication","remote"],"Example device setup or AAC literacy lesson.","Instructor qualifications, scope and venue must be reviewed.","not-applicable"),
  seed("demo-access-audit","Digital accessibility consulting","service","services","reviewed-low-risk-type",null,["vision","communication","remote"],"Example accessibility review and remediation quote.","Audit scope and auditor competence are not confirmed.","not-applicable"),
  seed("demo-home-mod","Accessible bathroom modification quote","service","home","specialist-assessment",null,["mobility"],"Example building and accessibility modification enquiry.","Licensed builder, site assessment and approvals required.","not-applicable"),
  seed("demo-exchange","Pre-owned walking frame exchange","reuse","mobility","specialist-assessment",null,["mobility"],"Illustrative zero-price exchange concept.","Ownership, condition, suitability, hygiene and safety require review.","example-used"),
  seed("demo-hoist","Lifting hoist (restricted example)","reuse","mobility","not-offered",null,["mobility"],"Listed solely to illustrate high-risk category exclusion.","Not available for listing, purchase or enquiry.","example-used"),
];

export function filterMarketListings(filters: {
  readonly search?:string;
  readonly kind?:MarketKind|"all";
  readonly category?:MarketCategory|"all";
  readonly access?:AccessFeature|"all";
  readonly includeSpecialist?:boolean;
}):MarketListing[]{
  const term=(filters.search??"").trim().toLocaleLowerCase("en-AU").slice(0,150);
  return MARKETPLACE_PILOT_LISTINGS
    .filter((item)=>filters.kind==="all"||!filters.kind||item.kind===filters.kind)
    .filter((item)=>filters.category==="all"||!filters.category||item.category===filters.category)
    .filter((item)=>filters.access==="all"||!filters.access||item.accessFeatures.includes(filters.access))
    .filter((item)=>filters.includeSpecialist!==false||item.risk==="reviewed-low-risk-type")
    .filter((item)=>!term||[item.title,item.summary,...item.accessFeatures.map((f)=>MARKET_FEATURE_LABELS[f])].join(" ").toLocaleLowerCase("en-AU").includes(term))
    .sort((a,b)=>a.title.localeCompare(b.title,"en-AU"));
}

export function findMarketListing(id:string):MarketListing|undefined{
  return MARKETPLACE_PILOT_LISTINGS.find((item)=>item.id===id);
}

export function formatExampleMoney(cents:number):string {
  return new Intl.NumberFormat("en-AU",{style:"currency",currency:"AUD"}).format(cents/100);
}

/** Server-authoritative *demonstration* calculations; amounts are not payable. */
export function previewMarketEstimate(lines:readonly DraftLine[]):EstimatePreview {
  if(!Array.isArray(lines)||lines.length<1||lines.length>8){
    throw new Error("Choose between one and eight examples.");
  }
  const seen=new Set<string>();
  const results:EstimateLine[]=[];
  for(const line of lines){
    if(!line||typeof line.id!=="string"||!Number.isInteger(line.quantity)||line.quantity<1||line.quantity>5){
      throw new Error("Invalid item quantity or identifier.");
    }
    if(seen.has(line.id))throw new Error("Duplicate items are not accepted.");
    seen.add(line.id);
    const item=findMarketListing(line.id);
    if(!item)throw new Error("Unknown item.");
    if(item.risk==="not-offered")throw new Error("This item is not offered.");
    const canEstimate=item.risk==="reviewed-low-risk-type"&&item.examplePriceCents!==null;
    results.push({
      id:item.id,title:item.title,quantity:line.quantity,
      estimatedUnitCents:canEstimate?item.examplePriceCents:null,
      estimatedLineCents:canEstimate?item.examplePriceCents!*line.quantity:null,
      nextStep:item.risk==="specialist-assessment"?"specialist-review":"information-only",
    });
  }
  const knownItemsSubtotalCents=results.reduce((sum,item)=>sum+(item.estimatedLineCents??0),0);
  const anyUnpriced=results.some((item)=>item.estimatedLineCents===null);
  return {
    lines:results,
    knownItemsSubtotalCents,
    allItemsEstimatedCents:anyUnpriced?null:knownItemsSubtotalCents,
    needsReview:results.some((item)=>item.nextStep==="specialist-review"),
    checkoutAvailable:false,
    warning:"Synthetic estimate only. Not a quote, invoice, order or promise of stock. GST, shipping, rental conditions, clinician recommendations and NDIS funding are unverified.",
  };
}

/** Only product IDs and quantities are exported; never a participant's sensitive data. */
export function exportMarketEnquiryDraft(lines:readonly DraftLine[],view:ShoppingView):string{
  const preview=previewMarketEstimate(lines);
  return [
    "MAPABLE MARKETPLACE — PRIVATE SYNTHETIC ENQUIRY DRAFT",
    "NOT SENT | NO CHECKOUT | NO NDIS FUNDING ASSESSMENT",
    "Illustrative view: "+view+" (does not grant access or delegate authority)",
    "",
    ...preview.lines.map((row)=>String(row.quantity)+" x "+row.title+" | "+row.nextStep),
    "",
    "Please confirm seller, condition, availability, item suitability, fees, tax and delivery.",
    "Do not add personal health, NDIS or funding numbers to this demonstration.",
  ].join("\n");
}

/** Fail-closed guard for the legacy generic invoice endpoint. */
export function isUnsafeMarketplaceInvoice(payload:{
  readonly serviceType:string;
  readonly lineItems:readonly {readonly metadata?:Record<string,unknown>}[];
}):boolean {
  if(payload.serviceType==="marketplace")return true;
  return payload.lineItems.some((line)=> {
    const m=line.metadata??{};
    return Object.prototype.hasOwnProperty.call(m,"productId")||
      Object.prototype.hasOwnProperty.call(m,"marketplaceListingId")||
      Object.prototype.hasOwnProperty.call(m,"marketplaceItemId");
  });
}
