"use client";

/**
 * Buyer–seller/AT advisory simulation. All actors, grants, quotes and notes
 * exist in browser memory only. Role switching demonstrates journeys; it
 * NEVER constitutes real authentication, consent or credential checking.
 */
import {
  ArrowLeft, ArrowRight, BookOpenCheck, Check, ClipboardCheck,
  FileText, Handshake, Info, RotateCcw, ShieldAlert, Store, Users,
  Wrench, X,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";

import {
  COMMERCE_LAB_OFFERS, KIND_LABELS, formatDemoPrice, getCommerceOffer,
  type CommerceOffer,
} from "@/lib/marketplace/design-lab-model";
import {
  DEMO_ACTORS, applyExchangeCommand, atCostBand, formatExampleDay,
  getVisibleAdvice, getVisibleQuotes, getVisibleRequests,
  getVisibleSupportNotes, makeSyntheticExchange, parseExampleDollars,
  sellerCanOffer,
  type ExchangeActorId, type ExchangeAudit, type ExchangeCommand,
  type ExchangeGrant, type ExchangeIntent, type ExchangeQuote,
  type ExchangeRequest, type ExchangeState, type QuoteParts,
} from "@/lib/marketplace/dual-sided/exchange-model";

type View = "buyer" | "supplier" | "provider" | "advisor" | "coordinator" | "activity";
const views: ReadonlyArray<{ id: View; label: string }> = [
  { id: "buyer", label: "Buyer workspace" },
  { id: "supplier", label: "Equipment suppliers" },
  { id: "provider", label: "Service providers" },
  { id: "advisor", label: "AT advisors" },
  { id: "coordinator", label: "Support coordinators" },
  { id: "activity", label: "Activity history" },
];

const panel = "rounded-2xl border border-[#c7d6eb] bg-white p-5 shadow-sm sm:p-6";
const button = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#073F97] px-4 py-2 text-sm font-bold text-[#073F97] hover:bg-[#e8f2ff] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#f07b2e] disabled:cursor-not-allowed disabled:opacity-50";
const primary = button + " bg-[#073F97] text-white hover:bg-[#092c6f]";
const warning = "rounded-xl border border-[#c79963] bg-[#fff4e7] p-4 text-sm text-[#5f3309]";
const input = "mt-1 block min-h-11 w-full rounded-xl border border-[#7c8da7] bg-white px-3 py-2 text-[#111d35] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#f07b2e]";
const label = "block text-sm font-semibold text-[#283955]";
const actorNames: Record<ExchangeActorId, string> = Object.fromEntries(
  Object.entries(DEMO_ACTORS).map(([key, entry]) => [key, entry.name]),
) as Record<ExchangeActorId, string>;

function CostEvidence({ offer, quote }: { offer: CommerceOffer; quote: ExchangeQuote }) {
  const band = atCostBand(quote.parts.itemCents);
  const classification = offer.kind === "service"
    ? "This is an illustrative service amount, not an NDIS claim or endorsed rate."
    : band === "high"
      ? "High-cost example (over $15,000): an eligible high-cost AT purchase generally needs a qualified assessment, quote and NDIA funding approval before using that funding."
      : band === "mid"
        ? "Mid-cost example ($1,500–$15,000): NDIS-funded purchasing generally requires written AT advice and relevant plan funding."
        : "Low-cost example: funding eligibility is not established; higher-risk AT may still require written advice.";
  return (
    <div className="mt-3 rounded-lg border border-[#d8e0ee] bg-[#f7f9fd] p-3">
      <p className="font-bold text-[#073F97]">{formatDemoPrice(quote.totalCents)} <span className="text-sm font-medium">— nonbinding example only</span></p>
      <dl className="mt-2 grid grid-cols-2 gap-2 text-sm text-[#40516d]">
        <div><dt>Item/service</dt><dd>{formatDemoPrice(quote.parts.itemCents)}</dd></div>
        <div><dt>Delivery</dt><dd>{formatDemoPrice(quote.parts.deliveryCents)}</dd></div>
        <div><dt>Installation</dt><dd>{formatDemoPrice(quote.parts.installationCents)}</dd></div>
        <div><dt>Training</dt><dd>{formatDemoPrice(quote.parts.trainingCents)}</dd></div>
      </dl>
      <p className="mt-2 text-sm text-[#5c390d]">
        {classification} GST treatment, supplier verification and funding approval are unknown.
      </p>
    </div>
  );
}

function AccessTag({ grant, today }: { grant: ExchangeGrant; today: string }) {
  const active = grant.active && grant.expiresOn >= today;
  return <span className={"inline-block rounded-lg border px-2 py-1 text-xs font-semibold " +
    (active
      ? "border-[#bfd3e9] bg-[#ebf4ff] text-[#073F97]"
      : "border-[#c5ccd7] bg-slate-100 text-[#4b5363]")}>
    {actorNames[grant.recipient]} · {grant.scope} ·
    {active ? " permitted to " + grant.expiresOn : " expired / revoked"}
  </span>;
}

function CreateRequest({
  onCreate,
}: { onCreate: (offerId: string, goal: string) => boolean }) {
  const [offerId, setOfferId] = useState("demo-jar");
  const [goal, setGoal] = useState("");
  const available = COMMERCE_LAB_OFFERS.filter((entry) => entry.route !== "unavailable");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (onCreate(offerId, goal)) setGoal("");
  }
  return <section className={panel} aria-labelledby="create-request-heading">
    <div className="flex items-center gap-2">
      <FileText className="h-5 w-5 text-[#073F97]" aria-hidden="true"/>
      <h2 id="create-request-heading" className="text-xl font-extrabold">Prepare a new enquiry</h2>
    </div>
    <p className="mt-2 text-[#40516d]">
      Describe what you want to compare. Do not include a diagnosis, plan number,
      address or personal health information. The draft remains on this device.
    </p>
    <form onSubmit={submit} className="mt-4 grid gap-4 md:grid-cols-[1fr_1.5fr_auto] md:items-end">
      <label className={label}>
        Example offering
        <select className={input} value={offerId}
          onChange={(e) => setOfferId(e.target.value)}>
          {available.map((entry) => <option key={entry.id} value={entry.id}>
            {entry.title}
          </option>)}
        </select>
      </label>
      <label className={label}>
        What would you like to understand? (10–200 characters)
        <input type="text" className={input} minLength={10} maxLength={200}
          placeholder="Compare options, trials and setup requirements"
          value={goal} required onChange={(e) => setGoal(e.target.value)}/>
      </label>
      <button type="submit" className={primary}>
        Create local draft <ArrowRight className="h-4 w-4" aria-hidden="true"/>
      </button>
    </form>
  </section>;
}

function BuyerRequest({
  request, state, today, dispatch,
}: {
  request: ExchangeRequest;
  state: ExchangeState;
  today: string;
  dispatch: (intent: ExchangeIntent, success: string) => boolean;
}) {
  const offer = getCommerceOffer(request.offerId);
  if (!offer) return null;
  const quotes = getVisibleQuotes(state, request, "participant", today);
  const advice = getVisibleAdvice(state, request, "participant", today);
  const notes = getVisibleSupportNotes(state, request, "participant", today);
  const recipients = (Object.keys(DEMO_ACTORS) as ExchangeActorId[]).filter(
    (id) => id === "independentAdvisor" || id === "coordinator" ||
      sellerCanOffer(offer, id),
  );
  const closed = request.status === "closed";

  return <article className={panel + " space-y-4"} aria-labelledby={"buyer-" + request.id}>
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-wide text-[#5740A2]">
          {request.id} · {KIND_LABELS[offer.kind]} · Example
        </p>
        <h3 id={"buyer-" + request.id} className="mt-1 text-xl font-extrabold">
          {offer.title}
        </h3>
        <p className="mt-2 text-sm text-[#40516d]">{request.goal}</p>
      </div>
      <span className="rounded-full border border-[#b8c9e4] bg-[#edf3ff] px-3 py-1 text-sm font-bold text-[#073F97]">
        {closed ? "Closed" : request.status === "draft" ? "Private draft" : "Shared with chosen recipients"}
      </span>
    </div>

    <section aria-labelledby={"grants-" + request.id} className="rounded-xl border border-[#dce3f0] p-4">
      <h4 id={"grants-" + request.id} className="font-extrabold">Who can view this example enquiry?</h4>
      <p className="mt-1 text-sm text-[#40516d]">
        You control each time-limited share. Suppliers see this request's general description only;
        advisors and coordinators have different scopes. No clinical records are shared.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {request.grants.length ? request.grants.map((g) =>
          <AccessTag key={g.id} grant={g} today={today}/>,
        ) : <span className="text-sm">Nobody has been invited.</span>}
      </div>
      {!closed ? <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {recipients.map((id) => {
          const grant = request.grants.find((g) => g.recipient === id && g.active);
          return <button type="button" className={button} key={id}
            onClick={() => {
              if (grant) dispatch({
                type: "revoke", actorId: "participant",
                requestId: request.id, grantId: grant.id,
              }, "Example permission withdrawn. That role no longer sees this enquiry.");
              else dispatch({
                type: "grant", actorId: "participant", requestId: request.id,
                recipient: id, expiresOn: formatExampleDay(30, today),
              }, "Example permission granted for 30 days. No external message was sent.");
            }}>
            {grant ? <X aria-hidden="true" className="h-4 w-4"/> : <Check aria-hidden="true" className="h-4 w-4"/>}
            {grant ? "Revoke " : "Share with "}{actorNames[id]}
          </button>;
        })}
      </div> : null}
    </section>

    <section aria-labelledby={"quote-list-" + request.id}>
      <h4 id={"quote-list-" + request.id} className="text-lg font-extrabold">
        Illustrative supplier/provider quotations ({quotes.length})
      </h4>
      {quotes.length ? <div className="mt-3 grid gap-3 lg:grid-cols-2">
        {quotes.map((quote) => <div key={quote.id}
          className="rounded-xl border border-[#ccd8e9] p-4">
          <strong>{actorNames[quote.sellerId]}</strong>
          <p className="mt-1 text-sm font-semibold text-[#5740A2]">
            Status: {quote.status} · {quote.id}
          </p>
          <CostEvidence offer={offer} quote={quote}/>
          <p className="mt-2 text-sm text-[#40516d]">Terms: {quote.terms}</p>
          {quote.status === "proposed" && !closed ? <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className={primary} onClick={() => dispatch({
              type: "shortlist_quote", actorId: "participant",
              quoteId: quote.id, requestId: request.id,
            }, "Proposal shortlisted for discussion only. No order or financial commitment.")}>
              Shortlist (not a purchase)
            </button>
            <button type="button" className={button} onClick={() => dispatch({
              type: "decline_quote", actorId: "participant",
              quoteId: quote.id, requestId: request.id,
            }, "Example proposal declined.")}>
              Decline proposal
            </button>
          </div> : <p className="mt-3 text-sm font-semibold text-[#59428d]">
            {quote.status === "shortlisted" ? "Saved for discussion only" : "No further selection is available"}
          </p>}
        </div>)}
      </div> : <p className="mt-2 text-sm text-[#40516d]">
        No example quotes yet. You may choose suppliers or providers to invite above.
      </p>}
    </section>

    <section className="grid gap-3 md:grid-cols-2">
      <div className="rounded-xl border border-[#d2dced] bg-[#f8faff] p-4">
        <h4 className="font-extrabold">Independent AT advice</h4>
        <p className="mt-1 text-xs text-[#59428d]">Not a prescription, assessment or verified clinician finding</p>
        {advice.length ? <ul className="mt-2 list-disc space-y-2 pl-5 text-sm">
          {advice.map((note) => <li key={note.id}>{note.text}</li>)}
        </ul> : <p className="mt-2 text-sm">No advisory considerations in this example.</p>}
      </div>
      <div className="rounded-xl border border-[#d2dced] bg-[#f8faff] p-4">
        <h4 className="font-extrabold">Support coordination</h4>
        <p className="mt-1 text-xs text-[#59428d]">Information preparation only — never substitute purchase authority</p>
        {notes.length ? <ul className="mt-2 list-disc space-y-2 pl-5 text-sm">
          {notes.map((note) => <li key={note.id}>{note.text}</li>)}
        </ul> : <p className="mt-2 text-sm">No coordinator note in this example.</p>}
      </div>
    </section>
    {offer.route === "specialist" ? <div className={warning}>
      <strong>Specialist review pathway:</strong> Product fit, trial evidence, professional
      assessment and funding remain unverified. No direct checkout is offered.
    </div> : null}
    {!closed ? <div className="border-t border-[#dae3ef] pt-4">
      <button type="button" className={button} onClick={() => dispatch({
        type: "close_request", actorId: "participant", requestId: request.id,
      }, "Enquiry closed and all example sharing revoked.")}>
        Close this example enquiry and revoke sharing
      </button>
    </div> : null}
  </article>;
}

interface QuoteFormProps {
  requestId: string;
  actorId: ExchangeActorId;
  onSubmit: (parts: QuoteParts, terms: string) => boolean;
}
function QuoteForm({ requestId, actorId, onSubmit }: QuoteFormProps) {
  const [amount, setAmount] = useState("180");
  const [delivery, setDelivery] = useState("0");
  const [installation, setInstallation] = useState("0");
  const [training, setTraining] = useState("0");
  const [terms, setTerms] = useState("Example quote only; seller and service details unverified.");
  const [error, setError] = useState("");
  const fields = [
    { key: "item", label: "Item or service (AUD)", value: amount, setter: setAmount },
    { key: "delivery", label: "Delivery (AUD)", value: delivery, setter: setDelivery },
    { key: "installation", label: "Installation (AUD)", value: installation, setter: setInstallation },
    { key: "training", label: "Training (AUD)", value: training, setter: setTraining },
  ] as const;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      const parts: QuoteParts = {
        itemCents: parseExampleDollars(amount),
        deliveryCents: parseExampleDollars(delivery),
        installationCents: parseExampleDollars(installation),
        trainingCents: parseExampleDollars(training),
      };
      if (onSubmit(parts, terms)) setTerms("Example quote only; no financial obligation.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Enter valid amounts.");
    }
  }
  return <form onSubmit={submit} className="mt-4 rounded-xl border border-[#cbd8ed] bg-[#f8faff] p-4">
    <h4 className="font-extrabold">Prepare a nonbinding quotation</h4>
    <p className="mt-1 text-sm text-[#40516d]">
      Quote from {actorNames[actorId]} for {requestId}. All amounts, availability,
      GST and professional status are fictional.
    </p>
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      {fields.map((field) => <label key={field.key} className={label}>
        {field.label}
        <input className={input} inputMode="decimal" type="text" required
          maxLength={12} value={field.value}
          onChange={(e) => field.setter(e.target.value)}/>
      </label>)}
    </div>
    <label className={label + " mt-3"}>
      Example terms (12–260 characters)
      <textarea className={input} rows={2} minLength={12} maxLength={260}
        required value={terms} onChange={(e) => setTerms(e.target.value)}/>
    </label>
    {error ? <p role="alert" className="mt-2 text-sm font-semibold text-[#9d2c2c]">{error}</p> : null}
    <button className={primary + " mt-4"} type="submit">
      Add fictional quote to shared demonstration
    </button>
  </form>;
}

function SellerWorkspace({
  state, today, actorId, dispatch,
}: {
  state: ExchangeState; today: string; actorId: ExchangeActorId;
  dispatch: (intent: ExchangeIntent, success: string) => boolean;
}) {
  const visible = getVisibleRequests(state, actorId, today);
  const isSupplier = DEMO_ACTORS[actorId].role === "supplier";
  return <section aria-labelledby="seller-workspace-heading" className="space-y-5">
    <div className={panel}>
      <p className="text-xs font-bold uppercase tracking-wider text-[#5840a7]">
        {isSupplier ? "Equipment supplier portal" : "Service provider portal"}
      </p>
      <h2 id="seller-workspace-heading" className="mt-2 text-2xl font-extrabold">
        {actorNames[actorId]}
      </h2>
      <p className="mt-2 text-[#40516d]">
        Review only examples explicitly shared with this simulated seller, prepare
        itemised quotations and withdraw draft proposals. Suppliers are not
        authorised to approve assessments, funding, purchases or payouts.
      </p>
      <p className="mt-3 rounded-xl bg-[#fff3e7] p-3 text-sm font-semibold text-[#68400f]">
        Synthetic role — identity, business registration, insurance, inventory and
        qualifications are not verified. No message or offer is sent externally.
      </p>
    </div>
    {!visible.length ? <div className={panel}>
      <h3 className="text-lg font-extrabold">No shared enquiries</h3>
      <p className="mt-2 text-[#40516d]">
        The participant has not granted this example organisation access to an open request.
        Switch back to the buyer view to select a recipient, or try a different synthetic seller.
      </p>
    </div> : visible.map((request) => {
      const offer = getCommerceOffer(request.offerId);
      if (!offer || !sellerCanOffer(offer, actorId)) return null;
      const quotes = getVisibleQuotes(state, request, actorId, today);
      const active = quotes.find((quote) => quote.status === "proposed" || quote.status === "shortlisted");
      return <article key={request.id} className={panel + " space-y-3"}>
        <p className="text-xs font-bold text-[#5840a7]">{request.id} · Access granted, time-limited</p>
        <h3 className="text-xl font-extrabold">{offer.title}</h3>
        <p className="text-sm text-[#40516d]">Participant's example question: {request.goal}</p>
        <p className="text-sm">Product evidence: <strong>unknown</strong>. Never infer clinical fit.</p>
        {quotes.map((quote) => <div key={quote.id} className="rounded-xl border border-[#ccd8e9] p-3">
          <p className="font-bold">{quote.id} — {quote.status}</p>
          <CostEvidence offer={offer} quote={quote}/>
          {(quote.status === "proposed" || quote.status === "shortlisted") ? <button
            type="button" className={button + " mt-3"} onClick={() => dispatch({
              type: "withdraw_quote", actorId, requestId: request.id, quoteId: quote.id,
            }, "Example quotation withdrawn. It cannot be used as an order.")}>
            Withdraw example quotation
          </button> : null}
        </div>)}
        {!active && quotes.length < 6 ? <QuoteForm key={request.id + actorId}
          requestId={request.id} actorId={actorId}
          onSubmit={(parts, terms) => dispatch({
            type: "propose_quote", actorId, requestId: request.id, parts, terms,
          }, "A nonbinding example quote was added. No payment or seller communication occurred.")}/>
          : <p className="rounded-lg bg-[#f2f6fd] p-3 text-sm font-semibold">
            {active ? "An active example quote exists. Withdraw it before entering a new one."
              : "The quotation limit was reached."}
          </p>}
      </article>;
    })}
  </section>;
}

function NotesWorkspace({
  state, today, actorId, dispatch,
}: {
  state: ExchangeState; today: string;
  actorId: "independentAdvisor" | "coordinator";
  dispatch: (intent: ExchangeIntent, success: string) => boolean;
}) {
  const [notes, setNotes] = useState<Record<string, string>>({});
  const visible = getVisibleRequests(state, actorId, today);
  const isAdvisor = actorId === "independentAdvisor";
  function addNote(event: FormEvent<HTMLFormElement>, requestId: string) {
    event.preventDefault();
    const text = notes[requestId] || "";
    if (dispatch(isAdvisor
      ? { type: "add_advice", actorId, requestId, text }
      : { type: "add_support_note", actorId, requestId, text },
    "Illustrative note added locally. Not a clinical assessment or authorisation.")) {
      setNotes((current) => ({ ...current, [requestId]: "" }));
    }
  }
  return <section className="space-y-5" aria-labelledby="notes-workspace-heading">
    <div className={panel}>
      <p className="text-xs font-bold uppercase tracking-wider text-[#5840a7]">
        {isAdvisor ? "Independent assistive-technology advice" : "Participant-selected coordination"}
      </p>
      <h2 id="notes-workspace-heading" className="mt-2 text-2xl font-extrabold">
        {isAdvisor ? "Advisor / prescriber workbench" : "Support coordinator workspace"}
      </h2>
      <p className="mt-2 text-[#40516d]">
        {isAdvisor
          ? "Support evidence gathering, trial planning and participant choice. A real assessment would require verified qualified clinicians, professional scope, records protection and appropriate clinical governance."
          : "Help the participant compare providers, prepare questions and organise trials. This role never confers authority to purchase, share private records or accept a quote."}
      </p>
      <div className={warning + " mt-4"}>
        <strong>Rights safeguard:</strong> Switching to this synthetic role does not
        grant legal decision-making authority. No real credentials or healthcare
        documentation have been verified.
      </div>
    </div>
    {!visible.length ? <div className={panel}>
      <h3 className="text-lg font-extrabold">No permitted enquiries</h3>
      <p className="mt-2 text-[#40516d]">
        The participant must separately invite this role and permit access.
        Sharing with a supplier does not grant access to an advisor or coordinator.
      </p>
    </div> : visible.map((request) => {
      const offer = getCommerceOffer(request.offerId);
      if (!offer) return null;
      const existing = isAdvisor
        ? getVisibleAdvice(state, request, actorId, today)
        : getVisibleSupportNotes(state, request, actorId, today);
      return <article key={request.id} className={panel}>
        <h3 className="text-xl font-extrabold">{offer.title}</h3>
        <p className="mt-2 text-sm text-[#40516d]">{request.goal}</p>
        <p className="mt-2 text-sm">
          {isAdvisor
            ? "Actual qualifications, assessment evidence and clinical fit are not established."
            : "Only participant-directed administrative assistance is represented."}
        </p>
        {existing.length ? <ul className="mt-4 list-disc space-y-2 pl-5 text-sm">
          {existing.map((note) => <li key={note.id}>{note.text}</li>)}
        </ul> : null}
        {existing.length < 4 ? <form className="mt-4 space-y-3" onSubmit={(e) => addNote(e, request.id)}>
          <label className={label}>
            {isAdvisor ? "Example evidence or trial consideration" : "Example coordination note"}
            <textarea className={input} rows={3} required minLength={12} maxLength={240}
              placeholder={isAdvisor
                ? "What evidence, fit check or trial might be needed?"
                : "What information could help the participant compare options?"}
              value={notes[request.id] || ""}
              onChange={(e) => setNotes((current) => ({ ...current, [request.id]: e.target.value }))}/>
          </label>
          <button type="submit" className={primary}>
            Add local planning note — no approval
          </button>
        </form> : <p className="mt-3 text-sm">Example note limit reached.</p>}
      </article>;
    })}
  </section>;
}

function ActivityHistory({ state }: { state: ExchangeState }) {
  const events = [...state.events].reverse();
  return <section className={panel} aria-labelledby="activity-heading">
    <div className="flex flex-wrap items-center gap-2">
      <BookOpenCheck aria-hidden="true" className="h-5 w-5 text-[#073F97]"/>
      <h2 id="activity-heading" className="text-2xl font-extrabold">Example consent and activity history</h2>
    </div>
    <p className="mt-2 text-[#40516d]">
      In-memory event history for this fictitious scenario. Summaries deliberately
      omit the participant's questions and advisor notes. This is not a permanent
      audit log, a legal record or independent evidence of consent.
    </p>
    <ol className="mt-5 space-y-3" aria-label="Synthetic exchange events">
      {events.map((event: ExchangeAudit) => <li key={event.sequence}
        className="rounded-xl border border-[#d4dfef] px-4 py-3">
        <p className="text-sm font-bold text-[#073F97]">
          Step {event.sequence} · {event.kind}
        </p>
        <p className="mt-1 text-sm">{event.summary}</p>
        <p className="mt-1 text-xs text-[#586780]">
          {event.requestId} · example actor: {actorNames[event.actorId]}
        </p>
      </li>)}
    </ol>
  </section>;
}

export function ExchangeWorkspace() {
  const [today] = useState(() => new Date().toISOString().slice(0, 10));
  const [state, setState] = useState(() => makeSyntheticExchange(new Date().toISOString().slice(0, 10)));
  const [view, setView] = useState<View>("buyer");
  const [supplier, setSupplier] = useState<"supplierBlue" | "supplierGold">("supplierBlue");
  const [provider, setProvider] = useState<"providerCare" | "providerLearning">("providerLearning");
  const [notice, setNotice] = useState(
    "This is a fictional example. Switch roles to explore both sides of the same local enquiry.",
  );
  const actorId: ExchangeActorId = view === "supplier" ? supplier :
    view === "provider" ? provider :
      view === "advisor" ? "independentAdvisor" :
        view === "coordinator" ? "coordinator" : "participant";
  const visible = useMemo(() => getVisibleRequests(state, actorId, today), [
    state, actorId, today,
  ]);
  const outstanding = state.quotes.filter((quote) => quote.status === "proposed").length;

  function dispatch(intent: ExchangeIntent, success: string): boolean {
    try {
      const command: ExchangeCommand = {
        ...intent, commandId: "ui-command-" + (state.revision + 1),
        expectedRevision: state.revision,
      } as ExchangeCommand;
      setState(applyExchangeCommand(state, command, today));
      setNotice(success);
      return true;
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The synthetic action was not permitted.");
      return false;
    }
  }
  function reset() {
    setState(makeSyntheticExchange(today));
    setNotice("Synthetic workshop reset. This was not a real request or message.");
  }
  return <div className="space-y-6 text-[#101b37]">
    <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#073F97] via-[#3f3aa7] to-[#6537a3] px-6 py-8 text-white sm:px-10">
      <p className="text-sm font-bold uppercase tracking-widest text-[#fee1ca]">
        MapAble Marketplace · Dual-sided exchange
      </p>
      <h1 className="mt-3 max-w-3xl text-3xl font-black leading-tight sm:text-4xl">
        One marketplace. Different roles. Your decisions stay yours.
      </h1>
      <p className="mt-3 max-w-3xl text-[#f5f3ff]">
        Explore a request across buyers, equipment suppliers, service providers,
        independent AT advisors and support coordinators. Information is shared
        only when the fictional participant grants access.
      </p>
      <p role="note" className="mt-5 max-w-3xl rounded-xl border border-white/50 bg-white p-4 text-sm font-semibold text-[#17325a]">
        SYNTHETIC, LOCAL-ONLY SIMULATION. Changing roles is not authentication.
        No actual seller, prescriber, provider, participant, message, quote,
        NDIS claim, funding approval, clinical assessment or payment exists.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link href="/marketplace/design-lab" className={button + " bg-white"}>
          <ArrowLeft aria-hidden="true" className="h-4 w-4"/> Back to catalogue lab
        </Link>
        <button type="button" onClick={reset} className={button + " border-white bg-transparent text-white hover:bg-[#284d9f]"}>
          <RotateCcw aria-hidden="true" className="h-4 w-4"/> Reset synthetic workspace
        </button>
      </div>
    </header>

    <section aria-label="Prototype activity overview" className="grid gap-3 sm:grid-cols-3">
      <div className={panel}>
        <p className="text-xs font-bold uppercase tracking-wide text-[#5740a2]">Example enquiries</p>
        <p className="mt-2 text-3xl font-black text-[#073F97]">{state.requests.length}</p>
      </div>
      <div className={panel}>
        <p className="text-xs font-bold uppercase tracking-wide text-[#5740a2]">Unreviewed sample quotes</p>
        <p className="mt-2 text-3xl font-black text-[#073F97]">{outstanding}</p>
      </div>
      <div className={panel}>
        <p className="text-xs font-bold uppercase tracking-wide text-[#5740a2]">Real transactions</p>
        <p className="mt-2 text-3xl font-black text-[#8b4109]">0</p>
      </div>
    </section>

    <nav aria-label="Exchange participant and merchant views"
      className="flex flex-wrap gap-2 rounded-2xl border border-[#c7d6eb] bg-white p-3">
      {views.map((option) => <button type="button" key={option.id}
        className={view === option.id ? primary : button}
        aria-pressed={view === option.id}
        onClick={() => {
          setView(option.id);
          setNotice(option.label + " demonstration opened. This does not switch real accounts or permissions.");
        }}>
        {option.id === "buyer" ? <Users className="h-4 w-4" aria-hidden="true"/> :
          option.id === "supplier" || option.id === "provider" ?
            <Store className="h-4 w-4" aria-hidden="true"/> :
            option.id === "advisor" ? <Wrench className="h-4 w-4" aria-hidden="true"/> :
              option.id === "coordinator" ? <Handshake className="h-4 w-4" aria-hidden="true"/> :
                <ClipboardCheck className="h-4 w-4" aria-hidden="true"/>}
        {option.label}
      </button>)}
    </nav>

    <div className="rounded-xl border border-[#c5d7f1] bg-[#eff4ff] px-4 py-3 text-sm font-semibold text-[#073F97]"
      role="status" aria-live="polite" aria-atomic="true">{notice}</div>

    {view === "buyer" ? <section className="space-y-5" aria-labelledby="buyer-heading">
      <div className={panel}>
        <h2 id="buyer-heading" className="text-2xl font-extrabold">Your buyer workspace</h2>
        <p className="mt-2 text-[#40516d]">
          Prepare requests, decide who can see them, compare quotations and
          ask for independent advice. Your shortlist never commits to a purchase.
        </p>
        <div className={warning + " mt-4"}>
          <strong>Privacy and consent:</strong> this preview models separate,
          expiring sharing permissions. Only real MapAble Core identity and
          authorisation checks could protect real participant records.
        </div>
      </div>
      <CreateRequest onCreate={(offerId, goal) => dispatch({
        type: "create_request", actorId: "participant", offerId, goal,
      }, "Private example request created. Select each recipient if you want to share it.")}/>
      <div className="space-y-5">
        {visible.slice().reverse().map((request) => (
          <BuyerRequest key={request.id} request={request} state={state}
            today={today} dispatch={dispatch}/>
        ))}
      </div>
    </section> : null}

    {view === "supplier" || view === "provider" ? <div className="space-y-4">
      <div className={panel}>
        <label htmlFor="example-business" className={label}>
          Choose a fictional {view === "supplier" ? "equipment supplier" : "service provider"}
        </label>
        <select id="example-business" className={input + " max-w-xl"}
          value={view === "supplier" ? supplier : provider}
          onChange={(e) => view === "supplier"
            ? setSupplier(e.target.value as "supplierBlue" | "supplierGold")
            : setProvider(e.target.value as "providerCare" | "providerLearning")}>
          {(view === "supplier" ? ["supplierBlue", "supplierGold"] as const :
            ["providerCare", "providerLearning"] as const).map((id) =>
            <option key={id} value={id}>{actorNames[id]}</option>)}
        </select>
        <p className="mt-2 text-sm text-[#40516d]">
          Showing {getVisibleRequests(state, actorId, today).length} participant-shared example enquiry/enquiries.
        </p>
      </div>
      <SellerWorkspace key={actorId} state={state} today={today} actorId={actorId} dispatch={dispatch}/>
    </div> : null}

    {view === "advisor" ? <NotesWorkspace state={state} today={today}
      actorId="independentAdvisor" dispatch={dispatch}/> : null}
    {view === "coordinator" ? <NotesWorkspace state={state} today={today}
      actorId="coordinator" dispatch={dispatch}/> : null}
    {view === "activity" ? <ActivityHistory state={state}/> : null}

    <footer className={panel + " space-y-3"}>
      <div className="flex items-start gap-3">
        <ShieldAlert aria-hidden="true" className="h-6 w-6 shrink-0 text-[#98551c]"/>
        <div>
          <h2 className="font-extrabold">What this demonstration cannot do</h2>
          <p className="mt-1 text-sm text-[#40516d]">
            It cannot verify worker screening, professional registration, products,
            supplier business identity, stock, suitability, funding, account permissions,
            tenancy, tax, safety or delivery. There is no real data transfer or clinical
            advice; all state disappears when the page reloads.
          </p>
          <p className="mt-2 text-sm text-[#40516d]">
            Future production work requires server-side MapAble Core identity and
            purpose-bound consent, supplier and advisor verification, marketplace
            legal classification, accessible complaints, and independent PayCore checks.
          </p>
        </div>
      </div>
      <Link href="/marketplace" className="inline-flex items-center gap-2 font-bold text-[#073F97] underline underline-offset-4">
        Read the public Marketplace programme explainer <ArrowRight aria-hidden="true" className="h-4 w-4"/>
      </Link>
      <p className="flex items-center gap-2 text-xs text-[#435773]">
        <Info aria-hidden="true" className="h-4 w-4"/> Target WCAG 2.2 AA; assistive-technology and participant testing still required.
      </p>
    </footer>
  </div>;
}
