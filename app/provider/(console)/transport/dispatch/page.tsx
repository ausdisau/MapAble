import Link from "next/link";

import { ProviderTripDispatchPanel } from "@/components/transport/ProviderTripDispatchPanel";
import { getUserOrganisationIds } from "@/lib/api/organisation-scope";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { listProviderTrips } from "@/lib/transport/transport-trip-service";

export default async function ProviderTransportDispatchPage() {
  const user = await requireAuth();
  const orgIds = await getUserOrganisationIds(user.id);
  const organisationId = orgIds[0];
  if (!organisationId) {
    return (
      <p>You need to belong to a provider organisation to use dispatch.</p>
    );
  }

  const trips = await listProviderTrips(user, organisationId);
  const drivers = await prisma.transportDriver.findMany({
    where: { organisationId, active: true },
    select: { id: true, displayName: true },
  });
  const vehicles = await prisma.transportVehicle.findMany({
    where: { organisationId, active: true },
    select: { id: true, displayName: true },
  });

  return (
    <div className="space-y-4">
      <p>
        <Link href="/provider/transport" className="text-sm text-primary hover:underline">
          ← Transport
        </Link>
      </p>
      <h1 className="font-heading text-2xl font-bold">Dispatch board</h1>
      <p className="text-sm text-muted-foreground">
        Human dispatch only — match suggestions are advisory. Assign verified
        drivers and vehicles that meet each participant&apos;s mobility needs.
      </p>
      <ProviderTripDispatchPanel
        organisationId={organisationId}
        initialTrips={trips}
        drivers={drivers}
        vehicles={vehicles}
      />
    </div>
  );
}
