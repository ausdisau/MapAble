import Link from "next/link";

import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function DriverTripsPage() {
  const user = await requireAuth();
  const driver = await prisma.driverProfile.findFirst({
    where: { userId: user.id },
  });
  const trips = driver
    ? await prisma.transportBooking.findMany({
        where: { driverProfileId: driver.id },
        orderBy: { pickupWindowStart: "asc" },
      })
    : [];

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-xl font-bold">Your trips</h2>
      {trips.length === 0 ? (
        <p role="status">No assigned trips.</p>
      ) : (
        <ul className="space-y-3">
          {trips.map((t) => (
            <li key={t.id}>
              <Link
                href={`/driver/trips/${t.id}`}
                className="block min-h-16 rounded-xl border border-border bg-card p-4 text-base focus-visible:ring-2 focus-visible:ring-ring"
              >
                <p className="font-medium">{t.pickupAddress}</p>
                <p className="text-sm text-muted-foreground">to {t.dropoffAddress}</p>
                <p className="mt-1 text-sm">Status: {t.status.replace(/_/g, " ")}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
