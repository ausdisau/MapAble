/** Synthetic product examples. WHO APL and NDIS categories are classification context only,
 * not item-level product data. Prices, titles, sellers, stock and suitability are invented.
 * No images or product listings are scraped, and no NDIS eligibility is asserted. */
export type AlphaItem = {
  id: string; name: string; category: string; function: string;
  cents: number | null; risk: "lower" | "review"; provenance: "synthetic";
};
export const ALPHA_ITEMS: readonly AlphaItem[] = [
 { id:"apl-01", name:"Adapted kitchen grips — example",category:"Daily living",function:"Grip and dexterity",cents:2800,risk:"lower",provenance:"synthetic" },
 { id:"apl-02", name:"Large-print keyboard — example",category:"Vision and computing",function:"Low-vision access",cents:12900,risk:"lower",provenance:"synthetic" },
 { id:"apl-03", name:"Communication picture board — example",category:"Communication",function:"AAC",cents:6900,risk:"lower",provenance:"synthetic" },
 { id:"apl-04", name:"Tablet mount — example",category:"Communication",function:"Device positioning",cents:null,risk:"review",provenance:"synthetic" },
 { id:"apl-05", name:"Wheelchair trial — example",category:"Mobility",function:"Mobility and fit",cents:null,risk:"review",provenance:"synthetic" },
 { id:"apl-06", name:"Shower chair — example",category:"Self care",function:"Bathing and transfers",cents:null,risk:"review",provenance:"synthetic" },
 { id:"apl-07", name:"Noise-reduction headphones — example",category:"Sensory",function:"Noise management",cents:7800,risk:"lower",provenance:"synthetic" },
 { id:"apl-08", name:"AAC training session — example",category:"Services",function:"Accessible communication",cents:null,risk:"review",provenance:"synthetic" },
];
export const OPEN_CLASSIFICATION_SOURCES = [
 {source:"WHO Priority Assistive Products List (2016)",url:"https://www.who.int/publications/i/item/priority-assistive-products-list"},
 {source:"NDIS What is assistive technology (2026)",url:"https://www.ndis.gov.au/participants/assistive-technology/assistive-technology-and-advisors/what-assistive-technology"},
] as const;
export function selectAlphaItems(query: string, risk: "all"|"lower"|"review"="all"): AlphaItem[] {
 const term=query.trim().toLocaleLowerCase("en-AU").slice(0,90);
 return ALPHA_ITEMS.filter(item=>(risk==="all"||item.risk===risk) &&
 [item.name,item.category,item.function].join(" ").toLocaleLowerCase("en-AU").includes(term));
}
export function alphaExampleTotal(ids: readonly string[]):number {
 return ids.reduce((sum,id)=>{
  const item=ALPHA_ITEMS.find(p=>p.id===id);
  if(!item||item.risk!=="lower"||item.cents===null) throw Error("Not eligible for sample pricing.");
  return sum+item.cents;
 },0);
}
export type AlphaPaymentState="disabled"|"configuration-required"|"test-only-prototype";
export function alphaPaymentState(config:{alphaEnabled?:boolean;liveMode?:boolean;stripeTestKey?:string}):AlphaPaymentState {
 if(!config.alphaEnabled||config.liveMode) return "disabled";
 if(!config.stripeTestKey||!config.stripeTestKey.startsWith("pk_test_")) return "configuration-required";
 return "test-only-prototype";
}
