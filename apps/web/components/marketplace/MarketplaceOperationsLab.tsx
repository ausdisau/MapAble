"use client";

import { useState, type ReactNode } from "react";

import { findMarketListing, formatExampleMoney } from "@/packages/marketplace-inclusive/src/index";
import {
  EVIDENCE_CHECKS,
  SIMULATION_LISTING_IDS,
  createDemoCycle,
  demoActor,
  transitionDemoCycle,
  type DemoAction,
  type DemoCycle,
  type DemoRole,
  type DelegateRole,
  type EvidenceKey,
} from "@/packages/marketplace-inclusive/src/operations-cycle";

const button =
  "inline-flex min-h-11 items-center justify-center rounded-xl border border-[#073F97] " +
  "px-4 py-2 text-sm font-semibold text-[#073F97] hover:bg-[#eef4ff] " +
  "focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#073F97]";
const primary = button + " bg-[#073F97] text-white hover:bg-[#042a66]";
const selectStyle =
  "mt-2 min-h-11 w-full rounded-lg border border-slate-400 bg-white px-3 text-[#112240] " +
  "focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#073F97]";

const roles: { id: DemoRole; label: string }[] = [
  { id: "participant", label: "Participant" },
  { id: "supporter", label: "Chosen supporter" },
  { id: "coordinator", label: "Support coordinator" },
  { id: "seller", label: "Supplier" },
  { id: "reviewer", label: "Human reviewer" },
  { id: "finance", label: "Finance reviewer" },
];

const actions: { action: DemoAction; label: string; purpose: string }[] = [
  { action: { type: "cancel_order" }, label: "Cancel before dispatch", purpose: "Participant can cancel a reserved example order" },
  { action: { type: "dispatch" }, label: "Record mock dispatch", purpose: "Supplier records a fictional dispatch" },
  { action: { type: "record_delay" }, label: "Record mock delay", purpose: "Supplier records a delivery disruption" },
  { action: { type: "acknowledge_delivery" }, label: "Confirm example delivery", purpose: "Participant acknowledges an example arrival" },
  { action: { type: "request_return" }, label: "Request a return", purpose: "Participant initiates return review" },
  { action: { type: "approve_return" }, label: "Review return", purpose: "Human reviewer examines a simulated request" },
  { action: { type: "receive_return" }, label: "Record mock return received", purpose: "Supplier records a fictional return" },
  { action: { type: "approve_refund" }, label: "Authorise notional refund", purpose: "Finance reviewer reverses a fictional amount" },
  { action: { type: "reconcile" }, label: "Reconcile zero-cash ledger", purpose: "Finance reviewer checks the simulated ledger" },
];

const roleNote: Record<DemoRole, string> = {
  participant:
    "You control whether someone prepares a quote and whether any example order is confirmed, cancelled or returned.",
  supporter:
    "Preparing a quote requires a valid, participant-granted scope. Support does not equal purchase authority.",
  coordinator:
    "A coordinator can prepare a sample quote only with explicit participant permission. They cannot approve a purchase.",
  seller:
    "The mock supplier can submit evidence, dispatch or receive returns but cannot approve their own verification.",
  reviewer:
    "The independent mock reviewer records sample evidence and approves a return. They cannot purchase or refund.",
  finance:
    "The mock finance reviewer can reverse and reconcile notional entries. No payment is ever captured.",
};

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="rounded-2xl border border-[#c9d5e9] bg-white p-5 sm:p-6">
      <h2 id={id} className="text-xl font-bold text-[#101c37] sm:text-2xl">{title}</h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

export function MarketplaceOperationsLab() {
  const [cycle, setCycle] = useState<DemoCycle>(() => createDemoCycle());
  const [activeRole, setActiveRole] = useState<DemoRole>("participant");
  const [chosenDelegate, setChosenDelegate] = useState<DelegateRole>("supporter");
  const [listingId, setListingId] = useState<string>(SIMULATION_LISTING_IDS[0]);
  const [quantity, setQuantity] = useState(1);
  const [announcement, setAnnouncement] = useState("Choose a simulated role and step to begin.");
  const [failed, setFailed] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const sampleListing = findMarketListing(listingId);

  function execute(action: DemoAction) {
    try {
      const next = transitionDemoCycle(cycle, demoActor(activeRole), action, new Date().toISOString());
      setCycle(next);
      setAnnouncement(next.audit[next.audit.length - 1]?.detail ?? "Simulation progressed.");
      setFailed(false);
    } catch (error) {
      setAnnouncement(error instanceof Error ? error.message : "Action blocked by a safety gate.");
      setFailed(true);
    }
  }

  function restart() {
    setCycle(createDemoCycle());
    setActiveRole("participant");
    setAnnouncement("Synthetic scenario reset. No user or seller record was stored.");
    setFailed(false);
  }

  return (
    <div className={largeText ? "space-y-6 text-lg [&_p]:!text-lg [&_label]:!text-lg [&_button]:!text-lg" : "space-y-6"}>
      <header className="rounded-3xl bg-[#073F97] p-6 text-white sm:p-10">
        <p className="font-semibold">MapAble · Find access. Drive change.</p>
        <h1 className="mt-3 text-3xl font-black sm:text-4xl">Marketplace assurance workflow</h1>
        <p className="mt-3 max-w-3xl">
          Explore what must happen between supplier onboarding, a participant-owned decision,
          delivery, returns and reconciliation before real commerce is possible.
        </p>
        <p role="note" className="mt-5 rounded-xl bg-white p-4 font-bold text-[#101c37]">
          Simulation only: fictional sellers, checklist evidence, prices, stock, shipments,
          orders, refunds and ledger. No legal identity checks, real purchase, payment,
          bank reconciliation or NDIS approval.
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-2">
        <Section id="actor-heading" title="1. Choose an actor for this simulation">
          <label htmlFor="cycle-actor" className="block font-semibold text-[#101c37]">
            Acting role (simulation only)
          </label>
          <select id="cycle-actor" className={selectStyle} value={activeRole}
            onChange={(event) => setActiveRole(event.target.value as DemoRole)}>
            {roles.map((role) => <option key={role.id} value={role.id}>{role.label}</option>)}
          </select>
          <p className="text-slate-700">{roleNote[activeRole]}</p>
          <p className="text-sm text-slate-700">
            This role selector is not an authentication system. A real platform must use
            approved identity, organisation membership and scoped delegation.
          </p>
          <label className="flex min-h-11 cursor-pointer items-center gap-3">
            <input className="h-5 w-5 accent-[#073F97]" type="checkbox" checked={largeText}
              onChange={(event) => setLargeText(event.target.checked)} />
            <span>Larger text</span>
          </label>
        </Section>

        <Section id="vendor-heading" title="2. Review fictional supplier evidence">
          <p className="font-semibold">Supplier state: {cycle.vendor.status.replaceAll("_", " ")}</p>
          <button type="button" className={button} onClick={() => execute({ type: "submit_vendor" })}>
            Submit fictional supplier
          </button>
          <ul className="space-y-2">
            {(Object.keys(EVIDENCE_CHECKS) as EvidenceKey[]).map((key) => (
              <li className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#f5f7fc] p-3" key={key}>
                <span>
                  <strong className="block">{EVIDENCE_CHECKS[key]}</strong>
                  <span className="text-sm text-slate-700">
                    {cycle.vendor.evidence[key] === "sample_reviewed" ? "Checked in simulation" : "Not yet checked"}
                  </span>
                </span>
                <button className={button} type="button" onClick={() => execute({ type: "check_evidence", key })}>
                  Simulate review: {key.replaceAll("_", " ")}
                </button>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={primary} onClick={() => execute({ type: "approve_vendor" })}>
              Approve simulated supplier
            </button>
            <button type="button" className={button} onClick={() => execute({ type: "reject_vendor" })}>
              Reject simulated supplier
            </button>
          </div>
          <p className="text-sm text-slate-700">
            No real ABN, credentials, ownership, product condition, recalls or insurance have been verified.
          </p>
        </Section>

        <Section id="delegate-heading" title="3. Participant-controlled preparation">
          <p>Grant is {cycle.grant
            ? cycle.grant.revoked ? "revoked" : "active until " + cycle.grant.expiresAt
            : "not present"}.</p>
          <p className="text-sm text-slate-700">Only the participant can grant or revoke the sample permission.</p>
          <label className="block font-semibold text-[#101c37]" htmlFor="cycle-delegate">
            Chosen preparer
          </label>
          <select id="cycle-delegate" className={selectStyle}
            value={chosenDelegate}
            onChange={(event) => setChosenDelegate(event.target.value as DelegateRole)}>
            <option value="supporter">Chosen supporter</option>
            <option value="coordinator">Support coordinator</option>
          </select>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={primary} onClick={() => execute({
              type: "grant_prepare",
              delegateRole: chosenDelegate,
              delegateActorId: demoActor(chosenDelegate).id,
            })}>
              Grant preparation only
            </button>
            <button type="button" className={button} onClick={() => execute({ type: "revoke_grant" })}>
              Withdraw permission
            </button>
          </div>
          <p className="text-sm text-slate-700">
            Permission lasts 30 minutes and never includes confirming a purchase.
            A role switch alone grants nothing.
          </p>
        </Section>

        <Section id="quote-heading" title="4. Prepare and confirm a nonbinding quotation">
          <label htmlFor="cycle-product" className="block font-semibold text-[#101c37]">
            Synthetic low-risk product
          </label>
          <select id="cycle-product" className={selectStyle}
            value={listingId} onChange={(event) => setListingId(event.target.value)}>
            {SIMULATION_LISTING_IDS.map((id) => {
              const item = findMarketListing(id);
              return item ? <option key={id} value={id}>{item.title}</option> : null;
            })}
          </select>
          <label htmlFor="cycle-quantity" className="block font-semibold text-[#101c37]">
            Example quantity (1 to 5)
          </label>
          <input id="cycle-quantity" className={selectStyle} type="number" min={1} max={5}
            value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} />
          <p>Illustrative unit price: {sampleListing?.examplePriceCents !== null && sampleListing?.examplePriceCents !== undefined
            ? formatExampleMoney(sampleListing.examplePriceCents) : "Unknown"}</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={button}
              onClick={() => execute({ type: "prepare_quote", listingId, quantity })}>
              Prepare synthetic quote
            </button>
            <button type="button" className={primary}
              onClick={() => execute({ type: "confirm_quote" })}>
              Participant confirms fictional order
            </button>
          </div>
          {cycle.quote ? (
            <div className="rounded-xl border border-slate-300 bg-[#f5f7fc] p-4">
              <strong className="block">Quote {cycle.quote.id} · {cycle.quote.status.replaceAll("_", " ")}</strong>
              <p className="mt-2">Item subtotal: {formatExampleMoney(cycle.quote.itemSubtotalCents)}</p>
              <p>Assumed shipping: {formatExampleMoney(cycle.quote.shippingAssumptionCents)}</p>
              <p>Assumed tax: {formatExampleMoney(cycle.quote.taxAssumptionCents)} (fictional, not tax advice)</p>
              <p className="mt-2 font-bold">Notional amount: {formatExampleMoney(cycle.quote.notionalTotalCents)}</p>
              <p className="text-sm text-slate-700">Expires: {cycle.quote.expiresAt}</p>
              <p className="mt-1 text-sm text-slate-700">Not a binding quotation, invoice or payable amount.</p>
            </div>
          ) : <p>No sample quote prepared.</p>}
        </Section>

        <Section id="delivery-heading" title="5. Deliver, resolve issues and review refunds">
          <p>Mock order state: <strong>{cycle.order?.status.replaceAll("_", " ") ?? "No simulated order"}</strong></p>
          <p>External payment captured: <strong>{formatExampleMoney(cycle.order?.paymentCapturedCents ?? 0)}</strong></p>
          <div className="grid gap-2 sm:grid-cols-2">
            {actions.map((item) => (
              <button key={item.action.type} type="button" className={button}
                title={item.purpose}
                onClick={() => execute(item.action)}>
                {item.label}
              </button>
            ))}
          </div>
          <p className="text-sm text-slate-700">
            Incorrect order or actor steps are rejected. In a real service, delays,
            disputes, refunds and complaints require accessible human support.
          </p>
        </Section>

        <Section id="ledger-heading" title="6. Validate a zero-cash reconciliation">
          <p>
            This ledger balances imaginary obligations only. It is not linked to Stripe,
            a bank account, a merchant agreement or a refund processor.
          </p>
          <p className="font-semibold">Ledger entries: {cycle.ledger.length}</p>
          {cycle.ledger.length ? (
            <ul className="space-y-2">
              {cycle.ledger.map((entry, index) => (
                <li key={index} className="rounded-lg border border-slate-200 p-3 text-sm">
                  <strong>{entry.action.replaceAll("_", " ")}</strong>
                  <span className="block">{formatExampleMoney(entry.amountCents)}</span>
                  <span className="block text-slate-700">Debit: {entry.debitAccount}</span>
                  <span className="block text-slate-700">Credit: {entry.creditAccount}</span>
                </li>
              ))}
            </ul>
          ) : <p>No notional entries yet.</p>}
          <p>Reconciliation: <strong>{cycle.reconciliation?.status ?? "not performed"}</strong></p>
          <p>Simulated external cash settled: {formatExampleMoney(cycle.reconciliation?.actualExternalSettlementCents ?? 0)}</p>
          <button type="button" className={button} onClick={restart}>
            Reset fictional case
          </button>
        </Section>
      </div>

      <Section id="audit-heading" title="7. Inspect the decision record">
        <p className="text-sm text-slate-700">
          Every accepted step creates an event in browser memory. Resetting the scenario
          clears this simulation; no legally required audit trail is created.
        </p>
        {cycle.audit.length ? (
          <ol className="list-decimal space-y-2 pl-6">
            {[...cycle.audit].reverse().map((record) => (
              <li key={record.sequence} className="rounded-lg bg-[#f5f7fc] p-3">
                <strong>{record.action.replaceAll("_", " ")}</strong>
                <span className="ml-2 text-sm text-slate-700">
                  {record.actor} · {record.at}
                </span>
                <p className="mt-1">{record.detail}</p>
              </li>
            ))}
          </ol>
        ) : <p>No simulated decisions recorded.</p>}
      </Section>

      <div className="rounded-xl border border-[#073F97] bg-[#eef4ff] p-4">
        <p className={failed ? "font-bold text-[#8d2222]" : "font-semibold text-[#073F97]"}
          role="status" aria-live="polite" aria-atomic="true">
          {failed ? "Blocked: " : "Status: "}{announcement}
        </p>
      </div>
      <p className="pb-4 text-sm text-slate-700">
        Rights and safety: synthetic only. No clinical fit, safe equipment,
        NDIS claim, delegate authority, supplier accreditation or financial reconciliation
        is proved by this demonstration.
      </p>
    </div>
  );
}
