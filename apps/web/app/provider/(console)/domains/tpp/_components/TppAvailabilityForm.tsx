"use client";

import { useState, type FormEvent } from "react";
import type { TppAvailability } from "@/lib/provider-cloud/tpp-wholesale/client";

type Org = { id: string; name: string };

export function TppAvailabilityForm({ organisations }: { organisations: Org[] }) {
  const [organisationId, setOrganisationId] = useState(organisations[0]?.id ?? "");
  const [domain, setDomain] = useState("");
  const [noticeAccepted, setNoticeAccepted] = useState(false);
  const [result, setResult] = useState<TppAvailability | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(null);
    setError("");
    setBusy(true);
    try {
      const response = await fetch("/api/providercloud/domains/availability", {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organisationId,
          domain,
          providerNoticeAccepted: noticeAccepted,
        }),
      });
      const data = (await response.json()) as TppAvailability & { error?: string };
      if (!response.ok) {
        if (data.error === "INVALID_DOMAIN") throw new Error("Enter a valid, non-reserved domain name.");
        throw new Error("Availability could not be checked. Please try again or contact support.");
      }
      setResult(data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Domain lookup failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-label="Live domain availability lookup" className="max-w-2xl space-y-4">
      <form onSubmit={submit} className="space-y-4 rounded-lg border p-5">
        <div className="space-y-2">
          <label htmlFor="tpp-org" className="block font-medium">Provider organisation</label>
          <select id="tpp-org" className="w-full rounded border p-3" value={organisationId}
            onChange={(event) => setOrganisationId(event.target.value)}>
            {organisations.map((org) => <option key={org.id} value={org.id}>{org.name}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="tpp-domain" className="block font-medium">Domain to check</label>
          <input id="tpp-domain" type="text" required autoComplete="off" spellCheck={false}
            aria-describedby="tpp-domain-hint" placeholder="your-provider.com.au"
            className="w-full rounded border p-3" value={domain}
            onChange={(event) => setDomain(event.target.value)} />
          <p id="tpp-domain-hint" className="text-sm text-muted-foreground">
            Enter a registered-domain candidate, not a website URL. This makes a real external lookup.
          </p>
        </div>
        <label className="flex items-start gap-3">
          <input className="mt-1 h-5 w-5" type="checkbox" required checked={noticeAccepted}
            onChange={(event) => setNoticeAccepted(event.target.checked)} />
          <span>I understand this domain name will be sent to TPP Wholesale for an availability check.
            No domain will be purchased.</span>
        </label>
        <button type="submit" disabled={busy || !noticeAccepted || !organisationId}
          className="rounded bg-primary px-5 py-3 font-medium text-primary-foreground disabled:opacity-50">
          {busy ? "Checking domain" : "Check availability"}
        </button>
      </form>
      <div aria-live="polite" aria-atomic="true">
        {error ? <p role="alert" className="rounded border p-4">{error}</p> : null}
        {result ? <section className="space-y-2 rounded border p-4" aria-labelledby="tpp-result">
          <h2 id="tpp-result" className="text-xl font-semibold">Domain availability result</h2>
          <p><strong>Domain:</strong> {result.domain}</p>
          <p><strong>Availability:</strong> {result.available ? "Reported available" : "Not available"}</p>
          <p><strong>Premium:</strong> {result.premium ? "Yes" : "No"}</p>
          {result.prices.length ? <div>
            <h3 className="font-medium">Indicative wholesale values</h3>
            <ul className="list-disc pl-5">{result.prices.map((price) => (
              <li key={price.years}>{price.years} year(s): {price.price.toFixed(2)} (currency not verified)</li>
            ))}</ul>
          </div> : null}
          <p className="text-sm text-muted-foreground">
            This is not a sale quote or price guarantee. Taxes, currency, eligibility and final fees
            must be confirmed separately. No order or DNS operation has been submitted.
          </p>
        </section> : null}
      </div>
    </section>
  );
}
