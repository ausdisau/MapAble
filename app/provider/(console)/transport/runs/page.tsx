import Link from "next/link";

import { ProviderRideRunsPanel } from "@/components/transport/ProviderRideRunsPanel";
import { getUserOrganisationIds } from "@/lib/api/organisation-scope";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { listRideRuns } from "@/lib/transport/ride-run-service";

export default async function ProviderRideRunsPage() {
  const user = await requireAuth();
  const orgIds = await getUserOrganisationIds(user.id);
  const organisationId = orgIds[0];
  if (!organisationId) {
    return <p>You need a provider organisation to manage ride runs.</p>;
  }

  let runs: Awaited<ReturnType<typeof listRideRuns>> = [];
  try {
    runs = await listRideRuns(user, organisationId);
  } catch {
    runs = [];
  }

  const vehicles = await prisma.transportVehicle.findMany({
    where: { organisationId, active: true },
    select: { id: true, displayName: true },
  });

  const openTrips = await prisma.transportTrip.findMany({
    where: {
      providerOrganisationId: organisationId,
      rideRunId: null,
      status: { in: ["accepted", "dispatch_pending"] },
    },
    select: { id: true, pickupSuburb: true, dropoffSuburb: true, scheduledStart: true },
    take: 30,
  });

  return (
    <div className="space-y-4">
      <p>
        <Link href="/provider/transport" className="text-sm text-primary hover:underline">
          ← Transport
        </Link>
      </p>
      <h1 className="font-heading text-2xl font-bold">Ride runs (pooling)</h1>
      <p className="text-sm text-muted-foreground">
        Combine multiple participant trips on one vehicle. Requires{" "}
        <code>TRANSPORT_RIDE_POOLING_ENABLED=true</code> and human lock before
        departure.
      </p>
      <ProviderRideRunsPanel
        organisationId={organisationId}
        initialRuns={runs.map((r) => ({
          id: r.id,
          status: r.status,
          scheduledStart: r.scheduledStart.toISOString(),
          maxPassengers: r.maxPassengers,
          trips: r.trips.map((t) => ({ id: t.id })),
          vehicle: { displayName: r.vehicle.displayName },
        }))}
        vehicles={vehicles}
        availableTrips={openTrips.map((t) => ({
          id: t.id,
          label: `${t.pickupSuburb ?? "Pickup"} → ${t.dropoffSuburb ?? "Drop-off"} (${new Date(t.scheduledStart).toLocaleDateString("en-AU")})`,
        }))}
      />
    </div>
  );
}
