"use client";

import { useState } from "react";

import {
  reviewMarketplaceGovernance, RESEARCH_GOVERNANCE_LEDGER,
  type GovernanceAction, type PublicGovernanceDecision,
} from "@/lib/marketplace/agentic-lab/governance";

const choices: readonly { id: GovernanceAction; label: string }[] = [
  { id: "read_public_guide", label: "Read public support information" },
  { id: "compare_synthetic_offers", label: "Compare fictional provider offers" },
  { id: "prepare_synthetic_enquiry", label: "Prepare a fictional service enquiry" },
  { id: "share_personal_information", label: "Attempt a real personal-data disclosure" },
  { id: "query_worker_clearance", label: "Attempt an individual worker screening check" },
  { id: "claim_ndis_fundable", label: "Claim that an item is funded by the NDIS" },
  { id: "confirm_support_booking", label: "Confirm a care support booking" },
  { id: "create_product_order", label: "Create a real assistive-product order" },
  { id: "agent_self_authorise_consent", label: "Agent assumes participant consent" },
  { id: "infer_personal_capacity_from_disability", label: "Infer decision-making capacity from disability" },
  { id: "publish_automatic_worker_safety_score", label: "Publish a universal worker safety score" },
];

const selectClass = "mt-2 min-h-12 w-full rounded-xl border-2 border-slate-500 bg-white px-3 py-3 text-slate-950 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-blue-700";
const focusButton = "mt-4 inline-flex min-h-12 items-center rounded-xl border-2 border-[#164678] bg-[#164678] px-4 py-3 font-bold text-white focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-blue-700";
export function GuardianMarketplacePanel({ scenario }: { scenario: "care_support" | "low_cost_at" }) {
  const [action, setAction] = useState<GovernanceAction>("compare_synthetic_offers");
  const [review, setReview] = useState<PublicGovernanceDecision | null>(null);
  function evaluate() {
    setReview(reviewMarketplaceGovernance({
      action,
      actor: "participant",
      participantChoseAction: true,
      decisionSpecificCommunicationAccess: "supported",
      disclosureConsent: "explicit_local_demo",
      workerScreeningStatus: "NOT_INDEPENDENTLY_VERIFIED",
      workerStatusAuthorisedPortalEvidence: false,
      providerRegistration: "NOT_INDEPENDENTLY_VERIFIED",
      itemKind: scenario,
    }));
  }
  return <section className="rounded-2xl border-2 border-[#b6c9d5] bg-white p-5" aria-labelledby="marketplace-guardian-heading">
    <h2 id="marketplace-guardian-heading" className="text-xl font-bold">6. Review NDIS, worker-screening and autonomy safeguards</h2>
    <p className="mt-2">This demonstration combines separate policy questions from NDIS Advisor, worker-screening guidance, an ethical Guardian and a participant-rights lens. These are inspectable <strong>local rules</strong>, not live third-party plugins, a clinical assessment, a regulatory clearance or a legal decision.</p>
    <label className="mt-4 block font-semibold" htmlFor="governance-action">Example agent action to review</label>
    <select id="governance-action" className={selectClass} value={action}
      onChange={(event) => {setAction(event.target.value as GovernanceAction);setReview(null);}}>
      {choices.map((option) => <option value={option.id} key={option.id}>{option.label}</option>)}
    </select>
    <button type="button" className={focusButton} onClick={evaluate}>Review this fictional action</button>
    {review ? <div className="mt-4 space-y-3 rounded-xl border border-slate-300 bg-[#f2f7f9] p-4">
      <p role="status" aria-live="polite" className="font-semibold">Review outcome: {review.decision.replaceAll("_", " ")}. No real action can execute.</p>
      <h3 className="text-lg font-bold">Decision: {review.decision.replaceAll("_", " ")}</h3>
      <p>{review.rationale}</p>
      <p><strong>NDIS funding:</strong> Not determined. Individual plan and current support-list review needed.</p>
      <p><strong>Individual worker screening:</strong> {review.workerScreening.status}. This is not a safety or competency rating.</p>
      <p><strong>Provider registration:</strong> {review.providerRegistration.status}. Keep distinct from worker clearance.</p>
      <p><strong>Rights risk:</strong> {review.rightsStatus}. No real action can execute: {review.executionAllowed ? "yes" : "no"}.</p>
      {review.invariantRefs.length ? <p><strong>Protected principles:</strong> {review.invariantRefs.join(", ")}</p> : null}
      <h4 className="font-bold">Required safeguards</h4>
      <ul className="list-disc space-y-1 pl-5">{review.safeguards.map((s) => <li key={s}>{s}</li>)}</ul>
      <h4 className="font-bold">Evidence still missing</h4>
      <ul className="list-disc space-y-1 pl-5">{review.evidenceGaps.map((g) => <li key={g}>{g}</li>)}</ul>
    </div> : null}
    <details className="mt-5 rounded-xl border border-slate-300 p-4">
      <summary className="cursor-pointer font-semibold">Research basis and evidence limitations</summary>
      <ul className="mt-3 list-disc space-y-2 pl-5">{RESEARCH_GOVERNANCE_LEDGER.map((item) =>
        <li key={item.reference}>
          <strong>{item.title}</strong> — {item.source}, {item.reference}. Access: {item.evidenceAccess}. {item.application}
        </li>)}
      </ul>
      <p className="mt-3">These publications inform design safeguards, not legal authority, worker approval, NDIS funding determinations or clinically validated marketplace effectiveness.</p>
    </details>
  </section>;
}
