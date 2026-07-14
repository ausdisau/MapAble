import Link from "next/link";

import { AccessibleRouteDetailsPanel } from "@/components/transport/AccessibleRouteDetails";
import { ContinuityRecoveryPanel } from "@/components/transport/ContinuityRecoveryPanel";
import { ReturnTripAssurancePanel } from "@/components/transport/ReturnTripAssurancePanel";
import { TransportTripStatusBadge } from "@/components/transport/TransportTripStatusBadge";
import { requireAuth } from "@/lib/auth/guards";
import { transportCommandConfig } from "@/lib/config/transport-command";
import { listOpenRecoveries } from "@/lib/transport/continuity/recovery-service";
import { getReturnTripAssurance } from "@/lib/transport/continuity/return-trip-service";
import { fetchAccessibleRouteDetails } from "@/lib/transport/public-transit/disruptions-service";
import { getTransportTripForUser } from "@/lib/transport/transport-trip-service";

export const metadata = { title: "Trip details | MapAble Transport" };

export default async function ParticipantTransportTripPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const user = await requireAuth();
  const { tripId } = await params;
  const response = await getTransportTripForUser(user, tripId);
  const assurance = transportCommandConfig.commandCentreEnabled
    ? await getReturnTripAssurance(tripId)
    : null;
  const recoveries = transportCommandConfig.continuityRecoveryEnabled
    ? await listOpenRecoveries(user.id)
    : [];
  const tripRecoveries = recoveries.filter((r) => r.tripId === tripId);

  const routeDetails =
    transportCommandConfig.publicTransitAdaptersEnabled &&
    response.trip.pickup.lat &&
    response.trip.pickup.lng &&
    response.trip.dropoff.lat &&
    response.trip.dropoff.lng
      ? (
          await fetchAccessibleRouteDetails(
            { lat: response.trip.pickup.lat, lng: response.trip.pickup.lng },
            { lat: response.trip.dropoff.lat, lng: response.trip.dropoff.lng }
          )
        ).details
      : null;

  return (
    <div className="space-y-6">
      <header>
        <Link
          href="/participant/transport"
          className="text-sm text-primary hover:underline"
        >
          ← Back to my transport
        </Link>
        <h1 className="mt-2 font-heading text-2xl font-bold">Trip details</h1>
        <TransportTripStatusBadge status={response.trip.status} />
      </header>

      <section className="rounded-xl border p-4">
        <p className="font-medium">
          {response.trip.pickup.suburb ?? "Pickup"} →{" "}
          {response.trip.dropoff.suburb ?? "Drop-off"}
        </p>
        <p className="text-sm text-muted-foreground">
          {new Date(response.trip.scheduledStart).toLocaleString("en-AU")}
        </p>
      </section>

      {assurance ? <ReturnTripAssurancePanel data={assurance} /> : null}

      {tripRecoveries.length > 0 ? (
        <ContinuityRecoveryPanel recoveries={tripRecoveries} />
      ) : null}

      {transportCommandConfig.publicTransitAdaptersEnabled ? (
        <AccessibleRouteDetailsPanel details={routeDetails} />
      ) : null}
    </div>
  );
}
