"use client";

import { useState } from "react";

import {
  getWorkerJurisdictionPathway,
  SCREENING_JURISDICTIONS,
  type ScreeningJurisdiction,
} from "@/lib/workers/ndiswc-jurisdictions";

import {
  CURRENT_NDIS_SCREENING_STATUS,
  NDISWC_AUDIENCES,
  NSW_NDISWC_OFFICIAL_LINKS,
  NSW_NDISWC_LIVE_LOOKUP_ENABLED,
  OFFICIAL_SCREENING_TERMS,
  explainOfficialScreeningTerm,
  getNdiswcPathway,
  type PathwayAudience,
  type StatusContext,
} from "@/lib/workers/ndiswc-lookup-guide";

const field =
  "mt-2 block min-h-12 w-full rounded-xl border-2 border-slate-500 bg-white px-4 py-3 text-slate-950 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#164678]";
const link =
  "inline-flex min-h-12 items-center rounded-xl border-2 border-[#164678] bg-[#164678] px-4 py-3 font-semibold text-white underline-offset-4 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#164678]";

/**
 * Role-directed OFFICIAL verification navigator, not a live worker database.
 * No worker identifiers, DOB, application number, credentials, certificates,
 * uploads, server endpoints or browser storage. Only user-initiated links.
 */
export function NdiswcLookupGuide() {
  const [role, setRole] = useState<PathwayAudience>("self_or_plan_managed_participant");
  const [jurisdiction, setJurisdiction] = useState<ScreeningJurisdiction>("NSW");
  const [context, setContext] = useState<StatusContext>("national_screening");
  const [term, setTerm] = useState("");
  const [largeText, setLargeText] = useState(false);
  const pathway = getNdiswcPathway(role);
  const local = getWorkerJurisdictionPathway(jurisdiction);
  const workerView = role === "nsw_worker" || role === "other_state_worker";
  const pathwayTitle = workerView ? local.title : pathway.title;
  const pathwayDescription = workerView ? local.summary : pathway.description;
  const pathwaySteps = workerView ? local.applicationSteps : pathway.steps;
  const pathwayUrl = workerView ? local.workerPrimaryUrl : pathway.officialPortalUrl;
  const pathwayLabel = workerView && jurisdiction !== "NSW"
    ? local.workerPrimaryLabel : pathway.officialPortalLabel;
  const explanation = term ? explainOfficialScreeningTerm(context, term) : null;

  function changeContext(next: StatusContext) {
    setContext(next);
    setTerm("");
  }

  return <div className={largeText ? "space-y-7 text-lg [&_p]:!text-lg" : "space-y-7"}>
    <header className="rounded-3xl bg-[#173e61] px-5 py-8 text-white sm:px-9">
      <p className="font-semibold">MapAble · Worker Screening Guidance</p>
      <h1 className="mt-2 text-3xl font-black sm:text-4xl">NDIS worker screening — find the right official lookup</h1>
      <p className="mt-4 max-w-3xl text-lg">
        Choose how you are involved. We will show the official pathway for
        checking a worker's NDIS Worker Check without collecting private
        worker information or replacing government verification.
      </p>
      <p role="note" className="mt-4 rounded-xl border-2 border-white bg-white p-4 font-bold text-[#173e61]">
        CURRENT SCREENING STATUS: NOT INDEPENDENTLY VERIFIED.
        This is guidance only, not a public worker search or an active
        connection to the NDIS Worker Screening Database.
      </p>
    </header>

    <section aria-labelledby="lookup-role-heading" className="space-y-4 rounded-2xl border border-[#b4c7d2] bg-white p-5">
      <h2 id="lookup-role-heading" className="text-xl font-bold">1. Choose your verification role</h2>
      <label htmlFor="ndiswc-audience" className="block font-semibold">I am a...</label>
      <select id="ndiswc-audience" value={role} className={field}
        onChange={(event) => setRole(event.target.value as PathwayAudience)}>
        {NDISWC_AUDIENCES.filter((option) => option.id !== "other_state_worker").map((option) =>
          <option key={option.id} value={option.id}>{option.label}</option>)}
      </select>
      <label htmlFor="ndiswc-jurisdiction" className="block font-semibold">State or territory for the worker screening unit</label>
      <select id="ndiswc-jurisdiction" value={jurisdiction} className={field}
        onChange={(event) => setJurisdiction(event.target.value as ScreeningJurisdiction)}>
        {SCREENING_JURISDICTIONS.map((code) => <option key={code} value={code}>{code}</option>)}
      </select>
      <label className="flex min-h-12 items-center gap-3">
        <input type="checkbox" className="h-6 w-6" checked={largeText}
          onChange={(event) => setLargeText(event.target.checked)}/>
        <span className="font-semibold">Use larger text</span>
      </label>
      <div aria-live="polite" role="status" className="rounded-xl bg-[#eaf3f4] p-4 text-[#173b3e]">
        Selected pathway: {pathwayTitle}. The official website handles sign-in and verification.
      </div>
    </section>

    <section aria-labelledby="lookup-steps-heading" className="space-y-4 rounded-2xl border border-[#b4c7d2] bg-white p-5">
      <h2 id="lookup-steps-heading" className="text-xl font-bold">2. Use the correct government system</h2>
      <h3 className="text-lg font-bold">{pathwayTitle}</h3>
      <p>{pathwayDescription}</p>
      <ol className="list-decimal space-y-3 pl-6">
        {pathwaySteps.map((step) => <li key={step}>{step}</li>)}
      </ol>
      <a className={link} href={pathwayUrl} target="_blank" rel="noopener noreferrer">
        {pathwayLabel} (opens official website)
      </a>
      <p>
        <a className="font-semibold underline underline-offset-4"
          href={pathway.guidanceUrl} target="_blank" rel="noopener noreferrer">
          Read the official instructions
        </a>
      </p>
      <div className="mt-4 space-y-3 rounded-xl border border-slate-300 bg-[#f2f7f9] p-4">
        <h3 className="text-lg font-bold">{jurisdiction} screening-unit requirements</h3>
        <p>{local.summary}</p>
        <p><strong>Additional child/vulnerable-person requirements:</strong> {local.localCheckNote}</p>
        <p><strong>Work while pending:</strong> {local.workWhilePending === "NO_CLEARANCE_NO_START_WITH_NARROW_EXCEPTIONS"
          ? "Generally no clearance, no start in relevant risk-assessed roles. Verify any narrow current statutory exception."
          : "Work permission cannot be determined from an application status alone. Verify current role-specific rules."}</p>
        <a className="font-semibold underline underline-offset-4 focus-visible:outline focus-visible:outline-4"
          href={local.screeningUnitUrl} target="_blank" rel="noopener noreferrer">
          Open official {jurisdiction} screening-unit guidance
        </a>
        <p className="text-sm">Accessible alternative: {local.helpWithoutPhone.join(" ")}</p>
      </div>
      <p className="text-sm">
        Access requires the appropriate government account or an authorised
        organisation/participant role. MapAble cannot sign in for you or
        verify another person from their name alone.
      </p>
    </section>

    <section aria-labelledby="lookup-terms-heading" className="space-y-4 rounded-2xl border border-[#b4c7d2] bg-white p-5">
      <h2 id="lookup-terms-heading" className="text-xl font-bold">3. Understand a status term</h2>
      <p>Choose a term you have seen in official guidance. This explains its meaning;
        it does <strong>not</strong> confirm that a particular worker has this status.</p>
      <fieldset className="space-y-3">
        <legend className="font-semibold">Which official system uses the term?</legend>
        <label className="flex min-h-12 items-center gap-3">
          <input type="radio" name="ndiswc-context" className="h-6 w-6"
            checked={context === "national_screening"}
            onChange={() => changeContext("national_screening")} />
          <span>National NDIS Worker Screening Database</span>
        </label>
        <label className="flex min-h-12 items-center gap-3">
          <input type="radio" name="ndiswc-context" className="h-6 w-6"
            checked={context === "nsw_application"}
            onChange={() => changeContext("nsw_application")} />
          <span>NSW application in MyServiceNSW</span>
        </label>
      </fieldset>
      <label htmlFor="ndiswc-term" className="block font-semibold">Term to explain</label>
      <select id="ndiswc-term" value={term} className={field}
        onChange={(event) => setTerm(event.target.value)}>
        <option value="">Choose a term (optional)</option>
        {OFFICIAL_SCREENING_TERMS[context].map((item) =>
          <option key={item.label} value={item.label}>{item.label}</option>)}
      </select>
      {explanation ? <div className="rounded-xl border border-slate-300 bg-[#f2f7f9] p-4">
        <p className="font-bold">What this term means</p>
        <p className="mt-2">{explanation.explanation}</p>
        <p className="mt-2 font-semibold">
          This is a definition, not an individual check. No worker's clearance has been verified.
        </p>
      </div> : null}
    </section>

    <section aria-labelledby="lookup-evidence-heading" className="space-y-4 rounded-2xl border border-[#b4c7d2] bg-white p-5">
      <h2 id="lookup-evidence-heading" className="text-xl font-bold">4. Know what counts as evidence</h2>
      <p>
        For employers and eligible participants, an authorised national portal
        check should confirm the worker's current status, relevant expiry and
        other displayed eligibility information. No downloaded certificate,
        worker profile badge, provider ABN or public enforcement search
        replaces an authoritative check.
      </p>
      <p>
        NSW NDISWC is a <strong>digital credential</strong> viewed through
        MyServiceNSW (on the website, not the app); the NSW Office of the
        Children's Guardian does not issue NDISWC cards or certificates.
      </p>
      <p>
        A clearance does not establish training, competence, compatibility,
        availability or personal safety. Participant choice and supported
        communication, including AAC and extra response time, remain essential.
      </p>
      <p className="font-semibold">
        No personal identification, worker number, date of birth, passwords,
        myID information, screening files or provider logins should be
        entered into this guide.
      </p>
      <p>
        <a href={NSW_NDISWC_OFFICIAL_LINKS.ocg}
          className="font-semibold underline underline-offset-4"
          target="_blank" rel="noopener noreferrer">
          NSW Office of the Children's Guardian — NDIS Worker Check
        </a>
        {" · "}
        <a href={NSW_NDISWC_OFFICIAL_LINKS.whichPortal}
          className="font-semibold underline underline-offset-4"
          target="_blank" rel="noopener noreferrer">
          NDIS Commission — which portal do I use?
        </a>
      </p>
    </section>

    <footer className="pb-6 text-sm">
      <p>Scope: NSW, Victoria, ACT, Queensland, Western Australia, South Australia, Tasmania and the Northern Territory.</p>
      <p>MapAble network verification: {NSW_NDISWC_LIVE_LOOKUP_ENABLED ? "Enabled" : "Disabled"}.
        Individual status: {CURRENT_NDIS_SCREENING_STATUS}.</p>
      <p>Official pathways checked 2 November 2026.
        This information helps you navigate official services; it does not
        constitute government endorsement, worker certification or a legal determination.</p>
    </footer>
  </div>;
}
