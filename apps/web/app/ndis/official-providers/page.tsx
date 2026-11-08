import Link from "next/link";

import { searchApprovedOfficialProviderDirectory } from "@/lib/ndis/platform-adapter/official-provider-directory";

export const metadata = {
  title: "Official-source NDIS provider directory | MapAble",
  description: "Browse source-stamped public NDIS provider records. No worker screening or availability is verified.",
};
export const dynamic = "force-dynamic";

type Search = { q?: string; state?: string; postcode?: string; page?: string };

const STATES = ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "ACT", "NT"] as const;
function safeString(value?: string): string {
  return typeof value === "string" ? value.trim() : "";
}

export default async function OfficialNdisProvidersPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const params = await searchParams;
  const q = safeString(params.q);
  const postcode = safeString(params.postcode);
  const state = safeString(params.state);
  const page = params.page ? Number(params.page) : 1;
  const hasFilters = Boolean(q || postcode || state);

  let error: string | null = null;
  let result: Awaited<ReturnType<typeof searchApprovedOfficialProviderDirectory>> | null = null;

  if (hasFilters) {
    if ((q && (q.length < 2 || q.length > 80)) ||
        (postcode && !/^\d{4}$/.test(postcode)) ||
        (state && !STATES.some((item) => item === state)) ||
        !Number.isInteger(page) || page < 1 || page > 20) {
      error = "Check your search terms, state and four-digit postcode.";
    } else {
      try {
        result = await searchApprovedOfficialProviderDirectory({
          q: q || undefined,
          state: state ? state as (typeof STATES)[number] : undefined,
          postcode: postcode || undefined,
          page,
        });
      } catch {
        error = "The provider directory is currently unavailable. You can use the official NDIS Provider Finder.";
      }
    }
  }

  const nextPage = (value: number) => {
    const query = new URLSearchParams();
    if (q) query.set("q", q);
    if (state) query.set("state", state);
    if (postcode) query.set("postcode", postcode);
    query.set("page", String(value));
    return "/ndis/official-providers?" + query.toString();
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 text-[#0C1833]">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Find NDIS providers</h1>
        <p className="max-w-3xl text-slate-700">
          Search real public provider information imported from an official NDIA
          Provider Finder source, when an operator-approved snapshot is available.
          MapAble cannot guarantee a provider's current registration, availability
          or accessibility from this directory.
        </p>
      </header>
      <form action="/ndis/official-providers" method="get"
        className="grid gap-4 rounded-xl border border-slate-300 bg-white p-4 sm:grid-cols-3">
        <div className="space-y-2">
          <label htmlFor="ndis-provider-query" className="block font-semibold">Provider name or ABN</label>
          <input id="ndis-provider-query" name="q" type="search" defaultValue={q}
            placeholder="Enter at least two characters" maxLength={80}
            className="min-h-11 w-full rounded-md border border-slate-400 px-3 py-2 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300" />
        </div>
        <div className="space-y-2">
          <label htmlFor="ndis-provider-state" className="block font-semibold">State or territory</label>
          <select name="state" id="ndis-provider-state" defaultValue={state}
            className="min-h-11 w-full rounded-md border border-slate-400 px-3 py-2 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300">
            <option value="">Any location</option>
            {STATES.map(item => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="ndis-provider-postcode" className="block font-semibold">Postcode</label>
          <input id="ndis-provider-postcode" name="postcode" type="text"
            inputMode="numeric" pattern="[0-9]{4}" maxLength={4} defaultValue={postcode}
            className="min-h-11 w-full rounded-md border border-slate-400 px-3 py-2 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300" />
        </div>
        <div className="sm:col-span-3">
          <button type="submit" className="min-h-11 rounded-lg bg-[#005B7F] px-5 py-2 font-semibold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300">
            Search provider directory
          </button>
        </div>
      </form>

      {error ? <p role="alert" className="rounded-lg border border-red-400 p-4">{error}</p> : null}

      {!hasFilters ? (
        <p role="status">Enter a provider name, choose a state or enter a postcode to begin.</p>
      ) : null}

      {result && !result.available ? (
        <section aria-label="Directory unavailable" className="space-y-2 rounded-lg border border-amber-400 p-4">
          <h2 className="text-lg font-bold">No approved public-data snapshot is available</h2>
          <p className="text-slate-700">
            MapAble has not published a sufficiently recent, operator-approved
            source snapshot for this search. This does not mean the provider is
            unregistered or unavailable. No sample listings have been substituted.
          </p>
          <p className="text-sm text-slate-600">Status: {result.reason.replaceAll("_", " ")}</p>
        </section>
      ) : null}

      {result && result.available ? (
        <section className="space-y-4" aria-labelledby="ndis-provider-results-heading">
          <div className="space-y-1">
            <h2 id="ndis-provider-results-heading" className="text-2xl font-bold">
              Provider directory results
            </h2>
            <p className="text-sm text-slate-700">
              Source: NDIA Provider Finder public data. Imported on{" "}
              {result.evidence.retrievedAt.slice(0, 10)}.
              This is an approved MapAble snapshot, not an NDIA API connection
              or a live NDIS Commission registration check.
            </p>
          </div>
          {result.records.length === 0 ? (
            <p role="status">No records matched this snapshot. Verify directly using the official register.</p>
          ) : (
            <ul className="grid gap-4 md:grid-cols-2">
              {result.records.map(record => (
                <li key={record.sourceRecordId} className="space-y-2 rounded-xl border border-slate-300 bg-white p-4">
                  <h3 className="text-lg font-bold">{record.organisationName}</h3>
                  {record.abn ? <p className="text-sm">ABN: {record.abn}</p> : null}
                  <p className="text-sm">
                    Location: {[record.suburb, record.state, record.postcode].filter(Boolean).join(", ") || "Not specified"}
                  </p>
                  {record.registrationGroups.length ? <p className="text-sm">
                    Listed support groups: {record.registrationGroups.slice(0, 8).join(", ")}
                  </p> : null}
                  <p className="text-sm text-slate-700">
                    Source date: {record.sourceAsOf?.slice(0, 10) ?? "not supplied"}.
                    Current registration: not independently verified.
                    Worker screening, availability and accessibility: unknown.
                  </p>
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap items-center gap-4">
            {page > 1 ? <Link className="min-h-11 font-semibold underline" href={nextPage(page - 1)}>Previous page</Link> : null}
            <span aria-label={"Current page " + page}>Page {page}</span>
            {result.hasMore ? <Link className="min-h-11 font-semibold underline" href={nextPage(page + 1)}>Next page</Link> : null}
          </div>
        </section>
      ) : null}

      <aside className="space-y-2 border-t border-slate-300 pt-5">
        <h2 className="text-lg font-bold">Verify before engaging a provider</h2>
        <p className="max-w-3xl text-slate-700">
          Check registration status and registration groups directly with the NDIS
          Commission. Individual worker screening needs authorised verification;
          registration alone cannot establish competence or your personal fit.
        </p>
        <a href="https://www.ndiscommission.gov.au/provider-registration/find-registered-provider"
          target="_blank" rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center font-semibold text-[#005B7F] underline underline-offset-4">
          Open the NDIS Commission Provider Register (new tab)
        </a>
      </aside>
    </div>
  );
}
