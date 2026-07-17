"use client";

import { useCallback, useEffect, useState } from "react";

import { formInputClass } from "@/components/forms/AccessibleFormField";
import { VehicleSuitabilityWarning } from "@/components/phase3/VehicleSuitabilityWarning";
import { TransportTripStatusBadge } from "@/components/transport/TransportTripStatusBadge";
import { Button } from "@/components/ui/button";
import type { TransportTripApiResponse } from "@/types/transport";

type DriverOption = { id: string; displayName: string };
type VehicleOption = { id: string; displayName: string };
type Suggestion = {
  vehicleId: string;
  vehicleName: string;
  driverId?: string;
  driverName?: string;
  score: number;
  eligible: boolean;
  reasons: string[];
};

export function ProviderTripDispatchPanel({
  organisationId,
  initialTrips,
  drivers,
  vehicles,
}: {
  organisationId: string;
  initialTrips: TransportTripApiResponse[];
  drivers: DriverOption[];
  vehicles: VehicleOption[];
}) {
  const [trips, setTrips] = useState(initialTrips);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialTrips[0]?.trip.id ?? null
  );
  const [driverId, setDriverId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = trips.find((t) => t.trip.id === selectedId);

  const loadSuggestions = useCallback(async (tripId: string) => {
    const res = await fetch(
      `/api/provider/transport/trips/${tripId}/suggestions?organisationId=${organisationId}`
    );
    const data = await res.json().catch(() => ({}));
    if (res.ok && Array.isArray(data.suggestions)) {
      setSuggestions(data.suggestions);
      const top = data.suggestions.find((s: Suggestion) => s.eligible);
      if (top) {
        setVehicleId(top.vehicleId);
        if (top.driverId) setDriverId(top.driverId);
      }
    }
  }, [organisationId]);

  useEffect(() => {
    if (selectedId) void loadSuggestions(selectedId);
  }, [selectedId, loadSuggestions]);

  async function assign() {
    if (!selectedId || !driverId || !vehicleId) return;
    setLoading(true);
    setError(null);
    const res = await fetch(
      `/api/provider/transport/trips/${selectedId}/assign?organisationId=${organisationId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId, vehicleId }),
      }
    );
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      const reasons = data.details?.reasons;
      setError(
        Array.isArray(reasons)
          ? reasons.join(". ")
          : typeof data.error === "string"
            ? data.error
            : "Assignment failed"
      );
      return;
    }
    if (data.trip?.id) {
      setTrips((prev) =>
        prev.map((t) => (t.trip.id === selectedId ? (data as TransportTripApiResponse) : t))
      );
    }
  }

  async function acceptTrip(tripId: string) {
    setLoading(true);
    setError(null);
    const res = await fetch(
      `/api/provider/transport/trips/${tripId}/accept?organisationId=${organisationId}`,
      { method: "POST" }
    );
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not accept trip");
      return;
    }
    const listRes = await fetch(
      `/api/provider/transport/trips?organisationId=${organisationId}`
    );
    const listData = await listRes.json().catch(() => ({}));
    if (listRes.ok && Array.isArray(listData.trips)) {
      setTrips(listData.trips);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="space-y-2">
        <h2 className="font-semibold">Trips</h2>
        <ul className="space-y-2">
          {trips.map((item) => (
            <li key={item.trip.id}>
              <button
                type="button"
                className={`w-full rounded-lg border p-3 text-left text-sm ${
                  selectedId === item.trip.id
                    ? "border-primary bg-primary/5"
                    : "border-border"
                }`}
                onClick={() => setSelectedId(item.trip.id)}
              >
                <TransportTripStatusBadge status={item.trip.status} />
                <p className="mt-1 font-medium">
                  {item.trip.pickup.suburb ?? "Pickup"} →{" "}
                  {item.trip.dropoff.suburb ?? "Drop-off"}
                </p>
                <p className="text-muted-foreground">
                  {new Date(item.trip.scheduledStart).toLocaleString("en-AU")}
                </p>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {selected ? (
        <section className="space-y-4 rounded-xl border border-border bg-card p-4">
          <h2 className="font-semibold">Dispatch</h2>
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
          {selected.permissions.canAccept ? (
            <Button
              type="button"
              variant="default"
              size="default"
              loading={loading}
              onClick={() => acceptTrip(selected.trip.id)}
            >
              Accept trip
            </Button>
          ) : null}
          {selected.suitabilityWarnings?.length ? (
            <VehicleSuitabilityWarning warnings={selected.suitabilityWarnings} />
          ) : null}
          {suggestions.length > 0 ? (
            <div className="text-sm">
              <h3 className="font-medium">Suggested matches (advisory)</h3>
              <ul className="mt-1 list-disc pl-5">
                {suggestions.slice(0, 5).map((s) => (
                  <li key={s.vehicleId}>
                    {s.vehicleName}
                    {s.driverName ? ` + ${s.driverName}` : ""} — score {s.score}
                    {!s.eligible ? " (not eligible)" : ""}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {selected.permissions.canAssign ? (
            <>
              <label className="block text-sm font-medium" htmlFor="dispatch-driver">
                Driver
              </label>
              <select
                id="dispatch-driver"
                className={formInputClass}
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
              >
                <option value="">Select driver</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.displayName}
                  </option>
                ))}
              </select>
              <label className="block text-sm font-medium" htmlFor="dispatch-vehicle">
                Vehicle
              </label>
              <select
                id="dispatch-vehicle"
                className={formInputClass}
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
              >
                <option value="">Select vehicle</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.displayName}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                variant="default"
                size="default"
                loading={loading}
                onClick={() => assign()}
              >
                Assign driver and vehicle
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              This trip cannot be assigned in its current status.
            </p>
          )}
        </section>
      ) : null}
    </div>
  );
}
