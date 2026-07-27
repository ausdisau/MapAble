"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { AU_JURISDICTIONS } from "@/lib/workers/worker-screening-shared";
export function WorkerScreeningForm({
  onSubmitted,
}: {
  onSubmitted?: () => void;
}) {
  const [jurisdiction, setJurisdiction] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (!file || !jurisdiction) {
      setError("Please select a jurisdiction and upload your certificate.");
      return;
    }

    setBusy(true);
    const formData = new FormData();
    formData.append("jurisdiction", jurisdiction);
    formData.append("certificate", file);

    const res = await fetch("/api/workers/me/screening", {
      method: "POST",
      body: formData,
    });
    const data = (await res.json()) as { message?: string; error?: string };
    setBusy(false);

    if (!res.ok) {
      setError(data.error ?? "Could not submit screening check");
      return;
    }
    setMessage(data.message ?? "Submitted for manual review.");
    setFile(null);
    onSubmitted?.();
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="mx-auto max-w-xl space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      aria-labelledby="screening-form-heading"
    >
      <h2
        id="screening-form-heading"
        className="mapable-display text-xl font-black text-[#0C1833]"
      >
        NDIS Worker Screening verification
      </h2>
      <p className="text-sm text-slate-600">
        Upload your state or territory screening certificate. MapAble queues
        manual review — OCR/jurisdiction automation can be added later.
      </p>

      <label className="block text-sm font-bold text-slate-700">
        Jurisdiction
        <select
          value={jurisdiction}
          onChange={(e) => setJurisdiction(e.target.value)}
          className="mt-1 block w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm font-medium"
          required
        >
          <option value="">Select state or territory</option>
          {AU_JURISDICTIONS.map((code) => (
            <option key={code} value={code}>
              {code}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm font-bold text-slate-700">
        Upload certificate (PDF or image)
        <input
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="mt-1 block w-full text-sm"
          required
        />
      </label>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {message ? (
        <p role="status" className="text-sm font-medium text-[#00A979]">
          {message}
        </p>
      ) : null}

      <Button type="submit" variant="default" size="default" disabled={busy}>
        {busy ? "Submitting…" : "Submit for verification"}
      </Button>
    </form>
  );
}
