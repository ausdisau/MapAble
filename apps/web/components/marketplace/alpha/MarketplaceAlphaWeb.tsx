"use client";

/**
 * MapAble Marketplace closed-alpha web/desktop research UI.
 * All catalogue records and exchange participants are synthetic. No network
 * API is invoked by this component and no payment flow exists.
 */
import {
  ArrowLeftRight, Check, ClipboardList, Download, FileText, Info,
  Package, Search, ShieldAlert, ShoppingBag, SlidersHorizontal, X,
} from "lucide-react";
import { useState } from "react";

import { ExchangeWorkspace } from "@/components/marketplace/dual-sided/ExchangeWorkspace";
import {
  ALPHA_CLASSIFICATION_SOURCES, ALPHA_TRIAL_TASKS, WEB_ALPHA_ITEMS,
  alphaItem, alphaMoney, alphaPlanSubtotal, alphaWebFilter,
  makeAlphaTrialNote, toggleCompareItem, togglePlanningItem,
  type AlphaItem, type AlphaRiskFilter, type AlphaTrialTask,
} from "@/lib/marketplace/alpha/web-alpha-model";

type View = "catalogue" | "compare" | "exchange" | "testing";
const sections: Array<{ id: View; label: string }> = [
  { id: "catalogue", label: "Catalogue" },
  { id: "compare", label: "Compare" },
  { id: "exchange", label: "Buyer–seller exchange" },
  { id: "testing", label: "Alpha testing" },
];
const control = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#123D89] " +
  "px-4 py-2 text-sm font-bold text-[#123D89] hover:bg-[#eaf1ff] " +
  "focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#A44304] " +
  "disabled:cursor-not-allowed disabled:opacity-60";
const mainButton = control + " bg-[#123D89] text-white hover:bg-[#06275d]";
const panel = "rounded-2xl border border-[#cbd8ea] bg-white p-4 shadow-sm sm:p-5";
const label = "block text-sm font-bold text-[#253953]";
const input = "mt-2 w-full min-h-11 rounded-xl border border-[#7e90ad] bg-white px-3 py-2 text-[#15263a] " +
  "focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#A44304]";

function AlphaProductCard({
  item, saved, compared, onSave, onCompare, onEnquiry,
}: {
  item: AlphaItem;
  saved: boolean;
  compared: boolean;
  onSave: () => void;
  onCompare: () => void;
  onEnquiry: () => void;
}) {
  const review = item.risk === "review";
  return <article className={panel + " flex min-w-0 flex-col gap-3"}>
    <div className="flex flex-wrap items-start justify-between gap-2">
      <span className="rounded-lg bg-[#edf2ff] px-3 py-1 text-xs font-bold text-[#123D89]">
        {item.category}
      </span>
      <span className={"rounded-lg px-3 py-1 text-xs font-bold " +
        (review ? "bg-[#fff2dd] text-[#6f3c0e]" : "bg-[#e8f4f2] text-[#125f58]")}>
        {review ? "Review first" : "Lower-risk example"}
      </span>
    </div>
    <div className="flex items-center gap-4 rounded-xl bg-[#f1f5fd] p-4 text-[#123D89]">
      <Package aria-hidden="true" className="h-10 w-10 shrink-0"/>
      <div>
        <p className="text-xs font-bold uppercase tracking-wide">Synthetic illustration</p>
        <p className="text-sm text-[#4a5c79]">No real product image or stock data</p>
      </div>
    </div>
    <h3 className="text-xl font-extrabold leading-snug text-[#14253b]">{item.name}</h3>
    <p className="text-sm text-[#354660]">Functional access: {item.function}</p>
    <p className="mt-auto text-lg font-black text-[#123D89]">
      {item.cents === null ? "Price unverified" : alphaMoney(item.cents)}
    </p>
    <p className="text-xs text-[#52607a]">
      {review ? "Specialist enquiry/trial only — not a direct-purchase option." :
        "Illustrative amount; not a seller price, quote or NDIS approval."}
    </p>
    <details className="rounded-xl border border-[#cbd8ea] px-3 py-2">
      <summary className="min-h-9 cursor-pointer font-semibold text-[#123D89] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A44304]">
        Product evidence and limits
      </summary>
      <p className="mt-2 text-sm leading-relaxed text-[#354660]">
        Fictional listing based on a broad public assistive-technology category.
        Seller identity, product suitability, compatibility, availability, recalls,
        warranty, GST, delivery and NDIS fundability are unknown.
      </p>
      <p className="mt-2 text-sm font-semibold">
        {review ? "A qualified assessment or supplier review may be required before real supply." :
          "No independent product or supplier verification has been performed."}
      </p>
    </details>
    <div className="flex flex-wrap gap-2">
      <button type="button" className={saved ? mainButton : control}
        onClick={onSave} disabled={review} aria-pressed={saved}
        aria-label={(saved ? "Remove from private list: " :
          review ? "Needs specialist review: " : "Save to private list: ") + item.name}>
        {saved ? <Check className="h-4 w-4" aria-hidden="true"/> :
          <ClipboardList className="h-4 w-4" aria-hidden="true"/>}
        {review ? "Review before saving" : saved ? "In planning list" : "Save option"}
      </button>
      <button type="button" className={control} onClick={onCompare} aria-pressed={compared}
        aria-label={(compared ? "Remove from comparison: " : "Compare: ") + item.name}>
        <ArrowLeftRight className="h-4 w-4" aria-hidden="true"/>
        {compared ? "Comparing" : "Compare"}
      </button>
      {review ? <button type="button" className={control} onClick={onEnquiry}>
        Explore enquiry simulation
      </button> : null}
    </div>
  </article>;
}

function ComparePanel({
  ids, onRemove,
}: { ids: readonly string[]; onRemove: (id: string) => void }) {
  const items = ids.map((id) => alphaItem(id)).filter((item): item is AlphaItem => Boolean(item));
  if (!items.length) {
    return <section className={panel} aria-labelledby="alpha-compare-heading">
      <h2 id="alpha-compare-heading" className="text-2xl font-extrabold">Compare examples</h2>
      <p className="mt-3">Choose Compare on up to three items in the catalogue to inspect their differences.</p>
    </section>;
  }
  const fields: Array<{ title: string; describe: (item: AlphaItem) => string }> = [
    { title: "Category", describe: (item) => item.category },
    { title: "Function", describe: (item) => item.function },
    { title: "Illustrative amount", describe: (item) => alphaMoney(item.cents) },
    { title: "Enquiry pathway", describe: (item) => item.risk === "review" ?
      "Specialist review or trial required" : "Nonbinding planning only" },
    { title: "Seller verification", describe: () => "Unknown; synthetic only" },
    { title: "NDIS funding", describe: () => "Not assessed or approved" },
  ];
  return <section className={panel} aria-labelledby="alpha-compare-heading">
    <h2 id="alpha-compare-heading" className="text-2xl font-extrabold">Compare examples side by side</h2>
    <p className="mt-2 text-[#40526e]">
      No automatic suitability scoring, paid ranking or prescriber endorsement.
    </p>
    {/* Keyboard focus is necessary to scroll this table horizontally at high zoom. */}
    {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
    <div className="mt-5 overflow-x-auto rounded-xl border border-[#cbd8ea]"
      role="region" aria-label="Scrollable example comparison table" tabIndex={0}>
      <table className="min-w-[560px] w-full border-collapse text-left text-sm">
        <caption className="sr-only">Comparison of selected fictional assistive-technology examples</caption>
        <thead className="bg-[#edf2ff]">
          <tr>
            <th scope="col" className="w-44 border-b border-[#cbd8ea] p-3">Feature</th>
            {items.map((item) => <th key={item.id} scope="col"
              className="border-b border-[#cbd8ea] p-3">{item.name}</th>)}
          </tr>
        </thead>
        <tbody>
          {fields.map((field) => <tr key={field.title}>
            <th scope="row" className="border-b border-[#dce5f2] p-3 align-top">{field.title}</th>
            {items.map((item) => <td key={item.id}
              className="border-b border-[#dce5f2] p-3 align-top">{field.describe(item)}</td>)}
          </tr>)}
        </tbody>
      </table>
    </div>
    <div className="mt-4 flex flex-wrap gap-2">
      {items.map((item) => <button key={item.id} type="button" className={control}
        onClick={() => onRemove(item.id)}>
        <X aria-hidden="true" className="h-4 w-4"/> Remove {item.name}
      </button>)}
    </div>
  </section>;
}

function TesterPanel() {
  const [completed, setCompleted] = useState<AlphaTrialTask[]>([]);
  const [observation, setObservation] = useState("");
  const [notice, setNotice] = useState("");
  function exportNote() {
    try {
      const value = makeAlphaTrialNote(completed, observation);
      const url = URL.createObjectURL(new Blob([value], { type: "text/plain;charset=utf-8" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = "mapable-web-desktop-closed-alpha-notes.txt";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice("A private text note was prepared locally. Nothing has been submitted.");
    } catch {
      setNotice("The local download was not available. You can copy the notes manually.");
    }
  }
  return <section className={panel + " space-y-5"} aria-labelledby="alpha-testing-heading">
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-[#6243a8]">Private usability rehearsal</p>
      <h2 id="alpha-testing-heading" className="mt-2 text-2xl font-extrabold">Closed-alpha testing checklist</h2>
      <p className="mt-2 text-[#40526e]">
        Record general usability observations only. Do not enter real personal,
        medical, NDIS, supplier or financial information. Notes stay in this browser
        until you download them; nothing is automatically transmitted.
      </p>
    </div>
    <fieldset>
      <legend className="font-bold">Tasks you have explored</legend>
      <div className="mt-3 space-y-3">
        {ALPHA_TRIAL_TASKS.map((task) => <label key={task.id}
          className="flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border border-[#d1dded] p-3">
          <input type="checkbox" className="mt-1 h-5 w-5 accent-[#123D89]"
            checked={completed.includes(task.id)}
            onChange={(event) => setCompleted((prev) => event.target.checked ?
              [...prev, task.id] : prev.filter((value) => value !== task.id))}/>
          <span className="text-base text-[#253953]">{task.label}</span>
        </label>)}
      </div>
    </fieldset>
    <label className={label}>
      General accessibility or usability observations (optional, 500 characters maximum)
      <textarea className={input} rows={4} maxLength={500}
        value={observation} onChange={(event) => setObservation(event.target.value)}
        placeholder="Example: the comparison table is difficult to navigate at 400% zoom."/>
    </label>
    <button type="button" className={mainButton} onClick={exportNote}>
      <Download aria-hidden="true" className="h-4 w-4"/> Save a local text note
    </button>
    <p className="text-sm text-[#40526e]" role="status" aria-live="polite">{notice}</p>
    <div className="rounded-xl bg-[#f5f7fd] p-4">
      <h3 className="font-bold">Reference classification only</h3>
      {ALPHA_CLASSIFICATION_SOURCES.map((source) => <p key={source.source}
        className="mt-2 text-sm text-[#40526e]">
        <strong>{source.source}:</strong> {source.use}
      </p>)}
      <p className="mt-2 text-sm text-[#40526e]">
        All eight listings and their example amounts are fictional. Public sources are not
        product catalogues for this platform.
      </p>
    </div>
  </section>;
}

export function MarketplaceAlphaWeb() {
  const [view, setView] = useState<View>("catalogue");
  const [query, setQuery] = useState("");
  const [risk, setRisk] = useState<AlphaRiskFilter>("all");
  const [saved, setSaved] = useState<string[]>([]);
  const [compared, setCompared] = useState<string[]>([]);
  const [largeText, setLargeText] = useState(false);
  const [notice, setNotice] = useState("Closed alpha is synthetic. No seller has been contacted.");

  const items = alphaWebFilter(query, risk);
  const amount = alphaPlanSubtotal(saved);
  function saveItem(id: string) {
    try {
      const updated = togglePlanningItem(saved, id);
      setSaved(updated);
      setNotice(saved.includes(id) ? "Example removed from your private list." :
        "Example saved privately. No order or payment was created.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "This example cannot be saved.");
    }
  }
  function compareItem(id: string) {
    try {
      const updated = toggleCompareItem(compared, id);
      setCompared(updated);
      setNotice(compared.includes(id) ? "Example removed from comparison." :
        "Example added to comparison.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not compare this example.");
    }
  }
  return <div className={"space-y-6 text-[#14253b] " +
    (largeText ? "text-lg [&_p]:!text-lg [&_button]:!text-lg [&_label]:!text-lg" : "")}>
    <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#073F97] via-[#3f3aa7] to-[#6537a3] px-6 py-8 text-white sm:px-10">
      <p className="text-xs font-bold uppercase tracking-widest text-[#ffe7d0]">
        MapAble Marketplace · Private closed alpha
      </p>
      <h1 className="mt-3 max-w-3xl text-3xl font-black leading-tight sm:text-4xl">
        Explore access. Compare options. Stay in control.
      </h1>
      <p className="mt-3 max-w-2xl text-[#f4f4ff]">
        An accessible web and desktop research workspace for buyers, providers,
        equipment suppliers and independent AT advisors.
      </p>
      <div className="mt-5 max-w-3xl rounded-xl border border-white/70 bg-white p-4 text-sm font-semibold text-[#17325a]">
        SYNTHETIC, NO-CHECKOUT ALPHA. All listings and prices are fictional.
        No seller is registered, no item is verified, and no payment,
        claim or clinical assessment occurs in this demonstration.
      </div>
      <ShoppingBag aria-hidden="true"
        className="pointer-events-none absolute -right-9 top-4 h-44 w-44 text-white/10"/>
    </header>

    <nav aria-label="Closed alpha sections" className="flex flex-wrap gap-2 rounded-2xl border border-[#d2ddec] bg-white p-3">
      {sections.map((section) => <button type="button" key={section.id}
        className={view === section.id ? mainButton : control}
        aria-pressed={view === section.id}
        onClick={() => { setView(section.id); setNotice(section.label + " preview opened."); }}>
        {section.label}
        {section.id === "compare" && compared.length ? " (" + compared.length + ")" : ""}
      </button>)}
    </nav>

    {view === "catalogue" ? <section aria-labelledby="alpha-catalogue-heading">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[#6243a8]">
            Based on open classification guidance · fictional records
          </p>
          <h2 id="alpha-catalogue-heading" className="mt-1 text-2xl font-extrabold">
            Browse assistive-technology and service examples
          </h2>
        </div>
        <label className="flex min-h-11 items-center gap-3 text-sm font-bold">
          <input type="checkbox" checked={largeText} onChange={(e) => setLargeText(e.target.checked)}
            className="h-5 w-5 accent-[#123D89]"/> Larger text
        </label>
      </div>
      <div className="grid items-start gap-5 lg:grid-cols-[240px_minmax(0,1fr)_250px]">
        <aside className={panel} aria-label="Search and filters">
          <h3 className="flex items-center gap-2 text-lg font-extrabold">
            <SlidersHorizontal aria-hidden="true" className="h-5 w-5"/> Refine
          </h3>
          <label className={label + " mt-4"}>
            Search features
            <span className="relative block">
              <Search aria-hidden="true" className="absolute left-3 top-5 h-4 w-4 text-[#5e6e89]"/>
              <input type="search" className={input + " pl-10"} value={query}
                maxLength={90} placeholder="AAC, mobility, grip..."
                onChange={(event) => setQuery(event.target.value)}/>
            </span>
          </label>
          <label className={label + " mt-4"}>
            Review requirement
            <select value={risk} className={input}
              onChange={(event) => setRisk(event.target.value as AlphaRiskFilter)}>
              <option value="all">All examples</option>
              <option value="lower">Lower-risk examples</option>
              <option value="review">Specialist review first</option>
            </select>
          </label>
          <button type="button" className={control + " mt-4 w-full"}
            onClick={() => { setQuery(""); setRisk("all"); }}>
            Clear filters
          </button>
          <p className="mt-4 text-sm leading-relaxed text-[#40526e]">
            No diagnosis, NDIS number, location or health details are requested.
          </p>
        </aside>
        <div className="min-w-0">
          <p className="mb-3 text-sm font-semibold text-[#40526e]" role="status" aria-live="polite">
            {items.length} of {WEB_ALPHA_ITEMS.length} synthetic examples
          </p>
          {items.length ? <ul className="grid list-none gap-4 p-0 sm:grid-cols-2">
            {items.map((item) => <li key={item.id} className="min-w-0">
              <AlphaProductCard item={item} saved={saved.includes(item.id)}
                compared={compared.includes(item.id)}
                onSave={() => saveItem(item.id)}
                onCompare={() => compareItem(item.id)}
                onEnquiry={() => { setView("exchange"); setNotice("The enquiry lab is fictional and operates separately from this catalogue."); }}/>
            </li>)}
          </ul> : <div className={panel}>
            <h3 className="text-xl font-bold">No matching examples</h3>
            <p className="mt-2 text-sm">Try another access feature or clear the filters.</p>
            <button type="button" className={control + " mt-3"}
              onClick={() => { setQuery(""); setRisk("all"); }}>Clear filters</button>
          </div>}
        </div>
        <aside className={panel + " lg:sticky lg:top-5"} aria-labelledby="alpha-planning-heading">
          <h3 id="alpha-planning-heading" className="flex items-center gap-2 text-lg font-extrabold">
            <ClipboardList aria-hidden="true" className="h-5 w-5"/> Your private planning list
          </h3>
          <p className="mt-2 text-sm text-[#40526e]">
            Saved for this session only; nothing is sent to a provider.
          </p>
          {saved.length ? <ul className="mt-4 space-y-3">
            {saved.map((id) => {
              const item = alphaItem(id);
              return item ? <li key={id} className="rounded-lg border border-[#d7e1ed] p-2 text-sm">
                <strong>{item.name}</strong>
                <p>{alphaMoney(item.cents)}</p>
                <button type="button" className="mt-2 min-h-11 font-semibold text-[#123D89] underline"
                  onClick={() => saveItem(id)}>Remove</button>
              </li> : null;
            })}
          </ul> : <p className="mt-3 text-sm">No examples saved yet.</p>}
          <div className="mt-4 border-t border-[#d2deec] pt-4">
            <p className="text-sm font-bold">Illustrative subtotal</p>
            <p className="mt-1 text-2xl font-black text-[#123D89]">{alphaMoney(amount)}</p>
            <p className="mt-2 text-xs text-[#52607a]">
              Not a quote, payable amount or NDIS eligibility decision.
              Fees, tax, delivery and funding are unverified.
            </p>
            <p className="mt-3 rounded-lg bg-[#fff3e5] p-3 text-sm font-bold text-[#6f3c0e]">
              Stripe and checkout disabled.
            </p>
          </div>
        </aside>
      </div>
    </section> : null}

    {view === "compare" ? <ComparePanel ids={compared} onRemove={compareItem}/> : null}
    {view === "exchange" ? <ExchangeWorkspace/> : null}
    {view === "testing" ? <TesterPanel/> : null}

    <div className="flex items-start gap-3 rounded-2xl border border-[#e4c59e] bg-[#fff4e6] p-4">
      <ShieldAlert aria-hidden="true" className="h-6 w-6 shrink-0 text-[#864708]"/>
      <div>
        <h2 className="font-extrabold text-[#5f350c]">No live marketplace operations</h2>
        <p className="mt-1 text-sm text-[#5f350c]">
          Closed alpha is designed for a small invited tester group. No production
          checkout, external catalogue ingestion, real seller onboarding, NDIS funding
          claims, prescriber certification or payment execution has been enabled.
        </p>
      </div>
    </div>
    <div className="flex items-center gap-2 rounded-xl bg-[#edf3fe] p-4 text-sm font-semibold text-[#123D89]"
      role="status" aria-live="polite" aria-atomic="true">
      <Info aria-hidden="true" className="h-5 w-5 shrink-0"/>{notice}
    </div>
    <p className="flex items-center gap-2 border-t border-[#cfdaeb] pt-4 text-xs text-[#52607a]">
      <FileText aria-hidden="true" className="h-4 w-4"/>
      Static open-data classifications; invented products and costs. WCAG 2.2 AA is a testing target, not a certification.
    </p>
  </div>;
}
