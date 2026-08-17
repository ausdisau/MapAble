"use client";

import { useState } from "react";

import { formInputClass } from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";

type Run = {
  id: string;
  status: string;
  scheduledStart: string;
  maxPassengers: number;
  trips: { id: string }[];
  vehicle: { displayName: string };
};

export function ProviderRideRunsPanel({
  organisationId,
  initialRuns,
  vehicles,
  availableTrips,
}: {
  organisationId: string;
  initialRuns: Run[];
  vehicles: { id: string; displayName: string }[];
  availableTrips: { id: string; label: string }[];
}) {
  const [runs, setRuns] = useState(initialRuns);
  const [vehicleId, setVehicleId] = useState(vehicles[0]?.id ?? "");
  const [scheduledStart, setScheduledStart] = useState("");
  const [attachRunId, setAttachRunId] = useState("");
  const [attachTripId, setAttachTripId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function createRun() {
    if (!vehicleId || !scheduledStart) return;
    setLoading(true);
    setError(null);
    const res = await fetch(
      `/api/transport/runs?organisationId=${organisationId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId,
          scheduledStart: new Date(scheduledStart).toISOString(),
          maxPassengers: 4,
        }),
      }
    );
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Could not create run");
      return;
    }
    if (data.run) setRuns((r) => [data.run, ...r]);
  }

  async function attachTrip() {
    if (!attachRunId || !attachTripId) return;
    setLoading(true);
    setError(null);
    const res = await fetch(
      `/api/transport/runs/${attachRunId}/trips?organisationId=${organisationId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripId: attachTripId }),
      }
    );
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      const reasons = data.details?.reasons;
      setError(
        Array.isArray(reasons)
          ? reasons.join(". ")
          : data.error ?? "Could not attach trip"
      );
      return;
    }
    if (data.run) {
      setRuns((prev) =>
        prev.map((r) => (r.id === attachRunId ? { ...r, ...data.run } : r))
      );
    }
  }

  async function lockRun(runId: string) {
    setLoading(true);
    const res = await fetch(
      `/api/transport/runs/${runId}/lock?organisationId=${organisationId}`,
      { method: "POST" }
    );
    setLoading(false);
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      if (data.run) {
        setRuns((prev) =>
          prev.map((r) => (r.id === runId ? { ...r, status: data.run.status } : r))
        );
      }
    }
  }

  return (
    <div className="space-y-6">
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <section className="rounded-xl border border-border p-4 space-y-3">
        <h2 className="font-semibold">New ride run</h2>
        <select
          className={formInputClass}
          value={vehicleId}
          onChange={(e) => setVehicleId(e.target.value)}
        >
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.displayName}
            </option>
          ))}
        </select>
        <input
          type="datetime-local"
          className={formInputClass}
          value={scheduledStart}
          onChange={(e) => setScheduledStart(e.target.value)}
        />
        <Button
          type="button"
          variant="default"
          size="default"
          loading={loading}
          onClick={() => createRun()}
        >
          Create run
        </Button>
      </section>

      <section className="rounded-xl border border-border p-4 space-y-3">
        <h2 className="font-semibold">Attach trip to run</h2>
        <select
          className={formInputClass}
          value={attachRunId}
          onChange={(e) => setAttachRunId(e.target.value)}
        >
          <option value="">Select run</option>
          {runs.map((r) => (
            <option key={r.id} value={r.id}>
              {r.vehicle.displayName} — {r.status} ({r.trips.length}/{r.maxPassengers})
            </option>
          ))}
        </select>
        <select
          className={formInputClass}
          value={attachTripId}
          onChange={(e) => setAttachTripId(e.target.value)}
        >
          <option value="">Select trip</option>
          {availableTrips.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
        <Button
          type="button"
          variant="default"
          size="default"
          loading={loading}
          onClick={() => attachTrip()}
        >
          Attach trip
        </Button>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">Active runs</h2>
        <ul className="space-y-2">
          {runs.map((r) => (
            <li key={r.id} className="rounded-lg border border-border p-3 text-sm">
              <p className="font-medium">
                {r.vehicle.displayName} — {r.status}
              </p>
              <p>
                {new Date(r.scheduledStart).toLocaleString("en-AU")} ·{" "}
                {r.trips.length}/{r.maxPassengers} passengers
              </p>
              {r.status === "planning" || r.status === "open" ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  loading={loading}
                  onClick={() => lockRun(r.id)}
                >
                  Lock run (human confirmed)
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
