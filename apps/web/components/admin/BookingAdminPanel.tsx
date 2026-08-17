"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { formInputClass } from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";

const STATUSES = [
  "requested",
  "awaiting_provider_acceptance",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
] as const;

export function BookingAdminPanel({
  bookingId,
  currentStatus,
  organisations,
}: {
  bookingId: string;
  currentStatus: string;
  organisations: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [organisationId, setOrganisationId] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h2 className="font-semibold">Manage booking</h2>
      <p className="text-sm text-muted-foreground">
        Phase 1: manual provider assignment and status updates.
      </p>
      <div className="mt-4 space-y-3">
        <label htmlFor="status" className="block text-sm font-medium">
          Status
        </label>
        <select
          id="status"
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
        <label htmlFor="org-assign" className="block text-sm font-medium">
          Assign organisation
        </label>
        <select
          id="org-assign"
          className={formInputClass}
          value={organisationId}
          onChange={(e) => setOrganisationId(e.target.value)}
        >
          <option value="">Unassigned</option>
          {organisations.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
        <Button
          type="button"
          variant="default"
          size="default"
          loading={loading}
          onClick={async () => {
            setLoading(true);
            await fetch(`/api/bookings/${bookingId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                status,
                assignedOrganisationId: organisationId || null,
              }),
            });
            setLoading(false);
            router.refresh();
          }}
        >
          Save changes
        </Button>
      </div>
    </section>
  );
}
