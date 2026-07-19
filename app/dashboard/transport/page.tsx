import Link from "next/link";

import { TransportTripListItem } from "@/components/transport/TransportTripListItem";
import { requireAuth } from "@/lib/auth/guards";
import { listTransportTripsForUser } from "@/lib/transport/transport-trip-service";

export const metadata = { title: "Transport trips | MapAble Core" };

export default async function TransportTripsPage() {
  const user = await requireAuth();
  const trips = await listTransportTripsForUser(user);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Transport trips</h1>
          <p className="text-muted-foreground">
            Scheduled transport with plain-language status. Route estimates are
            advisory only. Live GPS tracking is not available in this pilot.
          </p>
        </div>
        <Link
          href="/transport/request"
          className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 font-medium text-primary-foreground hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring"
        >
          Request transport
        </Link>
      </header>

      {trips.length === 0 ? (
        <p role="status">You have no transport trips yet.</p>
      ) : (
        <ul className="space-y-3">
          {trips.map((response) => (
            <li key={response.trip.id}>
              <TransportTripListItem response={response} />
            </li>
          ))}
        </ul>
      )}

      <p className="text-sm text-muted-foreground">
        <Link
          href="/dashboard/transport/legacy"
          className="font-medium text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring"
        >
          Older transport bookings
        </Link>{" "}
        from the previous booking flow.
      </p>
    </div>
  );
}
