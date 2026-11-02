"use client";

import { useState } from "react";
import {
  compareSyntheticOffers, createLabSession, matchingSyntheticOffers,
  runLocalSequence, transitionLab, type LabAction, type LabPhase, type LabScenario,
  type LabSession, type SyntheticOffer,
} from "@/lib/marketplace/agentic-lab/engine";
import {
  CURATED_AGENT_TOOLS, reviewAgentTool, REMOTE_A2A_ENABLED,
  REMOTE_MCP_ENABLED, EXTERNAL_PURCHASE_ENABLED,
} from "@/lib/marketplace/agentic-lab/tool-gateway";
import { GuardianMarketplacePanel } from "@/components/marketplace/GuardianMarketplacePanel";

const button = "inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-[#164678] px-4 py-3 font-semibold text-[#164678] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#164678] disabled:opacity-60 disabled:cursor-not-allowed";
const primary = button + " bg-[#164678] text-white";
const field = "mt-2 min-h-12 w-full rounded-xl border-2 border-[#536b7f] bg-white px-4 py-3 text-[#10283b] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#164678]";
const scenarioOptions: { id: LabScenario; label: string; summary: string }[] = [
  { id: "care_support", label: "Disability care and support", summary: "Fictional personal/community support providers and worker handoff." },
  { id: "low_cost_at", label: "Low-cost assistive technology", summary: "Fictional product vendors and illustrative nonbinding prices." },
];
const steps: { phase: LabPhase; text: string }[] = [
  { phase: "draft", text: "Scenario not prepared" },
  { phase: "prepared", text: "Prepared locally" },
  { phase: "collecting", text: "Provider previews approved, collecting synthetic replies" },
  { phase: "compared", text: "Complete comparison ready" },
  { phase: "shortlisted", text: "Example shortlisted for human review only" },
  { phase: "withdrawn", text: "All local sharing permissions withdrawn" },
];
function money(cents: number): string {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(cents / 100);
}
function ExampleOffer({ offer, session, onShortlist }: {
  offer: SyntheticOffer;
  session: LabSession;
  onShortlist: (id: string) => void;
}) {
  return <li className="rounded-2xl border-2 border-[#b4c7d2] bg-white p-5">
    <h3 className="text-xl font-bold">{offer.provider}</h3>
    <p className="mt-2 text-lg">{offer.item}</p>
    <p className="mt-2"><strong>Example price:</strong> {money(offer.examplePriceCents)} per {offer.priceBasis} — not a real quote or NDIS rate</p>
    <p><strong>Communication:</strong> {offer.accessFormat}</p>
    <p><strong>Evidence:</strong> Fictional source only; registration, capacity and worker clearance NOT verified.</p>
    <p><strong>Limitations:</strong> {offer.scopeNote}</p>
    <p className="mt-1 text-sm">Sponsored placement: none. Response timing is ignored. No suitability score.</p>
    <button type="button" className={primary + " mt-4"}
      disabled={session.phase !== "compared"}
      onClick={() => onShortlist(offer.id)}
      aria-label={"Shortlist fictional offer from " + offer.provider}>
      {session.shortlistedOfferId === offer.id ? "Shortlisted for discussion" : "Shortlist for discussion"}
    </button>
  </li>;
}
export function AgenticMarketplaceLab() {
  const [session, setSession] = useState<LabSession>(() => createLabSession());
  const [announcement, setAnnouncement] = useState("Select an example and prepare the fictional request.");
  const [failed, setFailed] = useState(false);
  const [largerText, setLargerText] = useState(false);
  const [toolName, setToolName] = useState<string>("public_marketplace_catalogue.search");
  const [toolResult, setToolResult] = useState("");
  const scenario = scenarioOptions.find((item) => item.id === session.scenario)!;
  const matching = matchingSyntheticOffers(session);
  const compared = session.phase === "compared" || session.phase === "shortlisted"
    ? compareSyntheticOffers(session) : [];
  function run(action: Omit<LabAction, "id" | "expectedRevision">) {
    try {
      const next = transitionLab(session, {
        ...action,
        id: "local-step-" + (session.revision + 1),
        expectedRevision: session.revision,
      });
      setSession(next);
      setAnnouncement(next.events[next.events.length - 1]?.detail ?? "Action reviewed locally.");
      setFailed(false);
    } catch (error) {
      setAnnouncement(error instanceof Error ? error.message : "Demo action blocked.");
      setFailed(true);
    }
  }
  function collectReplies() {
    try {
      const next = runLocalSequence(session, matching.map((offer) => ({
        kind: "provider_proposal" as const, actor: "provider_agent" as const, offerId: offer.id,
      })));
      setSession(next);
      setAnnouncement("Received all " + matching.length + " fictional replies. Compare before choosing.");
      setFailed(false);
    } catch (error) {
      setAnnouncement(error instanceof Error ? error.message : "Proposals blocked.");
      setFailed(true);
    }
  }
  function changeScenario(next: LabScenario) {
    setSession(createLabSession(next));
    setAnnouncement("New fictional scenario loaded. Previous local demo state cleared.");
    setFailed(false);
    setToolResult("");
  }

  return <div className={largerText ? "space-y-7 text-lg [&_p]:!text-lg [&_button]:!text-lg" : "space-y-7"}>
    <header className="rounded-3xl bg-[#173e61] p-6 text-white sm:p-9">
      <p className="font-semibold">MapAble+ · Agentic Marketplace Research</p>
      <h1 className="mt-2 text-3xl font-black sm:text-4xl">Compare support and assistive technology on your terms</h1>
      <p className="mt-3 max-w-3xl text-lg">An agent-to-agent simulation involving participants, fictional providers and fictional support workers. You decide when information is previewed and which option to shortlist.</p>
      <p role="note" className="mt-4 rounded-xl border-2 border-white bg-white p-4 font-semibold text-[#183753]">
        SANDBOX ONLY — no real providers, worker screening, availability, quotes, bookings, contracts, NDIS claims, Saleor calls, payments, AI inference or network messages.
      </p>
    </header>

    <section className="rounded-2xl border border-[#a4b8c5] bg-white p-5" aria-labelledby="lab-status">
      <h2 id="lab-status" className="text-xl font-bold">Feature and permission status</h2>
      <p>Remote agent-to-agent: {REMOTE_A2A_ENABLED ? "On" : "Disabled"} · Remote MCP: {REMOTE_MCP_ENABLED ? "On" : "Disabled"} · External purchases: {EXTERNAL_PURCHASE_ENABLED ? "On" : "Disabled"}</p>
      <p className="mt-2 font-semibold">Current stage: {steps.find((item) => item.phase === session.phase)?.text}</p>
      <div aria-live="polite" role="status" className={"mt-3 rounded-xl p-3 " + (failed ? "bg-[#fff0ef] text-[#762b2b]" : "bg-[#eaf3f4] text-[#173b3e]")}>{announcement}</div>
    </section>

    <section aria-labelledby="lab-participant" className="rounded-2xl border border-[#a4b8c5] bg-white p-5">
      <h2 id="lab-participant" className="text-xl font-bold">1. Choose your demonstration</h2>
      <label className="mt-4 block font-semibold" htmlFor="agentic-lab-scenario">Example support need</label>
      <select className={field} id="agentic-lab-scenario" value={session.scenario}
        onChange={(event) => changeScenario(event.target.value as LabScenario)}>
        {scenarioOptions.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
      </select>
      <p className="mt-2">{scenario.summary}</p>
      <p className="text-sm">Only fixed synthetic examples are accepted. Do not enter personal, health, NDIS or payment information.</p>
      <label className="mt-4 flex min-h-12 items-center gap-3">
        <input type="checkbox" className="h-6 w-6" checked={largerText} onChange={(e) => setLargerText(e.target.checked)} />
        <span>Larger text</span>
      </label>
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" className={primary} disabled={session.phase !== "draft"}
          onClick={() => run({ kind: "prepare", actor: "participant" })}>Prepare local request</button>
        <button type="button" className={button} disabled={session.phase !== "prepared"}
          onClick={() => run({ kind: "approve_provider_preview", actor: "participant" })}>Allow fictional provider previews</button>
        <button type="button" className={button} disabled={session.phase === "withdrawn"}
          onClick={() => run({ kind: "withdraw", actor: "participant" })}>Withdraw local permission</button>
        <button type="button" className={button} onClick={() => changeScenario(session.scenario)}>Reset demo</button>
      </div>
    </section>

    <section aria-labelledby="lab-agents" className="rounded-2xl border border-[#a4b8c5] bg-white p-5">
      <h2 id="lab-agents" className="text-xl font-bold">2. Simulate provider-agent conversation</h2>
      <p className="mt-2">A participant agent gathers {matching.length} fictional replies. This demo intentionally waits for all of them before comparison to avoid rewarding the first proposal.</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" className={primary}
          disabled={session.phase !== "collecting" || session.receivedOfferIds.length > 0}
          onClick={collectReplies}>Simulate all provider replies</button>
        <button type="button" className={button}
          disabled={session.phase !== "collecting" || session.receivedOfferIds.length !== matching.length}
          onClick={() => run({ kind: "compare_all", actor: "participant_agent" })}>Review complete comparison</button>
      </div>
      <p className="mt-2">Replies collected: {session.receivedOfferIds.length} of {matching.length}. All values are illustrative.</p>
    </section>

    <section aria-labelledby="lab-compare" className="rounded-2xl border border-[#a4b8c5] bg-[#f5f8fb] p-5">
      <h2 id="lab-compare" className="text-xl font-bold">3. Compare options with missing evidence visible</h2>
      {compared.length ? (
        <ul className="mt-4 grid gap-4 lg:grid-cols-3">{compared.map((offer) =>
          <ExampleOffer key={offer.id} offer={offer} session={session}
            onShortlist={(id) => run({ kind: "shortlist", actor: "participant", offerId: id })} />)}
        </ul>
      ) : <p className="mt-3">No comparison yet. Prepare your example and collect all fictional provider replies.</p>}
      <p className="mt-3 text-sm">No ranked recommendations, first-response advantage or sponsored placement. Compare each option yourself. A real marketplace must validate all evidence independently.</p>
    </section>

    {session.scenario === "care_support" ? <section aria-labelledby="lab-worker" className="rounded-2xl border border-[#a4b8c5] bg-white p-5">
      <h2 id="lab-worker" className="text-xl font-bold">4. Separate worker-agent handoff</h2>
      <p className="mt-2">A support worker is not automatically entitled to your service request. Sharing is a separate choice and a worker-agent acknowledgement does not verify clearance or competence.</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" className={button}
          disabled={session.phase !== "shortlisted" || session.workerPreviewApproved}
          onClick={() => run({ kind: "approve_worker_preview", actor: "participant" })}>Allow fictional worker preview</button>
        <button type="button" className={button}
          disabled={!session.workerPreviewApproved || session.events.some((event) => event.action === "worker_acknowledge")}
          onClick={() => run({ kind: "worker_acknowledge", actor: "worker_agent" })}>Simulate worker acknowledgement</button>
      </div>
    </section> : null}

    <section aria-labelledby="lab-tools" className="rounded-2xl border border-[#a4b8c5] bg-white p-5">
      <h2 id="lab-tools" className="text-xl font-bold">5. Inspect the agent tool boundary</h2>
      <p className="mt-2">These are simulated typed MCP-style capabilities, not real remote tools. Sending enquiries, making payments and individual worker-screening lookups are blocked.</p>
      <label htmlFor="agentic-tool" className="mt-3 block font-semibold">Tool to evaluate</label>
      <select id="agentic-tool" className={field} value={toolName} onChange={(e) => {setToolName(e.target.value);setToolResult("");}}>
        {CURATED_AGENT_TOOLS.map((tool) => <option key={tool.name} value={tool.name}>{tool.name}</option>)}
      </select>
      <button type="button" className={button + " mt-4"} onClick={() => {
        const result = reviewAgentTool({ tool: toolName, requestedData: "synthetic", participantChoseAction: true });
        setToolResult(result.decision + ": " + result.reason);
      }}>Check synthetic tool permission</button>
      <p aria-live="polite" role="status" className="mt-3">{toolResult}</p>
    </section>

    <GuardianMarketplacePanel scenario={session.scenario} />

    <section aria-labelledby="lab-log" className="rounded-2xl border border-[#a4b8c5] bg-white p-5">
      <h2 id="lab-log" className="text-xl font-bold">Local, inspectable action history</h2>
      {session.events.length ? <ol className="mt-3 list-decimal space-y-2 pl-6">
        {session.events.map((item) => <li key={item.sequence}><strong>{item.actor}</strong>: {item.detail}</li>)}
      </ol> : <p className="mt-2">No actions recorded.</p>}
      <p className="mt-3 text-sm">This history exists in browser memory only; role names are simulated and do not authenticate anyone.</p>
    </section>

    <footer className="space-y-2 pb-8 text-sm">
      <p>Research basis: Magentic Marketplace (arXiv:2510.25779v1). These demonstrations are design hypotheses, not validated outcomes in disability support.</p>
      <p>Saleor commerce integration is conceptual and read-only; care and worker verification would remain under separate MapAble Core controls.</p>
      <p>For real support, use established provider discovery and human contact pathways. This sandbox cannot arrange or dispatch services.</p>
    </footer>
  </div>;
}
