import Link from "next/link";

import { ContinuityRecoveryPanel } from "@/components/transport/ContinuityRecoveryPanel";
import { ReturnTripAssurancePanel } from "@/components/transport/ReturnTripAssurancePanel";
import { requireAuth } from "@/lib/auth/guards";
import { transportCommandConfig } from "@/lib/config/transport-command";
import { listOpenRecoveries } from "@/lib/transport/continuity/recovery-service";
import { listTransportTripsForUser } from "@/lib/transport/transport-trip-service";

export const metadata = { title: "My transport | MapAble" };

export default async function ParticipantTransportPage() {
  const user = await requireAuth();
  const trips = await listTransportTripsForUser(user);
  const recoveries = transportCommandConfig.continuityRecoveryEnabled
    ? await listOpenRecoveries(user.id)
    : [];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold">My transport</h1>
        <p className="text-muted-foreground">
          View trips, return-trip assurance, and recovery options. No vehicle or provider
          will be changed without your confirmation.
        </p>
      </header>

      {!transportCommandConfig.commandCentreEnabled ? (
        <p className="rounded-lg border border-dashed p-4 text-sm" role="status">
          Transport command centre is not enabled in this environment.
        </p>
      ) : null}

      {recoveries.length > 0 ? (
        <ContinuityRecoveryPanel recoveries={recoveries} />
      ) : null}

      {trips.length === 0 ? (
        <p role="status">You have no transport trips yet.</p>
      ) : (
        <ul className="space-y-4">
          {trips.map(({ trip }) => (
            <li key={trip.id} className="rounded-xl border p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">
                    {trip.pickup.suburb ?? "Pickup"} → {trip.dropoff.suburb ?? "Drop-off"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(trip.scheduledStart).toLocaleString("en-AU")} · {trip.status}
                  </p>
                </div>
                <Link
                  href={`/participant/transport/${trip.id}`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  View details
                </Link>
              </div>
              {trip.id ? (
                <div className="mt-3">
                  <ReturnTripAssurancePanel
                    data={{ status: "not_required" }}
                  />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <p className="text-sm text-muted-foreground">
        <Link href="/dashboard/transport/new" className="font-medium text-primary hover:underline">
          Request a new trip
        </Link>
      </p>
    </div>
  );
}
