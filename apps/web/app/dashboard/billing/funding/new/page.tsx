"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { formInputClass } from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";

const FUNDING_TYPES = [
  { value: "ndis_plan_managed", label: "NDIS plan-managed" },
  { value: "ndis_self_managed", label: "NDIS self-managed" },
  { value: "private_card", label: "Private card" },
  { value: "organisation_invoice", label: "Organisation invoice" },
  { value: "grant", label: "Grant" },
  { value: "other", label: "Other" },
] as const;

export default function NewBillingFundingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<string>("ndis_plan_managed");

  return (
    <form
      className="max-w-2xl space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const fd = new FormData(e.currentTarget);
        const body: Record<string, unknown> = {
          type: fd.get("type"),
          label: fd.get("label"),
          isDefault: fd.get("isDefault") === "on",
        };
        const ndisNum = fd.get("ndisParticipantNumber");
        if (ndisNum) body.ndisParticipantNumber = ndisNum;
        const pmName = fd.get("planManagerName");
        if (pmName) body.planManagerName = pmName;
        const pmEmail = fd.get("planManagerEmail");
        if (pmEmail) body.planManagerEmail = pmEmail;

        const res = await fetch("/api/billing/funding-sources", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        setLoading(false);
        if (!res.ok) {
          setError(data.error ?? "Could not save funding source.");
          return;
        }
        router.push(`/dashboard/billing/funding/${data.fundingSource.id}`);
      }}
    >
      <h1 className="font-heading text-2xl font-bold">Add funding source</h1>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <label htmlFor="type" className="text-sm font-medium">
        Funding type
      </label>
      <select
        id="type"
        name="type"
        className={formInputClass}
        value={type}
        onChange={(e) => setType(e.target.value)}
        required
      >
        {FUNDING_TYPES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>

      <label htmlFor="label" className="text-sm font-medium">
        Label
      </label>
      <input id="label" name="label" className={formInputClass} required maxLength={200} />

      {type === "ndis_plan_managed" || type === "ndis_self_managed" ? (
        <>
          <label htmlFor="ndisParticipantNumber" className="text-sm font-medium">
            NDIS participant number (optional)
          </label>
          <input
            id="ndisParticipantNumber"
            name="ndisParticipantNumber"
            className={formInputClass}
            maxLength={50}
          />
        </>
      ) : null}

      {type === "ndis_plan_managed" ? (
        <>
          <label htmlFor="planManagerName" className="text-sm font-medium">
            Plan manager name (optional)
          </label>
          <input id="planManagerName" name="planManagerName" className={formInputClass} />
          <label htmlFor="planManagerEmail" className="text-sm font-medium">
            Plan manager email (optional)
          </label>
          <input
            id="planManagerEmail"
            name="planManagerEmail"
            type="email"
            className={formInputClass}
          />
        </>
      ) : null}

      <label className="flex min-h-11 items-center gap-2">
        <input type="checkbox" name="isDefault" />
        Set as default funding source
      </label>

      <div className="flex flex-wrap gap-3 pt-2">
        <Button type="submit" variant="default" size="default" loading={loading}>
          Save funding source
        </Button>
        <Link
          href="/dashboard/billing/funding"
          className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
