"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const STATUSES = [
  { value: "driver_en_route", label: "En route to pickup" },
  { value: "arrived_for_pickup", label: "Arrived for pickup" },
  { value: "participant_on_board", label: "Participant on board" },
  { value: "in_transit", label: "In transit" },
  { value: "arrived_at_destination", label: "Arrived at destination" },
  { value: "completed", label: "Complete trip" },
];

export function DriverTripActions({
  transportBookingId,
}: {
  transportBookingId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function setStatus(status: string) {
    if (status === "completed" && !confirm("Mark this trip as completed?")) {
      return;
    }
    setLoading(true);
    await fetch(`/api/driver/trips/${transportBookingId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="space-y-3" role="group" aria-label="Update trip status">
      {STATUSES.map((s) => (
        <button
          key={s.value}
          type="button"
          disabled={loading}
          onClick={() => setStatus(s.value)}
          className="flex min-h-14 w-full items-center justify-center rounded-xl border border-border bg-primary px-4 text-base font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
