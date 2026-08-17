"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { formInputClass } from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";

export function ProviderBookingResponsePanel({
  bookingId,
  currentStatus,
}: {
  bookingId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  if (currentStatus === "accepted" || currentStatus === "declined") {
    return (
      <p className="text-sm text-muted-foreground">
        Provider response: {currentStatus}
      </p>
    );
  }

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h2 className="font-semibold">Respond to booking request</h2>
      <p className="text-sm text-muted-foreground">
        Accept if you can deliver support. Decline if you cannot — the participant
        will be notified.
      </p>
      <label htmlFor="provider-note" className="mt-3 block text-sm font-medium">
        Note to participant (optional)
      </label>
      <textarea
        id="provider-note"
        className={formInputClass}
        rows={2}
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="default"
          size="default"
          loading={loading}
          onClick={async () => {
            setLoading(true);
            await fetch(`/api/provider/bookings/${bookingId}/accept`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ note }),
            });
            setLoading(false);
            router.refresh();
          }}
        >
          Accept booking
        </Button>
        <Button
          type="button"
          variant="outline"
          size="default"
          onClick={async () => {
            setLoading(true);
            await fetch(`/api/provider/bookings/${bookingId}/decline`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ note }),
            });
            setLoading(false);
            router.refresh();
          }}
        >
          Decline booking
        </Button>
      </div>
    </section>
  );
}
