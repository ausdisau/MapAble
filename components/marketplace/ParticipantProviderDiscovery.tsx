"use client";

import Link from "next/link";
import React, { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";

type Provider = {
  organisationId: string;
  displayName: string;
  evidence: Array<{
    capability: string;
    source: string;
    verificationStatus: string;
    observedAt: string;
  }>;
  capacity: { available: number; observedAt: string } | null;
  sponsored: false;
};

export function ParticipantProviderDiscovery({
  initialProviders,
}: {
  initialProviders: Provider[];
}) {
  const [providers, setProviders] = useState(initialProviders);
  const [serviceType, setServiceType] = useState("");
  const [serviceArea, setServiceArea] = useState("");
  const [status, setStatus] = useState("");

  async function search(event: FormEvent) {
    event.preventDefault();
    const query = new URLSearchParams();
    if (serviceType) query.set("serviceType", serviceType);
    if (serviceArea) query.set("serviceArea", serviceArea);
    const response = await fetch(`/api/participant/providers?${query}`);
    const payload = await response.json();
    if (!response.ok) {
      setStatus(
        "Provider search is unavailable. You can use the standard provider finder.",
      );
      return;
    }
    setProviders(payload.providers);
    setStatus(`${payload.providers.length} provider option(s) found.`);
  }

  async function controlProvider(
    providerOrgId: string,
    action: "shortlist" | "hide",
  ) {
    const response = await fetch("/api/participant/shortlist", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ providerOrgId, action }),
    });
    if (response.ok && action === "hide") {
      setProviders((items) =>
        items.filter((item) => item.organisationId !== providerOrgId),
      );
    }
    setStatus(
      response.ok
        ? action === "hide"
          ? "Provider hidden. They will not receive a request."
          : "Provider added to your shortlist."
        : "That change could not be saved.",
    );
  }

  return (
    <section aria-labelledby="provider-discovery-heading" className="space-y-5">
      <header>
        <h1
          id="provider-discovery-heading"
          className="font-heading text-3xl font-bold"
        >
          Find support providers
        </h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Browse using ordinary filters. Verified evidence, provider statements
          and unknown information remain separate. Sponsored status never
          changes these results.
        </p>
      </header>
      <form
        className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2"
        onSubmit={search}
      >
        <label className="font-bold">
          Service type
          <input
            className="mt-1 min-h-11 w-full rounded-lg border px-3"
            value={serviceType}
            onChange={(event) => setServiceType(event.target.value)}
          />
        </label>
        <label className="font-bold">
          Service area
          <input
            className="mt-1 min-h-11 w-full rounded-lg border px-3"
            value={serviceArea}
            onChange={(event) => setServiceArea(event.target.value)}
          />
        </label>
        <Button type="submit" size="default" variant="default">
          Apply filters
        </Button>
        <Button
          type="button"
          size="default"
          variant="outline"
          onClick={() => {
            setServiceType("");
            setServiceArea("");
          }}
        >
          Clear filters
        </Button>
      </form>
      <p role="status" aria-live="polite">
        {status}
      </p>
      <ul className="space-y-4">
        {providers.map((provider) => (
          <li key={provider.organisationId} className="rounded-xl border p-4">
            <h2 className="font-heading text-xl font-bold">
              {provider.displayName}
            </h2>
            <p className="text-sm">
              Capacity:{" "}
              {provider.capacity
                ? `${provider.capacity.available} place(s) recorded`
                : "unknown"}
            </p>
            <h3 className="mt-3 font-bold">Evidence</h3>
            {provider.evidence.length ? (
              <ul className="list-disc pl-5 text-sm">
                {provider.evidence.map((evidence) => (
                  <li key={`${evidence.capability}-${evidence.observedAt}`}>
                    {evidence.capability}: {evidence.verificationStatus} (
                    {evidence.source})
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm">Evidence is missing or unknown.</p>
            )}
            <div className="mt-4 flex flex-wrap gap-3">
              <Button
                onClick={() =>
                  controlProvider(provider.organisationId, "shortlist")
                }
                size="default"
                variant="default"
              >
                Add to shortlist
              </Button>
              <Button
                onClick={() => controlProvider(provider.organisationId, "hide")}
                size="default"
                variant="outline"
              >
                Hide provider
              </Button>
            </div>
          </li>
        ))}
      </ul>
      {!providers.length ? (
        <p>
          No providers match these filters. Change or clear filters, or ask a
          person for help.
        </p>
      ) : null}
      <Link
        className="inline-flex min-h-11 items-center underline"
        href="/provider-finder"
      >
        Use the standard provider finder
      </Link>
    </section>
  );
}
