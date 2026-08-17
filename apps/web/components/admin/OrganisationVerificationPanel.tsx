"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { formInputClass } from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";

const STATUSES = [
  "not_started",
  "pending_review",
  "verified",
  "rejected",
  "suspended",
] as const;

export function OrganisationVerificationPanel({
  organisationId,
  currentStatus,
}: {
  organisationId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  return (
    <section className="rounded-xl border border-border bg-card p-4" aria-labelledby="verification-heading">
      <h2 id="verification-heading" className="font-semibold">
        Verification status
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Manual verification only in Phase 1. Changes are audit logged.
      </p>
      <div className="mt-3 flex items-center gap-2">
        <span className="text-sm font-medium">Current:</span>
        <StatusBadge status={status} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <label htmlFor="verification-status" className="sr-only">
          Change verification status
        </label>
        <select
          id="verification-status"
          className={formInputClass}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ")}
            </option>
          ))}
        </select>
        <Button
          type="button"
          variant="default"
          size="default"
          loading={saving}
          onClick={async () => {
            setSaving(true);
            setMessage("");
            const res = await fetch(`/api/organisations/${organisationId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ verificationStatus: status }),
            });
            setSaving(false);
            if (res.ok) {
              setMessage("Verification status updated.");
              router.refresh();
            } else {
              setMessage("Could not update status. Try again.");
            }
          }}
        >
          Save status
        </Button>
      </div>
      {message ? (
        <p role="status" className="mt-2 text-sm">
          {message}
        </p>
      ) : null}
    </section>
  );
}
