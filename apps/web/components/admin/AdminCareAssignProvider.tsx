"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export type AssignableOrganisation = {
  id: string;
  name: string;
  serviceReady: boolean;
  blockerLabels: string[];
};

export function AdminCareAssignProvider({
  careRequestId,
  currentOrganisationId,
  assignableOrganisations,
  canAssign,
}: {
  careRequestId: string;
  currentOrganisationId: string | null;
  assignableOrganisations: AssignableOrganisation[];
  canAssign: boolean;
}) {
  const router = useRouter();
  const [organisationId, setOrganisationId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const readyOrgs = assignableOrganisations.filter((o) => o.serviceReady);
  const selected = assignableOrganisations.find((o) => o.id === organisationId);

  async function handleAssign() {
    if (!organisationId) {
      setError("Select a provider organisation.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/care/requests/${careRequestId}/assign-provider`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ organisationId }),
        }
      );
      const data = (await res.json()) as {
        error?: string;
        blockers?: { label: string }[];
      };
      if (!res.ok) {
        if (data.blockers?.length) {
          setError(
            `Provider not service-ready: ${data.blockers.map((b) => b.label).join("; ")}`
          );
        } else {
          setError(data.error ?? "Assign failed.");
        }
        return;
      }
      router.refresh();
    } catch {
      setError("Assign failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (currentOrganisationId) {
    return (
      <p className="text-sm text-muted-foreground">
        Provider already assigned. The organisation can accept from their care
        inbox.
      </p>
    );
  }

  if (!canAssign) {
    return (
      <p className="text-sm text-muted-foreground">
        This request cannot be assigned in its current status.
      </p>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      <h2 className="text-sm font-semibold">Assign provider</h2>
      <p className="text-sm text-muted-foreground">
        Only service-ready organisations (verified, approved, with active workers)
        can be assigned.
      </p>
      <label className="block text-sm font-medium" htmlFor="assign-org">
        Provider organisation
      </label>
      <select
        id="assign-org"
        value={organisationId}
        onChange={(e) => setOrganisationId(e.target.value)}
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        disabled={busy}
      >
        <option value="">Select organisation…</option>
        {readyOrgs.map((org) => (
          <option key={org.id} value={org.id}>
            {org.name}
          </option>
        ))}
        {assignableOrganisations
          .filter((o) => !o.serviceReady)
          .map((org) => (
            <option key={org.id} value={org.id} disabled>
              {org.name} (not service-ready)
            </option>
          ))}
      </select>
      {selected && !selected.serviceReady ? (
        <ul className="list-inside list-disc text-sm text-amber-800 dark:text-amber-200">
          {selected.blockerLabels.map((label) => (
            <li key={label}>{label}</li>
          ))}
        </ul>
      ) : null}
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Button
        type="button"
        variant="default"
        size="default"
        disabled={busy || !organisationId || !selected?.serviceReady}
        onClick={() => void handleAssign()}
      >
        {busy ? "Assigning…" : "Assign provider"}
      </Button>
    </div>
  );
}
