"use client";

/**
 * Evidence-first storefront and merchant UI demonstration.
 * No request to a commerce, payment, supplier, NDIS or account API occurs here.
 * View choice is not authentication or delegated authority.
 */
import {
  Accessibility, ArrowRight, BookOpen, Check, ClipboardList, Download,
  FileText, HandHelping, Headphones, Keyboard, LayoutGrid, List,
  MessageSquareText, Package, Search, ShieldAlert, ShoppingBag,
  SlidersHorizontal, Wrench, X,
} from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";

import {
  CATEGORY_LABELS, COMMERCE_LAB_OFFERS, EXEMPLAR_PATTERN, KIND_LABELS,
  NEED_LABELS, ROUTE_LABELS, addPlanningLine, filterCommerceOffers,
  formatDemoPrice, getCommerceOffer, makePrivatePlanningNote,
  sellerConceptErrors, summaryOfPlanning, updatePlanningQuantity,
  type AccessNeed, type CommerceOffer, type OfferCategory,
  type OfferKind, type PlanningLine, type SellerConcept, type ShopperPerspective,
} from "@/lib/marketplace/design-lab-model";

type View = "discover" | "compare" | "planning" | "seller" | "benchmarks";
type BrowsingLayout = "cards" | "list";

const button =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#073F97] " +
  "px-4 py-2 text-sm font-bold text-[#073F97] hover:bg-[#e9f1ff] " +
  "focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 " +
  "focus-visible:outline-[#F47716] disabled:cursor-not-allowed disabled:opacity-50";
const primary = button + " bg-[#073F97] text-white hover:bg-[#042d72]";
const select =
  "mt-1 block min-h-11 w-full rounded-xl border border-slate-400 bg-white px-3 py-2 " +
  "text-[#101b37] focus-visible:outline focus-visible:outline-4 " +
  "focus-visible:outline-offset-2 focus-visible:outline-[#F47716]";
const sections: { view: View; text: string }[] = [
  { view: "discover", text: "Discover" },
  { view: "compare", text: "Compare" },
  { view: "planning", text: "Planning list" },
  { view: "seller", text: "Seller workspace" },
  { view: "benchmarks", text: "Design references" },
];
const perspectiveText: Record<ShopperPerspective, string> = {
  participant: "Your priorities lead. You choose which offers to compare and whether to seek advice.",
  supporter: "This view helps you research alongside someone. It does not authorise you to purchase or see their records.",
  coordinator: "Prepare options for discussion. The participant retains decision-making control; this view provides no delegated account access.",
};
const statusLabel = {
  "example-statement": "Example seller statement; not verified",
  unknown: "Unknown — evidence needed",
} as const;
const categoryKeys = Object.keys(CATEGORY_LABELS) as OfferCategory[];
const kindKeys = Object.keys(KIND_LABELS) as OfferKind[];
const needKeys = Object.keys(NEED_LABELS) as AccessNeed[];
const panelClass = "rounded-2xl border border-[#cfdaeb] bg-white p-5 shadow-sm";
const labelClass = "text-sm font-bold text-[#263954]";

function OfferIcon({ kind, category }: { kind: OfferKind; category: OfferCategory }) {
  if (kind === "rental") return <ShoppingBag aria-hidden="true" className="h-12 w-12"/>;
  if (kind === "reuse") return <Package aria-hidden="true" className="h-12 w-12"/>;
  if (kind === "service") return <Wrench aria-hidden="true" className="h-12 w-12"/>;
  if (kind === "digital") return <FileText aria-hidden="true" className="h-12 w-12"/>;
  if (category === "communication") return <MessageSquareText aria-hidden="true" className="h-12 w-12"/>;
  if (category === "computing") return <Keyboard aria-hidden="true" className="h-12 w-12"/>;
  if (category === "home") return <Headphones aria-hidden="true" className="h-12 w-12"/>;
  if (category === "mobility") return <Accessibility aria-hidden="true" className="h-12 w-12"/>;
  return <HandHelping aria-hidden="true" className="h-12 w-12"/>;
}

function OfferingCard({
  offer, planned, compared, onPlan, onCompare, layout,
}: {
  offer: CommerceOffer;
  planned: boolean;
  compared: boolean;
  onPlan: () => void;
  onCompare: () => void;
  layout: BrowsingLayout;
}) {
  const blocked = offer.route === "unavailable";
  return (
    <article className={
      "flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[#cad6e9] bg-white shadow-sm " +
      (layout === "list" ? "md:flex-row" : "")
    }>
      <div className={
        "relative flex shrink-0 items-center justify-center bg-gradient-to-br from-[#e4efff] via-[#f0edff] to-[#fff3eb] text-[#073F97] " +
        (layout === "list" ? "h-48 md:h-auto md:w-44" : "h-40")
      }>
        <OfferIcon kind={offer.kind} category={offer.category}/>
        <span className="absolute bottom-3 left-3 rounded-md border border-[#a8bee4] bg-white px-2 py-1 text-xs font-bold text-[#073F97]">
          Example illustration
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-[#edf3ff] px-3 py-1 text-xs font-bold text-[#073F97]">
            {KIND_LABELS[offer.kind]}
          </span>
          <span className="rounded-full bg-[#f5effe] px-3 py-1 text-xs font-semibold text-[#5740B8]">
            {CATEGORY_LABELS[offer.category]}
          </span>
        </div>
        <h3 className="text-xl font-extrabold leading-snug text-[#101b37]">{offer.title}</h3>
        <p className="text-sm leading-relaxed text-[#34435f]">{offer.description}</p>
        <p className="text-sm text-[#34435f]">Seller: <strong>{offer.sellerName}</strong></p>
        <div className="flex flex-wrap gap-1.5" aria-label="Described functional access features">
          {offer.needs.map((need) => (
            <span key={need} className="rounded-md border border-[#cbd8ea] px-2 py-1 text-xs font-medium text-[#34435f]">
              {NEED_LABELS[need]}
            </span>
          ))}
        </div>
        <div className="mt-auto border-t border-[#e0e7f2] pt-3">
          <p className="text-lg font-black text-[#073F97]">
            {offer.priceCents === null ? "Quote or review required" : formatDemoPrice(offer.priceCents)}
          </p>
          <p className="text-xs text-[#53627c]">
            {offer.priceCents === null ? "No approved price" : "Illustrative price; not an offer to sell"}
          </p>
          <p className={"mt-2 rounded-lg p-2 text-sm font-bold " +
            (offer.route === "specialist" || blocked
              ? "bg-[#fff1dc] text-[#6a3d0a]" : "bg-[#eff6ff] text-[#073F97]")}>
            {ROUTE_LABELS[offer.route]}
          </p>
        </div>
        <details className="rounded-xl border border-[#c9d6e8] px-3 py-2">
          <summary className="min-h-8 cursor-pointer font-bold text-[#073F97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#F47716]">
            Evidence and suitability details
          </summary>
          <p className="mt-2 text-sm text-[#34435f]">{offer.note}</p>
          <p className="mt-2 text-sm font-semibold">Compatibility: {offer.compatibility}</p>
          <ul className="mt-3 space-y-2">
            {offer.evidence.map((record) => (
              <li key={record.label} className="border-t border-slate-200 pt-2 text-sm">
                <strong className="block text-[#101b37]">{record.label}</strong>
                <span className="block text-[#435773]">{record.detail}</span>
                <span className="text-[#5740B8]">{statusLabel[record.state]}</span>
              </li>
            ))}
          </ul>
        </details>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={planned ? primary : button} onClick={onPlan}
            disabled={blocked} aria-pressed={planned}
            aria-label={(planned ? "Remove from planning list: " : "Add to planning list: ") + offer.title}>
            {planned ? <Check aria-hidden="true" className="h-4 w-4"/> : <ClipboardList aria-hidden="true" className="h-4 w-4"/>}
            {planned ? "In your list" : blocked ? "Unavailable" : "Save option"}
          </button>
          <button type="button" className={button} onClick={onCompare}
            aria-pressed={compared}
            aria-label={(compared ? "Remove from comparison: " : "Compare: ") + offer.title}>
            {compared ? "Remove compare" : "Compare"}
          </button>
        </div>
      </div>
    </article>
  );
}

function CompareView({ ids, onRemove }: { ids: readonly string[]; onRemove: (id: string) => void }) {
  const items = ids.map((id) => getCommerceOffer(id)).filter((item): item is CommerceOffer => Boolean(item));
  if (items.length === 0) {
    return <div className={panelClass}>
      <h2 className="text-2xl font-bold">Compare your options</h2>
      <p className="mt-3">Select Compare on up to three example items in Discover to see their differences here.</p>
    </div>;
  }
  const cells = [
    ["Type", (item: CommerceOffer) => KIND_LABELS[item.kind]],
    ["Illustrative price", (item: CommerceOffer) => formatDemoPrice(item.priceCents)],
    ["Decision pathway", (item: CommerceOffer) => ROUTE_LABELS[item.route]],
    ["Functional features", (item: CommerceOffer) => item.needs.map((need) => NEED_LABELS[need]).join(", ")],
    ["Compatibility evidence", (item: CommerceOffer) => item.compatibility],
    ["Condition", (item: CommerceOffer) => item.condition.replace("illustrative-", "Example ").replaceAll("-", " ")],
    ["Seller verification", (_item: CommerceOffer) => "Not independently verified"],
    ["NDIS funding", (_item: CommerceOffer) => "Not assessed"],
  ] as const;
  return <section className="space-y-4" aria-labelledby="comparison-title">
    <div className={panelClass}>
      <h2 id="comparison-title" className="text-2xl font-bold">Side-by-side evidence</h2>
      <p className="mt-2 text-[#435773]">Differences are shown without a suitability score or sponsored ranking. Up to three items.</p>
      <div className="mt-5 overflow-x-auto rounded-xl border border-[#cbd6e8]">
        <table className="min-w-[600px] w-full border-collapse text-left text-sm">
          <caption className="sr-only">Comparison of synthetic items selected by the shopper</caption>
          <thead className="bg-[#edf3ff]">
            <tr>
              <th scope="col" className="w-40 border-b border-[#cbd6e8] p-3">Information</th>
              {items.map((item) => (
                <th scope="col" className="border-b border-[#cbd6e8] p-3" key={item.id}>{item.title}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cells.map(([name, value]) => (
              <tr key={name}>
                <th scope="row" className="border-b border-[#e0e7f2] p-3 align-top font-semibold">{name}</th>
                {items.map((item) => (
                  <td key={item.id} className="border-b border-[#e0e7f2] p-3 align-top">
                    {value(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {items.map((item) => (
          <button type="button" className={button} key={item.id} onClick={() => onRemove(item.id)}>
            <X aria-hidden="true" className="h-4 w-4"/> Remove {item.title}
          </button>
        ))}
      </div>
    </div>
  </section>;
}

function PlanningView({
  lines, perspective, updateQuantity, onRemove, onClear, onDownload,
}: {
  lines: readonly PlanningLine[];
  perspective: ShopperPerspective;
  updateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onDownload: () => void;
}) {
  const summary = summaryOfPlanning(lines);
  return <section className="space-y-5" aria-labelledby="planning-title">
    <div className={panelClass}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="planning-title" className="text-2xl font-extrabold">Your private planning list</h2>
          <p className="mt-2 text-[#435773]">
            A place to gather ideas for yourself or a conversation with someone you choose.
            No supplier is contacted, and no booking, order or payment is created.
          </p>
        </div>
        <span className="rounded-full bg-[#edf3ff] px-3 py-1 text-sm font-bold text-[#073F97]">{lines.length} / 8 options</span>
      </div>
      {lines.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-[#9db1d0] bg-[#f8faff] p-6">
          <p>Nothing in your planning list yet. Return to Discover to save options.</p>
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {lines.map((line) => {
            const item = getCommerceOffer(line.offerId);
            if (!item) return null;
            return <li key={line.offerId} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#d4dfef] p-4">
              <div className="min-w-0 flex-1">
                <strong className="block text-[#101b37]">{item.title}</strong>
                <p className="mt-1 text-sm text-[#435773]">{ROUTE_LABELS[item.route]} · {formatDemoPrice(item.priceCents)}</p>
              </div>
              <label className={labelClass}>
                Quantity
                <select className={select + " w-20"} value={line.quantity}
                  aria-label={"Quantity for " + item.title}
                  onChange={(event) => updateQuantity(item.id, Number(event.target.value))}>
                  {[1, 2, 3, 4, 5].map((q) => <option value={q} key={q}>{q}</option>)}
                </select>
              </label>
              <button className={button} type="button" onClick={() => onRemove(item.id)}
                aria-label={"Remove " + item.title + " from planning list"}>Remove</button>
            </li>;
          })}
        </ul>
      )}
    </div>
    <div className={panelClass}>
      <h3 className="text-xl font-bold">Illustrative item amounts</h3>
      <p className="mt-3 text-3xl font-black text-[#073F97]">
        {formatDemoPrice(summary.knownExampleSubtotalCents)}
      </p>
      <p className="mt-2 text-sm text-[#435773]">
        Priced example items only. {summary.unpricedCount} unpriced item(s).
        GST, delivery, funding, actual seller prices and safety checks are unknown.
        <strong className="ml-1">This is not a payable total or quotation.</strong>
      </p>
      <p className="mt-3 text-sm text-[#435773]">{perspectiveText[perspective]}</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" className={primary} onClick={onDownload} disabled={lines.length === 0}>
          <Download aria-hidden="true" className="h-4 w-4"/> Save local text note
        </button>
        <button type="button" className={button} onClick={onClear} disabled={lines.length === 0}>Clear list</button>
      </div>
      <p className="mt-3 text-sm font-semibold text-[#7a4509]">
        Checkout, payment links and NDIS claims are disabled in this design lab.
      </p>
    </div>
  </section>;
}

function SellerView() {
  const [draft, setDraft] = useState<SellerConcept>({
    title: "", description: "", kind: "product", evidenceNote: "",
  });
  const [issues, setIssues] = useState<string[]>([]);
  const [preview, setPreview] = useState<SellerConcept | null>(null);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const reviewQueue = [
    { id: "demo-mount", label: "Tablet and switch mount", reason: "Compatibility and load evidence missing" },
    { id: "demo-chair", label: "Manual wheelchair", reason: "Fitting and product-safety evidence missing" },
    { id: "demo-exchange", label: "Used walking frame", reason: "Ownership, condition and recall checks missing" },
  ];

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = sellerConceptErrors(draft);
    setIssues(errors);
    setPreview(errors.length === 0 ? { ...draft } : null);
  }
  return <section className="space-y-5" aria-labelledby="seller-title">
    <div className={panelClass}>
      <p className="text-xs font-bold uppercase tracking-wider text-[#5740B8]">PrestaShop-inspired admin · synthetic</p>
      <h2 id="seller-title" className="mt-2 text-2xl font-extrabold">Seller and reviewer workspace</h2>
      <p className="mt-2 text-[#435773]">
        Draft listings and inspect evidence gaps, with separate human review before any proposed publication.
        No real seller identity, ABN, medical-device approval, inventory or payout is checked here.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-[#edf3ff] p-4">
          <p className="text-2xl font-extrabold text-[#073F97]">3</p>
          <p className="text-sm text-[#34435f]">Synthetic review scenarios</p>
        </div>
        <div className="rounded-xl bg-[#fff2e5] p-4">
          <p className="text-2xl font-extrabold text-[#8f4300]">0</p>
          <p className="text-sm text-[#34435f]">Verified real sellers</p>
        </div>
        <div className="rounded-xl bg-[#f1edff] p-4">
          <p className="text-2xl font-extrabold text-[#5740B8]">0</p>
          <p className="text-sm text-[#34435f]">Published listings</p>
        </div>
      </div>
    </div>
    <div className={panelClass}>
      <h3 className="text-xl font-bold">Review queue — example cases</h3>
      <p className="mt-1 text-sm text-[#435773]">
        Use the controls to mark checklist reading as complete locally. This is not supplier approval.
      </p>
      <ul className="mt-4 space-y-3">
        {reviewQueue.map((row) => {
          const seen = reviewed.includes(row.id);
          return <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#cbd7e8] p-4">
            <div className="min-w-0 flex-1">
              <strong>{row.label}</strong>
              <p className="text-sm text-[#435773]">{row.reason}</p>
              <p className="text-xs font-bold text-[#8f4300]">
                {seen ? "Checklist viewed — still unverified" : "Awaiting evidence"}
              </p>
            </div>
            <button type="button" className={button}
              onClick={() => setReviewed((current) => seen
                ? current.filter((id) => id !== row.id)
                : [...current, row.id])}
              aria-pressed={seen}>
              {seen ? "Mark not viewed" : "Mark checklist viewed"}
            </button>
          </li>;
        })}
      </ul>
    </div>
    <div className={panelClass}>
      <h3 className="text-xl font-bold">Create a local listing concept</h3>
      <p className="mt-1 text-sm text-[#435773]">
        Values remain in this page session. The preview never submits, publishes or contacts anyone.
        Do not include disability, health or client-identifying information.
      </p>
      <form onSubmit={submit} className="mt-5 grid gap-4 md:grid-cols-2" noValidate>
        <label className={labelClass}>
          Product or service title
          <input className={select} value={draft.title} maxLength={100}
            onChange={(event) => { setDraft({ ...draft, title: event.target.value }); setPreview(null); }}/>
        </label>
        <label className={labelClass}>
          Listing type
          <select className={select} value={draft.kind} onChange={(event) => {
            setDraft({ ...draft, kind: event.target.value as OfferKind }); setPreview(null);
          }}>
            {kindKeys.map((key) => <option key={key} value={key}>{KIND_LABELS[key]}</option>)}
          </select>
        </label>
        <label className={labelClass + " md:col-span-2"}>
          Plain-language product or service description
          <textarea className={select} rows={3} maxLength={500} value={draft.description}
            onChange={(event) => { setDraft({ ...draft, description: event.target.value }); setPreview(null); }}/>
        </label>
        <label className={labelClass + " md:col-span-2"}>
          Evidence or compatibility to verify (optional)
          <textarea className={select} rows={2} maxLength={400} value={draft.evidenceNote}
            onChange={(event) => { setDraft({ ...draft, evidenceNote: event.target.value }); setPreview(null); }}/>
        </label>
        <button type="submit" className={primary + " md:col-span-2 md:justify-self-start"}>
          Preview locally — do not publish <ArrowRight aria-hidden="true" className="h-4 w-4"/>
        </button>
      </form>
      {issues.length > 0 ? <div role="alert" className="mt-4 rounded-xl border border-[#b77c51] bg-[#fff1e3] p-4">
        <strong>Review these fields:</strong>
        <ul className="mt-2 list-disc pl-5">{issues.map((issue) => <li key={issue}>{issue}</li>)}</ul>
      </div> : null}
      {preview ? <div role="status" className="mt-4 rounded-xl border border-[#b7cbea] bg-[#edf3ff] p-4">
        <strong>Private preview — not submitted</strong>
        <p className="mt-2 font-bold">{preview.title}</p>
        <p className="text-sm">{KIND_LABELS[preview.kind]} · {preview.description}</p>
        <p className="mt-1 text-sm">Still to verify: {preview.evidenceNote || "Seller and product evidence not supplied"}</p>
      </div> : null}
    </div>
  </section>;
}

function BenchmarkView() {
  const links: Record<string, string> = {
    "Adobe Commerce": "https://experienceleague.adobe.com/en/docs/commerce-admin/b2b/introduction",
    PrestaShop: "https://devdocs.prestashop-project.org/9/themes/hummingbird/accessibility/",
    "Zen Cart": "https://docs.zen-cart.com/user/products/",
    osCommerce: "https://www.oscommerce.com/blog/managing-products",
  };
  return <section className={panelClass} aria-labelledby="bench-title">
    <p className="text-xs font-bold uppercase tracking-wide text-[#5740B8]">Continuing design research</p>
    <h2 id="bench-title" className="mt-2 text-2xl font-extrabold">What we learned from four commerce platforms</h2>
    <p className="mt-2 text-[#435773]">
      These are experience patterns, not third-party code imports, certified accessibility or real commerce integrations.
    </p>
    <div className="mt-5 grid gap-4 md:grid-cols-2">
      {EXEMPLAR_PATTERN.map((pattern) => (
        <article key={pattern.name} className="rounded-xl border border-[#cbd7e8] p-5">
          <h3 className="text-xl font-bold">{pattern.name}</h3>
          <p className="mt-2 text-sm font-semibold text-[#5740B8]">Exemplar: {pattern.focus}</p>
          <p className="mt-3 text-sm text-[#435773]">MapAble adaptation: {pattern.application}</p>
          <a className="mt-3 inline-block font-bold text-[#073F97] underline underline-offset-4"
            href={links[pattern.name]} target="_blank" rel="noopener noreferrer">
            Read official documentation
          </a>
        </article>
      ))}
    </div>
    <p className="mt-5 rounded-xl bg-[#f5f8ff] p-4 text-sm">
      Shared Core must own real identity, consent, audit and delegate grants. PayCore/AbilityPay
      must own verified pricing, funding decisions and reconciliation if commerce is later approved.
      No testimonial, provider verification, funding eligibility or legal compliance is asserted.
    </p>
  </section>;
}

export function CommerceDesignLab() {
  const [view, setView] = useState<View>("discover");
  const [perspective, setPerspective] = useState<ShopperPerspective>("participant");
  const [searchText, setSearchText] = useState("");
  const [category, setCategory] = useState<OfferCategory | "all">("all");
  const [kind, setKind] = useState<OfferKind | "all">("all");
  const [need, setNeed] = useState<AccessNeed | "all">("all");
  const [specialist, setSpecialist] = useState<"include" | "exclude">("include");
  const [order, setOrder] = useState<"alpha" | "price">("alpha");
  const [layout, setLayout] = useState<BrowsingLayout>("cards");
  const [largeText, setLargeText] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [plan, setPlan] = useState<PlanningLine[]>([]);
  const [message, setMessage] = useState("Explore synthetic examples. No real checkout or seller contact.");
  const offers = useMemo(() => filterCommerceOffers({
    search: searchText, category, kind, need, specialist, order,
  }), [searchText, category, kind, need, specialist, order]);

  function planToggle(id: string) {
    try {
      const next = addPlanningLine(plan, id);
      setPlan(next);
      setMessage(plan.some((line) => line.offerId === id)
        ? "Example removed from planning list."
        : "Example saved to your private planning list. Nothing was sent.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not update planning list.");
    }
  }
  function updateQuantity(id: string, amount: number) {
    try {
      const next = updatePlanningQuantity(plan, id, amount);
      setPlan(next);
      setMessage("Planning quantity updated locally.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Invalid quantity.");
    }
  }
  function compareToggle(id: string) {
    if (compareIds.includes(id)) {
      setCompareIds((current) => current.filter((x) => x !== id));
      setMessage("Item removed from comparison.");
    } else if (compareIds.length >= 3) {
      setMessage("Compare up to three items. Remove one before adding another.");
    } else {
      setCompareIds((current) => [...current, id]);
      setMessage("Item added to comparison. Use the Compare section to inspect details.");
    }
  }
  function clearFilters() {
    setSearchText(""); setCategory("all"); setKind("all"); setNeed("all");
    setSpecialist("include"); setOrder("alpha");
  }
  function savePlanningNote() {
    if (!plan.length) return;
    try {
      const data = makePrivatePlanningNote(plan, perspective);
      const url = URL.createObjectURL(new Blob([data], { type: "text/plain;charset=utf-8" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = "mapable-private-planning-note.txt";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage("A text note was prepared on this device. No supplier was contacted.");
    } catch {
      setMessage("Could not generate this local note; review the list and try again.");
    }
  }

  return <div className={"space-y-6 text-[#101b37] " +
    (largeText ? "text-lg [&_p]:!text-lg [&_label]:!text-lg [&_button]:!text-lg" : "")}>
    <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#073F97] via-[#3f3aa7] to-[#6433a4] px-6 py-8 text-white sm:px-10">
      <div className="relative z-10 max-w-3xl">
        <p className="text-sm font-bold uppercase tracking-[.12em] text-[#f8e0c7]">
          MapAble Marketplace · Design lab
        </p>
        <h1 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
          Good choices start with good information.
        </h1>
        <p className="mt-3 max-w-xl leading-relaxed text-[#f1f2ff]">
          Explore equipment, adaptive goods and services through clear evidence,
          honest unknowns and your own priorities.
        </p>
        <p role="note" className="mt-5 rounded-xl border border-white/50 bg-white p-4 text-sm font-semibold text-[#17325a]">
          Synthetic design preview — not a live shop. No real products, providers, stock,
          sales, bookings, NDIS funding decisions or payments.
        </p>
      </div>
      <ShoppingBag aria-hidden="true"
        className="absolute -right-8 top-2 h-52 w-52 rotate-[-16deg] text-white/10"/>
    </header>

    <nav aria-label="Commerce design lab sections"
      className="flex flex-wrap gap-2 rounded-2xl border border-[#d3dcec] bg-white p-3">
      {sections.map((section) => (
        <button type="button" key={section.view} aria-pressed={view === section.view}
          onClick={() => { setView(section.view); setMessage(section.text + " view opened."); }}
          className={view === section.view ? primary : button}>
          {section.text}
          {section.view === "compare" && compareIds.length ? " (" + compareIds.length + ")" : ""}
          {section.view === "planning" && plan.length ? " (" + plan.length + ")" : ""}
        </button>
      ))}
    </nav>

    <section aria-label="Browsing preferences" className="grid gap-4 rounded-2xl border border-[#d3dcec] bg-white p-5 sm:grid-cols-2">
      <div>
        <label htmlFor="lab-perspective" className={labelClass}>Explore as</label>
        <select id="lab-perspective" className={select} value={perspective}
          onChange={(event) => setPerspective(event.target.value as ShopperPerspective)}>
          <option value="participant">Person shopping for themselves</option>
          <option value="supporter">Chosen supporter or carer</option>
          <option value="coordinator">Support coordinator</option>
        </select>
        <p className="mt-2 text-sm text-[#435773]">{perspectiveText[perspective]}</p>
      </div>
      <div className="sm:justify-self-end">
        <label className="flex min-h-11 cursor-pointer items-center gap-3 font-semibold">
          <input type="checkbox" className="h-5 w-5 accent-[#073F97]"
            checked={largeText} onChange={(event) => setLargeText(event.target.checked)}/>
          Larger text
        </label>
        <p className="text-sm text-[#435773]">
          Changing the guidance view does not change permissions. No diagnosis or plan number is requested.
        </p>
      </div>
    </section>

    {view === "discover" ? <section aria-labelledby="lab-discover-heading">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[#5740B8]">Browse and compare</p>
          <h2 id="lab-discover-heading" className="mt-1 text-2xl font-extrabold">Find options that suit your priorities</h2>
          <p className="mt-1 text-[#435773]">Filter by functional features, not by diagnosis.</p>
        </div>
        <div className="flex gap-2" role="group" aria-label="Listing layout">
          <button type="button" className={layout === "cards" ? primary : button}
            aria-pressed={layout === "cards"} onClick={() => setLayout("cards")}>
            <LayoutGrid aria-hidden="true" className="h-4 w-4"/> Cards
          </button>
          <button type="button" className={layout === "list" ? primary : button}
            aria-pressed={layout === "list"} onClick={() => setLayout("list")}>
            <List aria-hidden="true" className="h-4 w-4"/> List
          </button>
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-[255px_minmax(0,1fr)]">
        <aside className={panelClass + " self-start"} aria-label="Product filters">
          <div className="mb-3 flex items-center gap-2">
            <SlidersHorizontal aria-hidden="true" className="h-5 w-5 text-[#073F97]"/>
            <h3 className="text-lg font-extrabold">Filters</h3>
          </div>
          <div className="space-y-4">
            <label className={"block " + labelClass}>
              Search terms
              <span className="relative block">
                <Search aria-hidden="true" className="absolute left-3 top-4 h-4 w-4 text-[#53627c]"/>
                <input type="search" className={select + " pl-10"}
                  placeholder="AAC, keyboard, repair..." value={searchText} maxLength={100}
                  onChange={(event) => setSearchText(event.target.value)}/>
              </span>
            </label>
            <label className={"block " + labelClass}>
              Type of offering
              <select className={select} value={kind}
                onChange={(event) => setKind(event.target.value as OfferKind | "all")}>
                <option value="all">All types</option>
                {kindKeys.map((key) => <option key={key} value={key}>{KIND_LABELS[key]}</option>)}
              </select>
            </label>
            <label className={"block " + labelClass}>
              Category
              <select className={select} value={category}
                onChange={(event) => setCategory(event.target.value as OfferCategory | "all")}>
                <option value="all">All categories</option>
                {categoryKeys.map((key) => <option key={key} value={key}>{CATEGORY_LABELS[key]}</option>)}
              </select>
            </label>
            <label className={"block " + labelClass}>
              What does it help with?
              <select className={select} value={need}
                onChange={(event) => setNeed(event.target.value as AccessNeed | "all")}>
                <option value="all">All access features</option>
                {needKeys.map((key) => <option key={key} value={key}>{NEED_LABELS[key]}</option>)}
              </select>
            </label>
            <label className={"block " + labelClass}>
              Professional review
              <select className={select} value={specialist}
                onChange={(event) => setSpecialist(event.target.value as "include" | "exclude")}>
                <option value="include">Show all options</option>
                <option value="exclude">Hide specialist and restricted examples</option>
              </select>
            </label>
            <label className={"block " + labelClass}>
              Sort options
              <select className={select} value={order}
                onChange={(event) => setOrder(event.target.value as "alpha" | "price")}>
                <option value="alpha">A to Z</option>
                <option value="price">Illustrative price (unpriced last)</option>
              </select>
            </label>
            <button type="button" className={button + " w-full"} onClick={clearFilters}>Clear filters</button>
          </div>
        </aside>
        <div className="min-w-0">
          <p role="status" aria-live="polite" className="mb-3 text-sm font-bold text-[#34435f]">
            {offers.length} of {COMMERCE_LAB_OFFERS.length} synthetic examples shown
          </p>
          {offers.length === 0 ? <div className={panelClass}>
            <h3 className="text-xl font-bold">No matching examples</h3>
            <p className="mt-2">Change your search terms or clear the filters. There are no live supplier results in this preview.</p>
            <button type="button" className={button + " mt-4"} onClick={clearFilters}>Clear filters</button>
          </div> : (
            <ul className={"grid list-none gap-4 p-0 " +
              (layout === "list" ? "grid-cols-1" : "sm:grid-cols-2")}>
              {offers.map((offer) => <li className="min-w-0" key={offer.id}>
                <OfferingCard offer={offer} layout={layout}
                  planned={plan.some((line) => line.offerId === offer.id)}
                  compared={compareIds.includes(offer.id)}
                  onPlan={() => planToggle(offer.id)}
                  onCompare={() => compareToggle(offer.id)}/>
              </li>)}
            </ul>
          )}
        </div>
      </div>
    </section> : null}

    {view === "compare" ? <CompareView ids={compareIds} onRemove={compareToggle}/> : null}
    {view === "planning" ? <PlanningView lines={plan} perspective={perspective}
      updateQuantity={updateQuantity} onRemove={planToggle}
      onClear={() => { setPlan([]); setMessage("Planning list cleared. No order existed."); }}
      onDownload={savePlanningNote}/> : null}
    {view === "seller" ? <SellerView/> : null}
    {view === "benchmarks" ? <BenchmarkView/> : null}

    <div className="flex gap-3 rounded-xl border border-[#d4deee] bg-[#f7f9ff] p-4">
      <ShieldAlert aria-hidden="true" className="h-6 w-6 shrink-0 text-[#9a530e]"/>
      <div>
        <h2 className="font-extrabold">Participant choice and product safety are non-negotiable</h2>
        <p className="mt-1 text-sm text-[#435773]">
          These examples are invented. Suitability, seller identity, stock, price, GST, warranty,
          medical-device status and NDIS funding cannot be inferred from this UI. Specialist products
          stay in an assessment pathway, and user-facing help must have an accessible human alternative.
        </p>
      </div>
    </div>
    <div className="rounded-xl bg-[#eff5ff] px-4 py-3 text-sm font-semibold text-[#073F97]"
      role="status" aria-live="polite" aria-atomic="true">{message}</div>
    <footer className="flex flex-wrap items-center gap-2 border-t border-[#d3dcec] pt-4 text-sm text-[#435773]">
      <BookOpen aria-hidden="true" className="h-4 w-4"/>
      <span>Based on Adobe Commerce, PrestaShop, Zen Cart and osCommerce patterns; no third-party software installed.</span>
      <span>WCAG 2.2 AA is a testing goal, not a certification.</span>
    </footer>
  </div>;
}
