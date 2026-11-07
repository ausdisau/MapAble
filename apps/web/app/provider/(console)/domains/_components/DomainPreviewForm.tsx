"use client";

import { useState, type FormEvent } from "react";

import type {
  DomainBindingPreview,
  DomainPreviewMode,
} from "@/lib/provider-cloud/domains/preview";

type OrganisationOption = { id: string; name: string };

export function DomainPreviewForm({
  organisations,
}: {
  organisations: OrganisationOption[];
}) {
  const [organisationId, setOrganisationId] = useState(organisations[0]?.id ?? "");
  const [mode, setMode] = useState<DomainPreviewMode>("platform_subdomain");
  const [hostname, setHostname] = useState("provider.sites.example.test");
  const [preview, setPreview] = useState<DomainBindingPreview | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setPreview(null);
    setError("");
    try {
      const response = await fetch("/api/providercloud/domains/preview", {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organisationId, mode, hostname }),
      });
      const body = (await response.json()) as DomainBindingPreview & { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Unable to create the domain preview.");
      setPreview(body);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The preview could not be created.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section aria-labelledby="domain-preview-heading" className="max-w-3xl space-y-5">
      <h2 id="domain-preview-heading" className="text-xl font-semibold">
        Plan a domain connection
      </h2>
      <form onSubmit={submit} className="space-y-4 rounded-lg border p-5">
        <div className="space-y-2">
          <label htmlFor="domain-organisation" className="block font-medium">
            Provider organisation
          </label>
          <select
            id="domain-organisation"
            className="w-full rounded-md border bg-background px-3 py-2"
            value={organisationId}
            onChange={(event) => setOrganisationId(event.target.value)}
          >
            {organisations.map((organisation) => (
              <option key={organisation.id} value={organisation.id}>
                {organisation.name}
              </option>
            ))}
          </select>
        </div>
        <fieldset className="space-y-2">
          <legend className="font-medium">Connection type</legend>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={mode === "platform_subdomain"}
              onChange={() => {
                setMode("platform_subdomain");
                setHostname("provider.sites.example.test");
              }}
            />
            ProviderCloud subdomain
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={mode === "existing_domain"}
              onChange={() => {
                setMode("existing_domain");
                setHostname("www.example.org");
              }}
            />
            Connect an existing domain
          </label>
        </fieldset>
        <div className="space-y-2">
          <label htmlFor="domain-hostname" className="block font-medium">
            Example hostname
          </label>
          <input
            id="domain-hostname"
            required
            autoComplete="off"
            spellCheck={false}
            aria-describedby="hostname-help"
            className="w-full rounded-md border bg-background px-3 py-2"
            value={hostname}
            onChange={(event) => setHostname(event.target.value)}
          />
          <p id="hostname-help" className="text-sm text-muted-foreground">
            Reserved example names only: .test, example.com, example.org or example.net.
            Do not enter a domain you own. No external verification occurs.
          </p>
        </div>
        <button
          type="submit"
          disabled={pending || !organisationId}
          className="rounded-md bg-primary px-4 py-3 font-medium text-primary-foreground disabled:opacity-50"
        >
          {pending ? "Preparing preview" : "Preview domain plan"}
        </button>
      </form>
      <div aria-live="polite" aria-atomic="true">
        {error ? <p role="alert" className="rounded-md border p-3">{error}</p> : null}
        {preview ? (
          <section aria-labelledby="preview-result-heading" className="space-y-3 rounded-lg border p-5">
            <h3 id="preview-result-heading" className="text-lg font-semibold">
              Synthetic domain plan
            </h3>
            <p><strong>Hostname:</strong> {preview.hostname}</p>
            <p><strong>State:</strong> Draft only; not registered or verified</p>
            <p><strong>DNS:</strong> Not checked</p>
            <p><strong>HTTPS:</strong> Not checked</p>
            <p><strong>Publication:</strong> Blocked</p>
            <h4 className="font-semibold">Requirements before a real connection</h4>
            <ol className="list-decimal space-y-2 pl-5">
              {preview.nextSteps.map((step) => <li key={step}>{step}</li>)}
            </ol>
          </section>
        ) : null}
      </div>
    </section>
  );
}
