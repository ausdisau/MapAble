import Link from "next/link";
import { redirect } from "next/navigation";

import { VehicleSuitabilityWarning } from "@/components/phase3/VehicleSuitabilityWarning";
import { TransportRouteAdvisory } from "@/components/transport/TransportRouteAdvisory";
import { TransportTripActions } from "@/components/transport/TransportTripActions";
import { TransportTripStatusBadge } from "@/components/transport/TransportTripStatusBadge";
import { requireAuth } from "@/lib/auth/guards";
import { MOBILITY_FIELD_LABELS } from "@/lib/transport/mobility-schema";
import { TransportApiError } from "@/lib/transport/transport-api-error";
import { getTransportTripForUser } from "@/lib/transport/transport-trip-service";
import type { TransportAddressView } from "@/types/transport";

function formatLocation(label: string, location: TransportAddressView) {
  if (location.address) {
    const suburb = location.suburb ? ` (${location.suburb})` : "";
    return (
      <p>
        <span className="font-medium">{label}:</span> {location.address}
        {suburb}
      </p>
    );
  }
  return (
    <p>
      <span className="font-medium">{label}:</span>{" "}
      {location.suburb ?? "Location shared when trip is active"}
    </p>
  );
}

export default async function TransportTripDetailPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const user = await requireAuth();
  const { tripId } = await params;

  if (tripId === "new") {
    redirect("/dashboard/transport/new");
  }

  try {
    const response = await getTransportTripForUser(user, tripId);
    const {
      trip,
      nextActions,
      routeEstimate,
      suitabilityWarnings,
      handoverStatus,
      assignedVehicle,
      linkedBookingId,
    } = response;
    const when = new Date(trip.scheduledStart).toLocaleString("en-AU", {
      dateStyle: "full",
      timeStyle: "short",
    });
    const endWhen = trip.scheduledEnd
      ? new Date(trip.scheduledEnd).toLocaleString("en-AU", {
          dateStyle: "full",
          timeStyle: "short",
        })
      : null;

    return (
      <div className="space-y-6">
        <p>
          <Link
            href="/dashboard/transport"
            className="text-sm font-medium text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring"
          >
            ← Back to transport trips
          </Link>
        </p>
        <header className="space-y-2">
          <h1 className="font-heading text-2xl font-bold">Transport trip</h1>
          <TransportTripStatusBadge status={trip.status} />
        </header>

        <section className="space-y-2 rounded-xl border border-border bg-card p-4">
          <h2 className="font-semibold">Schedule</h2>
          <p>
            <span className="font-medium">Start:</span> {when}
          </p>
          {endWhen ? (
            <p>
              <span className="font-medium">End:</span> {endWhen}
            </p>
          ) : null}
        </section>

        <section className="space-y-2 rounded-xl border border-border bg-card p-4">
          <h2 className="font-semibold">Locations</h2>
          {formatLocation("Pickup", trip.pickup)}
          {formatLocation("Drop-off", trip.dropoff)}
          {trip.pickup.accessNotes ? (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Access notes:</span>{" "}
              {trip.pickup.accessNotes}
            </p>
          ) : null}
        </section>

        {assignedVehicle ? (
          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="font-semibold">Assigned vehicle</h2>
            <p className="text-sm">{assignedVehicle.displayName}</p>
          </section>
        ) : null}

        {suitabilityWarnings && suitabilityWarnings.length > 0 ? (
          <VehicleSuitabilityWarning warnings={suitabilityWarnings} />
        ) : null}

        {Object.keys(trip.mobilityRequirements).length > 0 ? (
          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="font-semibold">Mobility requirements</h2>
            <ul className="mt-2 list-inside list-disc text-sm">
              {Object.entries(trip.mobilityRequirements)
                .filter(([, v]) => v === true || (typeof v === "number" && v > 0) || (typeof v === "string" && v))
                .map(([key, value]) => (
                <li key={key}>
                  {MOBILITY_FIELD_LABELS[key as keyof typeof MOBILITY_FIELD_LABELS] ?? key}:{" "}
                  {String(value)}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {handoverStatus ? (
          <section className="rounded-xl border border-border bg-card p-4 text-sm">
            <h2 className="font-semibold">Handover progress</h2>
            <ul className="mt-2 space-y-1">
              <li>
                Pre-start check:{" "}
                {handoverStatus.preStartComplete ? "Complete" : "Pending"}
              </li>
              <li>
                Pickup handover:{" "}
                {handoverStatus.pickupHandoverComplete ? "Complete" : "Pending"}
              </li>
              <li>
                Drop-off handover:{" "}
                {handoverStatus.dropoffHandoverComplete ? "Complete" : "Pending"}
              </li>
            </ul>
          </section>
        ) : null}

        {linkedBookingId ? (
          <p className="text-sm text-muted-foreground">
            Linked booking record: {linkedBookingId} (for provider billing review).
          </p>
        ) : null}

        <p className="text-sm">
          <Link
            href={`/dashboard/safety/support/new?category=transport_issue&tripId=${trip.id}`}
            className="font-medium text-primary hover:underline"
          >
            Report a safety concern about this trip
          </Link>
        </p>

        {trip.disputeReason ? (
          <p role="status" className="rounded-lg border border-border bg-muted p-3 text-sm">
            <span className="font-medium">Dispute reason:</span> {trip.disputeReason}
          </p>
        ) : null}

        {routeEstimate ? <TransportRouteAdvisory routeEstimate={routeEstimate} /> : null}

        <TransportTripActions
          tripId={trip.id}
          actions={nextActions}
          organisationId={trip.providerOrganisationId ?? undefined}
        />
      </div>
    );
  } catch (e) {
    if (e instanceof TransportApiError) {
      return (
        <div className="space-y-4">
          <p role="alert">{e.message}</p>
          <Link
            href="/dashboard/transport"
            className="text-sm font-medium text-primary hover:underline"
          >
            Back to transport trips
          </Link>
        </div>
      );
    }
    throw e;
  }
}
