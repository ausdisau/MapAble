"use client";

import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ClipboardCopy,
  ExternalLink,
  Globe2,
  MapPinned,
  Search,
  ShieldCheck,
  Smartphone,
  Terminal,
} from "lucide-react";
import Link from "next/link";
import { type FormEvent, useRef, useState } from "react";

import {
  getLaunchCommand,
  WORKSPACE_REPO,
  WORKSPACE_TARGETS,
  type WorkspaceTargetId,
} from "@/lib/workspace/targets";

type SearchResult = {
  place: {
    id: string;
    name: string;
    suburb?: string | null;
    confidence: string;
    category: string;
  };
  matchReasons: string[];
};

type SearchStatus = "idle" | "loading" | "success" | "error";

function isSearchResults(value: unknown): value is { results: SearchResult[] } {
  if (!value || typeof value !== "object" || !("results" in value)) return false;
  const results = value.results;
  return (
    Array.isArray(results) &&
    results.every(
      (item) =>
        item &&
        typeof item === "object" &&
        item.place &&
        typeof item.place.id === "string" &&
        typeof item.place.name === "string" &&
        typeof item.place.category === "string" &&
        typeof item.place.confidence === "string" &&
        Array.isArray(item.matchReasons) &&
        item.matchReasons.every((reason: unknown) => typeof reason === "string"),
    )
  );
}

function formatConfidence(value: string): string {
  return value.replaceAll("_", " ");
}

export function UnifiedWorkspaceRouter() {
  const [lastAction, setLastAction] = useState(
    "No local commands have been copied. Server process status has not been checked.",
  );
  const [activity, setActivity] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchState, setSearchState] = useState<SearchStatus>("idle");
  const [searchMessage, setSearchMessage] = useState(
    "Enter a search term to test the existing MapAble Access API. Device location is not requested.",
  );
  const [results, setResults] = useState<SearchResult[]>([]);
  const requestRef = useRef<AbortController | null>(null);

  async function copyLaunchCommand(id: WorkspaceTargetId) {
    const command = getLaunchCommand(id);
    if (!command) return;
    try {
      await navigator.clipboard.writeText(command);
      const line = `Copied: ${command}. Run it in a terminal at the repository root.`;
      setLastAction(line);
      setActivity((previous) => [line, ...previous].slice(0, 8));
    } catch {
      setLastAction(
        `Clipboard permission denied. Select and copy the displayed command: ${command}`,
      );
    }
  }

  async function searchAccess(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = searchTerm.trim();
    if (!q) {
      setSearchState("error");
      setSearchMessage("Enter a place, suburb or category first.");
      setResults([]);
      return;
    }
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setSearchState("loading");
    setSearchMessage("Searching the configured MapAble web API...");
    setResults([]);
    try {
      const response = await fetch(
        `/api/access/search?q=${encodeURIComponent(q)}&limit=5&sort=relevance`,
        { signal: controller.signal, cache: "no-store", headers: { Accept: "application/json" } },
      );
      if (!response.ok) throw new Error(`API returned HTTP ${response.status}`);
      const data: unknown = await response.json();
      if (!isSearchResults(data)) {
        throw new Error("API returned an unexpected response structure");
      }
      if (controller.signal.aborted) return;
      setResults(data.results);
      setSearchState("success");
      setSearchMessage(
        `${data.results.length} place${data.results.length === 1 ? "" : "s"} returned. Check confidence and source details before relying on a listing.`,
      );
    } catch (error) {
      if (controller.signal.aborted) return;
      setSearchState("error");
      setSearchMessage(
        error instanceof Error
          ? `Could not complete the search: ${error.message}. Check local configuration or try later.`
          : "The service is unavailable. Try again later.",
      );
      setResults([]);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <a
        href="#workspace-main"
        className="sr-only rounded-lg bg-white px-4 py-3 font-semibold text-slate-950 focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50"
      >
        Skip to workspace controls
      </a>
      <header className="border-b border-slate-700 bg-slate-900">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="rounded-xl bg-indigo-600 p-2.5 text-white">
              <MapPinned size={23} />
            </span>
            <div>
              <p className="text-xl font-bold tracking-tight">MapAble <span className="text-indigo-300">Unified</span></p>
              <p className="text-xs text-slate-300">Internal development workspace</p>
            </div>
          </div>
          <span className="rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-200">
            Process status: not monitored
          </span>
        </div>
      </header>

      <main id="workspace-main" className="mx-auto grid w-full max-w-7xl gap-7 px-4 py-8 lg:grid-cols-3 lg:px-6">
        <aside className="space-y-6 lg:col-span-1" aria-label="Workspace configuration and provenance">
          <section className="rounded-xl border border-slate-700 bg-slate-900 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold"><ShieldCheck size={20} aria-hidden="true" className="text-indigo-300" /> Repository provenance</h2>
            <p className="rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm leading-relaxed text-slate-200">
              Canonical system of record: <a href={WORKSPACE_REPO.url} target="_blank" rel="noopener noreferrer" className="break-words font-semibold text-indigo-200 underline underline-offset-2">{WORKSPACE_REPO.canonical}<ExternalLink size={12} aria-hidden="true" className="ml-1 inline" /></a>. The web application was imported from {WORKSPACE_REPO.importedSource} using subtree history.
            </p>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex flex-wrap justify-between gap-2 border-b border-slate-700 pb-2"><dt className="text-slate-300">Imported source commit</dt><dd className="font-mono text-indigo-200">{WORKSPACE_REPO.importCommit.slice(0, 8)}</dd></div>
              <div className="flex flex-wrap justify-between gap-2 border-b border-slate-700 pb-2"><dt className="text-slate-300">Root package manager</dt><dd>{WORKSPACE_REPO.packageManager}</dd></div>
              <div className="flex flex-wrap justify-between gap-2"><dt className="text-slate-300">Architecture</dt><dd>Separate app dependency roots</dd></div>
            </dl>
            <p className="mt-3 text-xs text-slate-300">Migration provenance is documented in the repository. This is not a live Git synchronization indicator.</p>
          </section>

          <section className="rounded-xl border border-slate-700 bg-slate-900 p-5">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-bold"><Activity size={20} aria-hidden="true" className="text-violet-300" /> Cross-app integration</h2>
            <p className="text-sm text-slate-200">A configured mobile client can search the web Access endpoint with user-entered text. No device coordinates are requested by this integration.</p>
            <div className="mt-4 space-y-3">
              <div className="rounded-lg border border-slate-700 bg-slate-950 p-3"><p className="break-all font-mono text-sm font-semibold text-emerald-300">GET /api/access/search</p><p className="mt-1 text-sm text-slate-300">API contract exists in the web application. Current health is not asserted.</p></div>
              <div className="rounded-lg border border-slate-700 bg-slate-950 p-3"><p className="break-all font-mono text-sm font-semibold text-indigo-200">EXPO_PUBLIC_MAPABLE_API_URL</p><p className="mt-1 text-sm text-slate-300">Public mobile API base URL. A missing value should produce a clear unconfigured state; never store secrets here.</p></div>
            </div>
          </section>

          <section className="rounded-xl border-l-4 border-amber-400 bg-slate-900 p-5">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-bold"><AlertTriangle size={20} aria-hidden="true" className="text-amber-300" /> Workspace boundaries</h2>
            <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-200">
              <li>Keep web code in <code>apps/web</code> and Expo code in <code>apps/mobile</code>.</li>
              <li>Do not merge the React 18 and React 19 dependency trees.</li>
              <li>Do not put credentials or private information in client configuration.</li>
              <li>This page cannot run shell commands or control processes remotely.</li>
              <li>Marketplace transactions remain disabled until independently approved.</li>
            </ul>
          </section>
        </aside>

        <div className="space-y-6 lg:col-span-2">
          <section className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900" aria-labelledby="router-title">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700 bg-slate-950 px-5 py-4">
              <div><h1 id="router-title" className="text-2xl font-bold">Unified App Router</h1><p className="mt-1 text-sm text-slate-300">Copy verified local launch commands, then run them in your own terminal.</p></div>
              <span className="font-mono text-xs text-slate-300">v1.0 design adaptation</span>
            </div>
            <div className="space-y-4 p-5">
              {WORKSPACE_TARGETS.map((target) => {
                const Icon = target.id === "web" ? Globe2 : Smartphone;
                return <article key={target.id} className="rounded-xl border border-slate-700 bg-slate-950 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex min-w-0 flex-1 items-start gap-4">
                      <span aria-hidden="true" className="shrink-0 rounded-lg bg-indigo-950 p-3 text-indigo-200"><Icon size={23} /></span>
                      <div className="min-w-0">
                        <h2 className="text-xl font-bold">{target.directory}</h2>
                        <p className="mt-1 text-sm text-slate-200">{target.title}</p>
                        <p className="mt-1 text-sm text-slate-300">{target.description}</p>
                        <p className="mt-3 inline-block rounded-lg border border-slate-600 px-3 py-2 font-mono text-sm text-slate-100">{target.command}</p>
                        <p className="mt-2 text-xs text-slate-300">Runtime: not checked. Requires installation and local execution.</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => copyLaunchCommand(target.id)} className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-indigo-300"><ClipboardCopy size={18} aria-hidden="true" />Copy start command</button>
                  </div>
                  {target.localUrl ? <a className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-indigo-200 underline underline-offset-4 focus-visible:outline-2" href={target.localUrl} target="_blank" rel="noopener noreferrer">Open localhost after starting the web app <ExternalLink size={15} aria-hidden="true" /></a> : null}
                </article>;
              })}
              <section aria-labelledby="terminal-label" className="overflow-hidden rounded-xl border border-slate-700 bg-slate-950">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700 px-4 py-3"><h2 id="terminal-label" className="flex items-center gap-2 text-sm font-semibold"><Terminal size={18} aria-hidden="true" /> Local launcher instructions and UI activity</h2><button className="min-h-11 rounded-md px-3 text-sm text-indigo-200 underline focus-visible:outline-2" type="button" onClick={() => setActivity([])}>Clear activity</button></div>
                <div className="space-y-2 p-4 font-mono text-sm leading-relaxed text-slate-200">
                  <p>From the canonical repository root:</p>
                  <p className="break-all text-indigo-200">$ corepack enable</p>
                  <p className="break-all text-indigo-200">$ pnpm dev:web</p>
                  <p className="break-all text-indigo-200">$ npm run dev:mobile</p>
                  <p className="text-slate-300">To stop a locally running process, use Ctrl+C in its terminal.</p>
                  <div role="status" aria-live="polite" className="mt-3 rounded-lg border border-slate-700 p-3 text-emerald-200">{lastAction}</div>
                  {activity.length > 0 ? <ol aria-label="Recent local UI activity" className="list-decimal space-y-1 pl-5 text-slate-300">{activity.map((event, index) => <li key={`${index}-${event}`}>{event}</li>)}</ol> : null}
                </div>
              </section>
            </div>
          </section>

          <section className="rounded-xl border border-slate-700 bg-slate-900 p-5" aria-labelledby="sandbox-title">
            <h2 id="sandbox-title" className="flex items-center gap-2 text-xl font-bold"><MapPinned size={22} aria-hidden="true" /> Accessible-place search sandbox</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-200">This uses the existing MapAble Access API, not a simulated map or an embedded third-party API key. Only the text you submit is sent; live device location is not used. Results may be unavailable if the platform database is not configured.</p>
            <form className="mt-4 flex flex-wrap items-end gap-3" onSubmit={searchAccess}>
              <div className="min-w-52 flex-1"><label htmlFor="workspace-search" className="mb-2 block text-sm font-semibold">Place, suburb or category</label><input id="workspace-search" type="search" maxLength={80} autoComplete="off" placeholder="For example, library" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="min-h-12 w-full rounded-lg border-2 border-slate-500 bg-slate-950 px-4 py-3 text-base text-white placeholder:text-slate-400 focus-visible:outline-4 focus-visible:outline-indigo-300" /></div>
              <button type="submit" disabled={searchState === "loading"} className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-500 disabled:opacity-60 focus-visible:outline-4 focus-visible:outline-indigo-300"><Search size={18} aria-hidden="true" />{searchState === "loading" ? "Searching..." : "Search API"}</button>
            </form>
            <p role="status" aria-live="polite" className="mt-3 text-sm text-slate-200">{searchMessage}</p>
            {searchState === "success" && results.length > 0 ? <ul className="mt-4 space-y-3" aria-label="MapAble Access search results">{results.map((item) => <li key={item.place.id} className="rounded-lg border border-slate-700 bg-slate-950 p-4"><h3 className="text-lg font-semibold">{item.place.name}</h3><p className="text-sm text-slate-200">{item.place.category}{item.place.suburb ? ` - ${item.place.suburb}` : ""}</p><p className="text-sm text-slate-300">Evidence confidence: {formatConfidence(item.place.confidence)}. Check source and date on the full place detail page.</p>{item.matchReasons.length > 0 ? <p className="mt-1 text-sm text-slate-200">Match: {item.matchReasons.join("; ")}</p> : null}</li>)}</ul> : null}
            {searchState === "success" ? <p className="mt-3 flex items-center gap-2 text-sm text-emerald-300"><CheckCircle2 size={16} aria-hidden="true" /> API response received; this does not verify accessibility claims.</p> : null}
            <div className="mt-5 flex flex-wrap gap-5 text-sm"><Link className="min-h-11 text-indigo-200 underline underline-offset-4" href="/access">Open full MapAble Access experience</Link><Link className="min-h-11 text-indigo-200 underline underline-offset-4" href="/marketplace">View Marketplace programme explainer</Link></div>
          </section>
        </div>
      </main>
      <footer className="border-t border-slate-700 px-5 py-5 text-center text-sm text-slate-300">Internal workspace only. Process controls are local terminal commands. Participant safety, consent and payment gates remain in force.</footer>
    </div>
  );
}
