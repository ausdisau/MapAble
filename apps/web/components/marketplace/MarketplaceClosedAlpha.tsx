"use client";

import { useMemo, useState } from "react";
import { CLOSED_ALPHA_ITEMS, prepareAlphaBasket } from "@/packages/marketplace-inclusive/src/alpha-catalogue";

const format = (cents: number | null) => cents === null ? "Enquiry only" : new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(cents / 100);
export function MarketplaceClosedAlpha() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState("No order or payment is created.");
  const visible = useMemo(() => CLOSED_ALPHA_ITEMS.filter((item) => (item.name + " " + item.description).toLowerCase().includes(query.trim().toLowerCase())), [query]);
  const total = selected.reduce((sum, id) => sum + (CLOSED_ALPHA_ITEMS.find((item) => item.id === id)?.priceCents ?? 0), 0);
  function toggle(id: string) { setSelected((prior) => prior.includes(id) ? prior.filter((x) => x !== id) : prior.length >= 8 ? prior : [...prior, id]); }
  function prepare() {
    try {
      const basket = prepareAlphaBasket(selected);
      setMessage("Synthetic enquiry prepared for " + basket.items.length + " items. Illustrative subtotal " + format(basket.totalCents) + ". Nothing submitted or charged.");
    } catch { setMessage("The selection cannot be prepared. Remove restricted or specialist-review items."); }
  }
  return <section className="mx-auto max-w-5xl space-y-6" aria-labelledby="marketplace-alpha-heading">
    <div className="rounded-xl border-2 border-blue-800 bg-blue-50 p-5 text-blue-950">
      <h1 id="marketplace-alpha-heading" className="text-3xl font-bold">MapAble Marketplace — closed alpha</h1>
      <p className="mt-2">Synthetic examples only. No real suppliers, stock, orders, NDIS funding decisions or payments. Information about access and suitability remains unverified.</p>
      <p className="mt-2">Your choice matters. This demo never ranks products by diagnosis or sponsored placement.</p>
    </div>
    <label className="block font-semibold" htmlFor="alpha-search">Search catalogue</label>
    <input id="alpha-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} className="w-full rounded-lg border border-slate-600 p-3 text-base" placeholder="Search communication or daily living" />
    <p role="status" aria-live="polite">{visible.length} examples found; {selected.length} selected.</p>
    <div className="grid gap-4 md:grid-cols-2">{visible.map((item) => <article key={item.id} className="space-y-2 rounded-xl border border-slate-300 p-5">
      <h2 className="text-xl font-bold">{item.name}</h2>
      <p>{item.description}</p>
      <p><strong>{format(item.priceCents)}</strong> — illustrative, not an offer.</p>
      <p>Seller: {item.seller}. Evidence: {item.evidence.evidenceStatus}. Safety: {item.safety.replaceAll("-", " ")}.</p>
      <button className="min-h-12 rounded-lg border border-blue-900 px-4 py-2 font-semibold focus-visible:outline-4" type="button" disabled={item.safety !== "low-risk-demo"} aria-pressed={selected.includes(item.id)} onClick={() => toggle(item.id)}>{item.safety !== "low-risk-demo" ? "Specialist review / unavailable" : selected.includes(item.id) ? "Remove from draft" : "Add to draft"}</button>
    </article>)}</div>
    <section aria-labelledby="alpha-draft-title" className="space-y-3 rounded-xl border p-5">
      <h2 id="alpha-draft-title" className="text-xl font-bold">Draft enquiry, not a checkout</h2>
      <p>Illustrative subtotal: {format(total)}. No GST, shipping or NDIS eligibility assessment.</p>
      <button type="button" disabled={selected.length === 0} onClick={prepare} className="min-h-12 rounded-lg bg-blue-800 px-5 py-3 font-semibold text-white disabled:opacity-50">Prepare synthetic enquiry</button>
      <p role="status" aria-live="polite">{message}</p>
      <button type="button" onClick={() => {setSelected([]); setMessage("Draft cleared.");}} className="min-h-12 rounded-lg border px-4 py-2">Clear draft</button>
    </section>
  </section>;
}
