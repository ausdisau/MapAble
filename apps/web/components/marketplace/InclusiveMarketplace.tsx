"use client";

import { useEffect, useMemo, useState } from "react";

import {
  EVIDENCE_STATUS_LABELS,
  MARKET_CATEGORY_LABELS,
  MARKET_FEATURE_LABELS,
  MARKET_KIND_LABELS,
  RISK_LABELS,
  exportMarketEnquiryDraft,
  filterMarketListings,
  findMarketListing,
  formatExampleMoney,
  type AccessFeature,
  type DraftLine,
  type EstimatePreview,
  type MarketCategory,
  type MarketKind,
  type MarketListing,
  type ShoppingView,
} from "@/packages/marketplace-inclusive/src/index";

const selectClass="mt-1 min-h-12 w-full rounded-lg border border-slate-400 bg-white px-3 text-[#101c37] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#083f8f]";
const btn="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#083f8f] px-4 py-2 font-semibold text-[#083f8f] hover:bg-[#eef4ff] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#083f8f] disabled:cursor-not-allowed disabled:opacity-50";
const accent=btn+" bg-[#083f8f] text-white hover:bg-[#052b62]";
const KINDS:MarketKind[]=["product","rental","service","digital","reuse"];
const CATEGORIES=Object.keys(MARKET_CATEGORY_LABELS) as MarketCategory[];
const FEATURES=Object.keys(MARKET_FEATURE_LABELS) as AccessFeature[];
const sampleSession="mapable-inclusive-market-demo-v1";

function actionFor(item:MarketListing):string{
  if(item.risk==="not-offered")return "Not available";
  if(item.risk==="specialist-assessment")return "Add to assessment enquiry";
  return item.kind==="service"||item.kind==="rental"||item.kind==="reuse"
    ? "Add to enquiry draft" : "Add to planning basket";
}

function ProductPanel(props:{
  item:MarketListing;
  isInDraft:boolean;
  isCompared:boolean;
  add:()=>void;
  compare:()=>void;
}){
  const {item,isInDraft,isCompared,add,compare}=props;
  return <article className="flex h-full flex-col rounded-2xl border border-[#c9d5e9] bg-white p-5 shadow-sm">
    <div aria-hidden="true" className="mb-4 flex h-28 items-center justify-center rounded-xl bg-gradient-to-br from-[#e7effd] to-[#f1eafe]">
      <span className="text-4xl font-black text-[#083f8f]">{item.kind==="digital"?"DIG":item.kind==="service"?"SERV":"AT"}</span>
    </div>
    <p className="text-xs font-bold uppercase tracking-wide text-[#5740B8]">{MARKET_KIND_LABELS[item.kind]} · {MARKET_CATEGORY_LABELS[item.category]}</p>
    <h3 className="mt-2 text-xl font-bold text-[#101c37]">{item.title}</h3>
    <p className="mt-2 flex-1 text-slate-700">{item.summary}</p>
    <p className="mt-3 text-lg font-extrabold text-[#083f8f]">{item.examplePriceCents===null?"Quote or assessment required":formatExampleMoney(item.examplePriceCents)}</p>
    <p className="text-xs font-medium text-slate-700">{item.examplePriceCents===null?"No listed price": "Illustrative price only — not payable"}</p>
    <p className="mt-3 rounded-lg bg-[#f5f7fc] px-3 py-2 text-sm font-semibold text-[#101c37]">{RISK_LABELS[item.risk]}</p>
    <p className="mt-3 text-sm text-slate-700">{item.accessFeatures.map((f)=>MARKET_FEATURE_LABELS[f]).join(" · ")}</p>
    <details className="mt-4 rounded-lg border border-slate-300 p-3">
      <summary className="cursor-pointer font-semibold text-[#083f8f] focus-visible:outline focus-visible:outline-4">Evidence and unanswered questions</summary>
      <p className="mt-2 text-sm text-slate-700">{item.disclaimer}</p>
      <ul className="mt-3 space-y-2">
        {item.evidence.map((e)=><li key={e.field} className="text-sm">
          <strong className="block text-[#101c37]">{e.field}: {e.value}</strong>
          <span className="text-slate-700">{EVIDENCE_STATUS_LABELS[e.status]}</span>
        </li>)}
      </ul>
    </details>
    <div className="mt-4 flex flex-wrap gap-2">
      <button type="button" className={isInDraft?accent:btn} onClick={add} disabled={item.risk==="not-offered"}
        aria-pressed={isInDraft} aria-label={isInDraft?"Remove "+item.title+" from planning basket":actionFor(item)+" — "+item.title}>
        {isInDraft?"Remove item":actionFor(item)}
      </button>
      <button type="button" className={btn} onClick={compare} aria-pressed={isCompared}
        aria-label={isCompared?"Remove "+item.title+" from comparison":"Compare "+item.title}>
        {isCompared?"Remove comparison":"Compare"}
      </button>
    </div>
  </article>;
}

function SellerDraftStudio(){
  const [name,setName]=useState("");
  const [kind,setKind]=useState<MarketKind>("product");
  const [description,setDescription]=useState("");
  const [statement,setStatement]=useState("");
  const [preview,setPreview]=useState(false);
  function download(){
    if(!name.trim()||!description.trim())return;
    const contents=[
      "MAPABLE — LOCAL SELLER LISTING CONCEPT (NOT SUBMITTED)",
      "Name: "+name.trim().slice(0,100),
      "Type: "+MARKET_KIND_LABELS[kind],
      "Description: "+description.trim().slice(0,500),
      "Seller evidence to obtain: "+(statement.trim().slice(0,400)||"Not supplied"),
      "No seller onboarding, verification, approval, listing or payment has occurred.",
    ].join("\n");
    const url=URL.createObjectURL(new Blob([contents],{type:"text/plain;charset=utf-8"}));
    const anchor=document.createElement("a");
    anchor.href=url;anchor.download="mapable-example-seller-draft.txt";anchor.click();
    URL.revokeObjectURL(url);
  }
  return <section aria-labelledby="seller-heading" className="mt-12 rounded-2xl border border-[#c9d5e9] bg-white p-6">
    <h2 id="seller-heading" className="text-2xl font-black text-[#101c37]">For sellers and disability-owned businesses</h2>
    <p className="mt-2 text-slate-700">Draft a listing privately. This demonstration never publishes it, collects seller identity, or states that a business is disability-owned.</p>
    <form onSubmit={(event)=>{event.preventDefault();setPreview(true);}} className="mt-5 grid gap-4 md:grid-cols-2">
      <label className="block font-semibold text-[#101c37]">Product or service name
        <input maxLength={100} required value={name} onChange={(e)=>{setName(e.target.value);setPreview(false);}} className={selectClass}/>
      </label>
      <label className="block font-semibold text-[#101c37]">What are you offering?
        <select value={kind} onChange={(e)=>{setKind(e.target.value as MarketKind);setPreview(false);}} className={selectClass}>
          {KINDS.map((x)=><option key={x} value={x}>{MARKET_KIND_LABELS[x]}</option>)}
        </select>
      </label>
      <label className="block font-semibold text-[#101c37] md:col-span-2">Description (without personal or medical information)
        <textarea rows={3} maxLength={500} required value={description} onChange={(e)=>{setDescription(e.target.value);setPreview(false);}} className={selectClass}/>
      </label>
      <label className="block font-semibold text-[#101c37] md:col-span-2">Condition, compatibility or qualifications still to verify
        <textarea rows={2} maxLength={400} value={statement} onChange={(e)=>{setStatement(e.target.value);setPreview(false);}} className={selectClass}/>
      </label>
      <div className="flex flex-wrap gap-2 md:col-span-2">
        <button type="submit" className={accent}>Preview local listing</button>
        <button type="button" className={btn} disabled={!preview} onClick={download}>Download seller draft</button>
      </div>
    </form>
    {preview?<div className="mt-4 rounded-xl border border-[#083f8f] bg-[#eef4ff] p-4" role="status">
      <p className="font-bold">Private preview — never published</p>
      <p>{name}</p><p>{MARKET_KIND_LABELS[kind]}: {description}</p>
      <p className="text-sm">Unverified: {statement||"No seller evidence supplied"}</p>
    </div>:null}
  </section>;
}

export function InclusiveMarketplace(){
  const [view,setView]=useState<ShoppingView>("participant");
  const [search,setSearch]=useState("");
  const [kind,setKind]=useState<MarketKind|"all">("all");
  const [category,setCategory]=useState<MarketCategory|"all">("all");
  const [access,setAccess]=useState<AccessFeature|"all">("all");
  const [specialist,setSpecialist]=useState(true);
  const [simpler,setSimpler]=useState(false);
  const [large,setLarge]=useState(false);
  const [draft,setDraft]=useState<DraftLine[]>([]);
  const [compared,setCompared]=useState<string[]>([]);
  const [hydrated,setHydrated]=useState(false);
  const [status,setStatus]=useState("");
  const [loading,setLoading]=useState(false);
  const [preview,setPreview]=useState<EstimatePreview|null>(null);
  const visible=useMemo(()=>filterMarketListings({search,kind,category,access,includeSpecialist:specialist}),
    [search,kind,category,access,specialist]);
  const comparedItems=compared.map((id)=>findMarketListing(id)).filter((x):x is MarketListing=>Boolean(x));

  // Session data is item IDs and quantities only. No health, NDIS or user identity.
  useEffect(()=>{
    try{
      const raw=sessionStorage.getItem(sampleSession);
      if(raw&&raw.length<2000){
        const data:unknown=JSON.parse(raw);
        if(Array.isArray(data)){
          const cleaned:DraftLine[]=[];
          const seen=new Set<string>();
          for(const entry of data){
            if(typeof entry!=="object"||entry===null)continue;
            const row=entry as Record<string,unknown>;
            if(typeof row.id!=="string"||seen.has(row.id)||!findMarketListing(row.id)||
              findMarketListing(row.id)?.risk==="not-offered"||
              typeof row.quantity!=="number"||!Number.isInteger(row.quantity)||
              row.quantity<1||row.quantity>5)continue;
            cleaned.push({id:row.id,quantity:row.quantity});
            seen.add(row.id);
            if(cleaned.length===8)break;
          }
          setDraft(cleaned);
        }
      }
    }catch{
      // Invalid local state is intentionally ignored rather than trusted.
    }
    setHydrated(true);
  },[]);
  useEffect(()=>{
    if(hydrated){
      try{sessionStorage.setItem(sampleSession,JSON.stringify(draft));}
      catch{ /* Storage optional: user can still export draft. */ }
    }
  },[draft,hydrated]);

  function resetEstimate(){setPreview(null);setStatus("");}
  function toggleDraft(id:string){
    const item=findMarketListing(id);
    if(!item||item.risk==="not-offered")return;
    const existing=draft.some((row)=>row.id===id);
    if(!existing&&draft.length>=8){setStatus("Maximum eight items. Remove an item first.");return;}
    setDraft((old)=>existing?old.filter((row)=>row.id!==id):[...old,{id,quantity:1}]);
    resetEstimate();
    setStatus(existing?"Item removed from planning basket.":"Item added to planning basket. No order or payment created.");
  }
  function toggleCompare(id:string){
    if(compared.includes(id)){setCompared((old)=>old.filter((x)=>x!==id));setStatus("Comparison updated.");return;}
    if(compared.length>=3){setStatus("Compare up to three. Remove an item first.");return;}
    setCompared((old)=>[...old,id]);setStatus("Item added to comparison.");
  }
  function updateQty(id:string,qty:number){
    if(!Number.isInteger(qty)||qty<1||qty>5){setStatus("Choose a whole quantity from one to five.");return;}
    setDraft((old)=>old.map((x)=>x.id===id?{...x,quantity:qty}:x));
    resetEstimate();setStatus("Quantity updated.");
  }
  async function askPreview(){
    if(!draft.length)return;
    setLoading(true);setPreview(null);setStatus("");
    try{
      const res=await fetch("/api/marketplace/alpha-estimate",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({lines:draft}),cache:"no-store",credentials:"same-origin"
      });
      const data:unknown=await res.json();
      if(!res.ok||typeof data!=="object"||data===null||!("preview" in data)){
        setStatus("Price preview unavailable. Your local item draft is unchanged.");return;
      }
      const result=(data as {preview:EstimatePreview}).preview;
      if(!result||result.checkoutAvailable!==false){
        setStatus("Unexpected price response; no quote was accepted.");return;
      }
      setPreview(result);
      setStatus("Illustrative price preview prepared. No seller was contacted.");
    }catch{
      setStatus("Network unavailable. Your draft remains on this device; no request was sent to sellers.");
    }finally{setLoading(false);}
  }
  function downloadDraft(){
    if(!draft.length)return;
    try{
      const contents=exportMarketEnquiryDraft(draft,view);
      const url=URL.createObjectURL(new Blob([contents],{type:"text/plain;charset=utf-8"}));
      const anchor=document.createElement("a");
      anchor.href=url;anchor.download="mapable-private-enquiry-draft.txt";anchor.click();
      URL.revokeObjectURL(url);
      setStatus("Local text file prepared. No seller or support coordinator was contacted.");
    }catch{setStatus("Invalid draft: remove any unavailable item.");}
  }
  const prompt=view==="participant"
    ?"You decide what matters, which items to compare and whether to seek advice."
    :view==="supporter"
      ?"You can help organise options, but this view gives no authority over another person's account or purchases."
      :"Prepare a comparison for discussion. No participant records, delegated authority or funding approvals are available in this preview.";
  return <div className={large?"text-lg [&_p]:!text-lg [&_label]:!text-lg [&_button]:!text-lg":""}>
    <header className="rounded-3xl bg-gradient-to-r from-[#073F97] via-[#4737A7] to-[#683A97] p-6 text-white sm:p-10">
      <p className="text-sm font-bold uppercase tracking-wider">MapAble by Australian Disability Ltd</p>
      <h1 className="mt-3 text-3xl font-black sm:text-4xl">Find what works for you.</h1>
      <p className="mt-3 max-w-2xl text-lg">Shop accessibility, not assumptions. Compare aids, digital resources, equipment reuse and service options with the information you need to decide.</p>
      <p className="mt-4 rounded-xl bg-white p-4 font-bold text-[#101c37]" role="note">
        Synthetic pilot only. No real sellers, stock, NDIS funding decision, booking, order or payment.
      </p>
    </header>

    <section aria-labelledby="my-control" className="mt-8 grid gap-4 rounded-2xl border border-[#c9d5e9] bg-[#f5f8ff] p-5 lg:grid-cols-3">
      <div>
        <h2 id="my-control" className="text-xl font-bold text-[#101c37]">Your role, your choice</h2>
        <p className="mt-2 text-sm text-slate-700">Choosing a view changes guidance, not access permissions.</p>
      </div>
      <div>
        <label htmlFor="market-view" className="font-semibold text-[#101c37]">Preview as</label>
        <select id="market-view" className={selectClass} value={view} onChange={(e)=>setView(e.target.value as ShoppingView)}>
          <option value="participant">Person shopping for themselves</option>
          <option value="supporter">Carer or chosen supporter</option>
          <option value="coordinator">Support coordinator</option>
        </select>
        <p className="mt-2 text-sm text-slate-700">{prompt}</p>
      </div>
      <div className="space-y-2">
        <label className="flex min-h-11 cursor-pointer items-center gap-3 font-semibold">
          <input className="h-5 w-5 accent-[#073F97]" type="checkbox" checked={large} onChange={(e)=>setLarge(e.target.checked)}/>
          Larger text
        </label>
        <label className="flex min-h-11 cursor-pointer items-center gap-3 font-semibold">
          <input className="h-5 w-5 accent-[#073F97]" type="checkbox" checked={simpler} onChange={(e)=>setSimpler(e.target.checked)}/>
          Simpler browsing view
        </label>
      </div>
    </section>

    <section aria-labelledby="discover-heading" className="mt-10">
      <h2 id="discover-heading" className="text-2xl font-black text-[#101c37]">Explore products and services</h2>
      <p className="mt-2 text-slate-700">Filter by what an item helps with. No diagnosis, plan number or medical information is requested.</p>
      <div className="mt-5 grid gap-4 rounded-2xl border border-[#c9d5e9] bg-white p-5 md:grid-cols-2 xl:grid-cols-4">
        <label className="block font-semibold">Search listings
          <input type="search" value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="AAC, repairs, kitchen..." className={selectClass}/>
        </label>
        <label className="block font-semibold">Shop by type
          <select value={kind} onChange={(e)=>setKind(e.target.value as MarketKind|"all")} className={selectClass}>
            <option value="all">All types</option>{KINDS.map((k)=><option key={k} value={k}>{MARKET_KIND_LABELS[k]}</option>)}
          </select>
        </label>
        <label className="block font-semibold">Category
          <select value={category} onChange={(e)=>setCategory(e.target.value as MarketCategory|"all")} className={selectClass}>
            <option value="all">All categories</option>{CATEGORIES.map((c)=><option key={c} value={c}>{MARKET_CATEGORY_LABELS[c]}</option>)}
          </select>
        </label>
        <label className="block font-semibold">Functional access feature
          <select value={access} onChange={(e)=>setAccess(e.target.value as AccessFeature|"all")} className={selectClass}>
            <option value="all">Any access feature</option>{FEATURES.map((f)=><option key={f} value={f}>{MARKET_FEATURE_LABELS[f]}</option>)}
          </select>
        </label>
        <label className="flex min-h-12 cursor-pointer items-center gap-3 md:col-span-2">
          <input className="h-5 w-5 accent-[#073F97]" type="checkbox" checked={specialist} onChange={(e)=>setSpecialist(e.target.checked)}/>
          Include items requiring specialist review
        </label>
        <div className="flex items-center justify-start md:col-span-2 xl:justify-end">
          <button type="button" className={btn} onClick={()=>{setSearch("");setKind("all");setCategory("all");setAccess("all");setSpecialist(true);}}>Clear filters</button>
        </div>
      </div>
      <p className="mt-4 text-sm font-semibold text-[#101c37]" role="status">{visible.length} synthetic listing{visible.length===1?"":"s"} shown</p>
      {visible.length? <ul className={"mt-4 grid list-none gap-4 p-0 "+(simpler?"grid-cols-1":"md:grid-cols-2 xl:grid-cols-3")}>
        {visible.map((item)=><li key={item.id}><ProductPanel item={item}
          isInDraft={draft.some((line)=>line.id===item.id)}
          isCompared={compared.includes(item.id)}
          add={()=>toggleDraft(item.id)} compare={()=>toggleCompare(item.id)}/></li>)}
      </ul>:<p className="mt-4 rounded-xl border border-dashed border-slate-400 p-6">No matching examples. Clear or broaden your filters.</p>}
    </section>

    <section aria-labelledby="compare-heading" className="mt-12">
      <h2 id="compare-heading" className="text-2xl font-bold text-[#101c37]">Compare evidence, not ratings</h2>
      <p className="mt-2 text-slate-700">Compare up to three items without scoring people or claiming universal suitability.</p>
      {comparedItems.length===0?<p className="mt-3 rounded-xl border p-5">Choose an item using its Compare button.</p>:
        <div className="mt-4 overflow-x-auto rounded-xl border border-[#c9d5e9]">
          <table className="min-w-[650px] w-full border-collapse text-left">
            <caption className="sr-only">Evidence comparison of selected synthetic products and services</caption>
            <thead className="bg-[#f5f8ff]"><tr>
              <th scope="col" className="border-b p-3">Feature</th>
              {comparedItems.map((item)=><th key={item.id} scope="col" className="border-b p-3">{item.title}</th>)}
            </tr></thead>
            <tbody>
              {["Type","Example price","Suitability","Access features","Verification"].map((field)=><tr key={field}>
                <th scope="row" className="border-b p-3">{field}</th>
                {comparedItems.map((item)=><td key={item.id} className="border-b p-3 align-top">
                  {field==="Type"?MARKET_KIND_LABELS[item.kind]:
                  field==="Example price"?(item.examplePriceCents===null?"Quote required":formatExampleMoney(item.examplePriceCents)):
                  field==="Suitability"?RISK_LABELS[item.risk]:
                  field==="Access features"?item.accessFeatures.map((f)=>MARKET_FEATURE_LABELS[f]).join(", "):
                  "Seller identity, stock, GST, safety and funding not confirmed"}
                </td>)}
              </tr>)}
            </tbody>
          </table>
        </div>}
      {compared.length>0?<button type="button" className={"mt-3 "+btn} onClick={()=>setCompared([])}>Clear comparison</button>:null}
    </section>

    <section aria-labelledby="basket-heading" className="mt-12 rounded-2xl border border-[#c9d5e9] bg-[#f5f8ff] p-6">
      <h2 id="basket-heading" className="text-2xl font-black text-[#101c37]">Private planning basket</h2>
      <p className="mt-2 text-slate-700">Collect options for your own review or discussion. This is not a cart that accepts payment. A supporter or coordinator cannot submit on someone else&apos;s behalf from this view.</p>
      {draft.length===0?<p className="mt-4 rounded-xl border border-dashed bg-white p-4">Your planning basket is empty.</p>:
        <ul className="mt-5 space-y-3">{draft.map((line)=>{
          const item=findMarketListing(line.id);
          return item?<li key={line.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white p-4">
            <div><strong className="block text-[#101c37]">{item.title}</strong><span className="text-sm text-slate-700">{RISK_LABELS[item.risk]}</span></div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="font-semibold" htmlFor={"qty-"+line.id}>Quantity</label>
              <input type="number" min={1} max={5} id={"qty-"+line.id} value={line.quantity}
                onChange={(e)=>updateQty(line.id,Number(e.target.value))}
                className="min-h-12 w-20 rounded-lg border border-slate-400 px-2"/>
              <button type="button" className={btn} onClick={()=>toggleDraft(line.id)} aria-label={"Remove "+item.title+" from planning basket"}>Remove</button>
            </div>
          </li>:null;
        })}</ul>}
      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" className={accent} disabled={loading||draft.length===0} onClick={askPreview}>
          {loading?"Checking illustrative prices...":"Preview indicative amounts"}
        </button>
        <button type="button" className={btn} disabled={draft.length===0} onClick={downloadDraft}>Download enquiry draft</button>
        <button type="button" className={btn} disabled={draft.length===0}
          onClick={()=>{setDraft([]);setPreview(null);setStatus("Planning basket cleared from this session.");}}>Clear basket</button>
      </div>
      <p className="mt-3 text-sm text-slate-700">Only item IDs and quantities are kept in this browser tab to restore an interrupted session. Clear the basket whenever you wish. No personal or medical information is collected.</p>
      {preview?<div role="region" aria-label="Illustrative amount preview" className="mt-5 rounded-xl border border-[#083f8f] bg-white p-5">
        <h3 className="text-xl font-bold">Server-calculated illustrative amounts</h3>
        <ul className="mt-3 space-y-2">{preview.lines.map((line)=><li key={line.id}>
          {line.quantity} × {line.title}: {line.estimatedLineCents===null?"Quote or specialist review required":formatExampleMoney(line.estimatedLineCents)}
        </li>)}</ul>
        <p className="mt-3 font-bold">Priced example subtotal: {formatExampleMoney(preview.knownItemsSubtotalCents)}</p>
        <p className="text-sm text-slate-700">{preview.allItemsEstimatedCents===null?"Some items are unpriced; this is not a total cost.":"All item examples priced; GST and shipping are still unknown."}</p>
        <p className="mt-2 text-sm text-slate-700">{preview.warning}</p>
        <strong className="mt-3 block text-[#083f8f]">Checkout is disabled.</strong>
      </div>:null}
    </section>
    <SellerDraftStudio/>
    <section aria-labelledby="safeguards-heading" className="my-10 rounded-xl border border-slate-300 bg-white p-5">
      <h2 id="safeguards-heading" className="text-xl font-bold text-[#101c37]">Your rights come first</h2>
      <p className="mt-2 text-slate-700">Listings cannot guarantee NDIS funding, registration, suitability, safety or stock. All examples are invented. The person chooses their own products and any supporter involvement. Professional advice, consumer guarantees, accessible complaints and a lawful payment process must be established before a live sale.</p>
    </section>
    <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">{status}</p>
    {status?<p role="status" className="mb-5 rounded-lg bg-[#eef4ff] p-3 font-semibold text-[#083f8f]">{status}</p>:null}
  </div>;
}
