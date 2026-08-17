"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  AccessibleFormField,
  formInputClass,
} from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";

const STEPS = [
  "Choose booking type",
  "Date and time",
  "Care or transport details",
  "Accessibility and consent",
  "Review and submit",
];

export function BookingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [bookingType, setBookingType] = useState<
    "care" | "transport" | "care_transport"
  >("care");
  const [requestedStart, setRequestedStart] = useState("");
  const [requestedEnd, setRequestedEnd] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [dropoffAddress, setDropoffAddress] = useState("");
  const [careLocation, setCareLocation] = useState("");
  const [participantNotes, setParticipantNotes] = useState("");
  const [shareAccessibility, setShareAccessibility] = useState(false);

  async function submit() {
    setLoading(true);
    setError("");
    const segments =
      bookingType === "care_transport"
        ? [
            {
              segmentType: "care",
              startTime: requestedStart,
              endTime: requestedEnd,
              sortOrder: 0,
            },
            {
              segmentType: "outbound_transport",
              startTime: requestedStart,
              pickupAddress,
              dropoffAddress: careLocation || dropoffAddress,
              bufferBeforeMinutes: 15,
              sortOrder: 1,
            },
          ]
        : undefined;

    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingType,
        requestedStart,
        requestedEnd: requestedEnd || undefined,
        pickupAddress: pickupAddress || undefined,
        dropoffAddress: dropoffAddress || undefined,
        careLocation: careLocation || undefined,
        participantNotes,
        shareAccessibility,
        status: "requested",
        segments,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Could not submit booking");
      return;
    }
    const data = await res.json();
    router.push(`/dashboard/bookings/${data.booking.id}`);
  }

  return (
    <div className="max-w-2xl">
      <nav aria-label="Booking steps">
        <ol className="mb-6 flex flex-wrap gap-2 text-sm">
          {STEPS.map((label, i) => (
            <li
              key={label}
              className={
                i === step
                  ? "font-semibold text-primary"
                  : "text-muted-foreground"
              }
            >
              Step {i + 1}: {label}
            </li>
          ))}
        </ol>
      </nav>

      {step === 0 ? (
        <fieldset className="space-y-3">
          <legend className="font-semibold">What do you need?</legend>
          {(
            [
              ["care", "Care support"],
              ["transport", "Accessible transport"],
              ["care_transport", "Care and transport linked"],
            ] as const
          ).map(([value, label]) => (
            <label
              key={value}
              className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-border px-4"
            >
              <input
                type="radio"
                name="bookingType"
                checked={bookingType === value}
                onChange={() => setBookingType(value)}
              />
              {label}
            </label>
          ))}
        </fieldset>
      ) : null}

      {step === 1 ? (
        <div className="space-y-4">
          <AccessibleFormField id="start" label="Start date and time" required>
            <input
              id="start"
              type="datetime-local"
              className={formInputClass}
              value={requestedStart}
              onChange={(e) => setRequestedStart(e.target.value)}
              required
            />
          </AccessibleFormField>
          <AccessibleFormField id="end" label="End date and time">
            <input
              id="end"
              type="datetime-local"
              className={formInputClass}
              value={requestedEnd}
              onChange={(e) => setRequestedEnd(e.target.value)}
            />
          </AccessibleFormField>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-4">
          {(bookingType === "care" || bookingType === "care_transport") && (
            <AccessibleFormField id="careLocation" label="Care location">
              <input
                id="careLocation"
                className={formInputClass}
                value={careLocation}
                onChange={(e) => setCareLocation(e.target.value)}
              />
            </AccessibleFormField>
          )}
          {(bookingType === "transport" || bookingType === "care_transport") && (
            <>
              <AccessibleFormField id="pickup" label="Pickup address">
                <input
                  id="pickup"
                  className={formInputClass}
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                />
              </AccessibleFormField>
              <AccessibleFormField id="dropoff" label="Drop-off address">
                <input
                  id="dropoff"
                  className={formInputClass}
                  value={dropoffAddress}
                  onChange={(e) => setDropoffAddress(e.target.value)}
                />
              </AccessibleFormField>
            </>
          )}
          <AccessibleFormField id="notes" label="Notes for providers">
            <textarea
              id="notes"
              className={formInputClass}
              rows={3}
              value={participantNotes}
              onChange={(e) => setParticipantNotes(e.target.value)}
            />
          </AccessibleFormField>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-4 rounded-xl border border-border bg-card p-4">
          <p className="text-sm">
            Providers may need your accessibility information to deliver safe
            support. You can share a summary only if you have active consent or
            confirm below.
          </p>
          <label className="flex min-h-11 items-start gap-3">
            <input
              type="checkbox"
              checked={shareAccessibility}
              onChange={(e) => setShareAccessibility(e.target.checked)}
            />
            <span className="text-sm">
              I confirm sharing accessibility summary for this booking request
            </span>
          </label>
        </div>
      ) : null}

      {step === 4 ? (
        <dl className="space-y-2 rounded-xl border border-border bg-card p-4 text-sm">
          <div>
            <dt className="font-medium">Type</dt>
            <dd>{bookingType}</dd>
          </div>
          <div>
            <dt className="font-medium">Start</dt>
            <dd>{requestedStart}</dd>
          </div>
          <div>
            <dt className="font-medium">Share accessibility</dt>
            <dd>{shareAccessibility ? "Yes" : "No"}</dd>
          </div>
        </dl>
      ) : null}

      {error ? (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        {step > 0 ? (
          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={() => setStep(step - 1)}
          >
            Back
          </Button>
        ) : null}
        {step < STEPS.length - 1 ? (
          <Button
            type="button"
            variant="default"
            size="default"
            onClick={() => setStep(step + 1)}
          >
            Next
          </Button>
        ) : (
          <Button
            type="button"
            variant="default"
            size="default"
            loading={loading}
            onClick={submit}
          >
            Submit booking request
          </Button>
        )}
      </div>
    </div>
  );
}
