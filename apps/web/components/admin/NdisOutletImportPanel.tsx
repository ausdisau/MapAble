"use client";

import { useState } from "react";

type Preview = {
  sourceHash: string;
  mode: "bundled" | "official" | "file";
  sourceDate: string | null;
  inputRowCount: number;
  recognisedRowCount: number;
  organisationCount: number;
  outletCount: number;
  rejectedRows: number;
  warningCount: number;
  meetsQualityGate: boolean;
  sourceBytes: number;
};
type Published = {
  runId: string | null; sourceHash: string | null; sourceDate: string | null;
  publishedAt: string | null; outletCount: number | null;
};
type Latest = {
  id: string; status: string; sourceSha256: string; sourceDate: string | null;
  outletCount: number; organisationCount: number; startedAt: string;
};
export function NdisOutletImportPanel({
  published, latest,
}: { published: Published; latest: Latest | null }) {
  const [source, setSource] = useState<"bundled" | "official">("bundled");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [message, setMessage] = useState("");
  async function runPreview() {
    setBusy(true); setPreview(null); setMessage("Inspecting the selected directory source.");
    try {
      const res = await fetch("/api/admin/ingest/ndis-provider-outlets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-MapAble-Admin-Intent": "ndis-outlet-preview",
        },
        credentials: "same-origin",
        body: JSON.stringify({ mode: "preview", source }),
      });
      const data = await res.json() as {
        ok?: boolean; preview?: Preview; error?: string;
      };
      if (!res.ok || !data.ok || !data.preview) {
        setMessage(data.error ?? "Preview unavailable. No database changes were made.");
        return;
      }
      setPreview(data.preview);
      setMessage("Preview complete. No data was staged, published or sent to a provider.");
    } catch {
      setMessage("Could not complete preview. No data was published.");
    } finally { setBusy(false); }
  }
  return <div className="space-y-6">
    <section className="rounded-xl border p-5" aria-labelledby="ndia-current-snapshot">
      <h2 id="ndia-current-snapshot" className="text-xl font-semibold">Published source</h2>
      <p>Publication: {published.runId ? "Controlled snapshot present" : "No approved snapshot published"}</p>
      <p>Source date: {published.sourceDate ?? "Unknown; must be independently checked"}</p>
      <p>Outlets in published snapshot: {published.outletCount ?? "—"}</p>
      {published.publishedAt ? <p>Published at: {published.publishedAt}</p> : null}
      <p className="mt-3 text-sm">
        Directory presence does not prove current NDIS Commission registration,
        worker screening, service availability, quality or accessibility.
      </p>
    </section>

    <section className="rounded-xl border p-5" aria-labelledby="ndia-import-preview">
      <h2 id="ndia-import-preview" className="text-xl font-semibold">Preview import source</h2>
      <label className="mt-3 block" htmlFor="ndia-import-source">Directory source</label>
      <select id="ndia-import-source"
        className="mt-2 min-h-12 w-full rounded-lg border-2 border-slate-500 p-3 focus-visible:outline focus-visible:outline-4"
        disabled={busy} value={source}
        onChange={(e) => setSource(e.target.value as "bundled" | "official")}>
        <option value="bundled">Bundled repository snapshot (may be historical)</option>
        <option value="official">Direct official NDIA URL (may block automated requests)</option>
      </select>
      <button type="button" disabled={busy} onClick={() => void runPreview()}
        className="mt-4 min-h-12 rounded-lg bg-[#19496d] px-5 py-3 font-semibold text-white focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2">
        {busy ? "Checking source..." : "Run read-only validation"}
      </button>
      <p role="status" aria-live="polite" className="mt-3">{message}</p>
      {preview ? <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        <div><dt>Organisations (grouped)</dt><dd>{preview.organisationCount}</dd></div>
        <div><dt>Outlet identities</dt><dd>{preview.outletCount}</dd></div>
        <div><dt>Raw records</dt><dd>{preview.inputRowCount}</dd></div>
        <div><dt>Rejected records</dt><dd>{preview.rejectedRows}</dd></div>
        <div><dt>Source date</dt><dd>{preview.sourceDate ?? "Unspecified in export"}</dd></div>
        <div><dt>Quality gate</dt><dd>{preview.meetsQualityGate ? "Passed" : "Hold for review"}</dd></div>
        <div className="sm:col-span-2 break-all"><dt>SHA-256 of exact source bytes</dt><dd>{preview.sourceHash}</dd></div>
      </dl> : null}
    </section>

    <section className="rounded-xl border p-5" aria-labelledby="ndia-operator">
      <h2 id="ndia-operator" className="text-xl font-semibold">Controlled operator handoff</h2>
      <p>No upload or publish button is available in the browser. Use the documented
        CLI from an approved environment, check the SHA-256 and staging summary,
        then require a second explicit decision to publish.</p>
      {latest ? <p className="mt-2">Latest staging run: {latest.status} · {latest.organisationCount} organisations,
        {" "}{latest.outletCount} outlets. Record: {latest.id}</p> :
        <p className="mt-2">No staging runs recorded.</p>}
      <p className="mt-3 text-sm">If a new source is inaccessible, retain the previous
        approved snapshot rather than silently substituting unverified data.</p>
    </section>
  </div>;
}
