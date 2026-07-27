import Link from "next/link";

import { DisruptionQueuePanel } from "@/components/transport/DisruptionQueuePanel";
import { requireAuth } from "@/lib/auth/guards";
import { transportCommandConfig } from "@/lib/config/transport-command";
import { prisma } from "@/lib/prisma";
import { listOpenDisruptions } from "@/lib/transport/continuity/recovery-service";

export const metadata = { title: "Participant transport | Support coordinator" };

export default async function CoordinatorTransportPage() {
  await requireAuth();
  const enabled = transportCommandConfig.commandCentreEnabled;

  const [disruptions, activeTrips] = enabled
    ? await Promise.all([
        listOpenDisruptions(),
        prisma.transportTrip.findMany({
          where: {
            status: {
              notIn: ["closed", "cancelled", "declined"],
            },
          },
          orderBy: { scheduledStart: "asc" },
          take: 20,
          select: {
            id: true,
            participantId: true,
            status: true,
            returnAssuranceStatus: true,
            scheduledStart: true,
            pickupSuburb: true,
            dropoffSuburb: true,
          },
        }),
      ])
    : [[], []];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold">Transport overview</h1>
        <p className="text-muted-foreground">
          Coordinator view of active trips, return-trip assurance, and open disruptions.
        </p>
      </header>

      {!enabled ? (
        <p className="text-sm" role="status">
          Transport command centre is disabled.
        </p>
      ) : (
        <>
          <DisruptionQueuePanel disruptions={disruptions} />

          <section className="rounded-xl border p-4">
            <h2 className="font-semibold">Active trips</h2>
            {activeTrips.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">No active trips.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {activeTrips.map((trip) => (
                  <li key={trip.id} className="text-sm">
                    <Link
                      href={`/dashboard/transport/${trip.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {trip.pickupSuburb ?? "Pickup"} → {trip.dropoffSuburb ?? "Drop-off"}
                    </Link>
                    <span className="text-muted-foreground">
                      {" "}
                      · {trip.status} · return: {trip.returnAssuranceStatus}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
