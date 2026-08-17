import Link from "next/link";

import { BookingStatusPanel } from "@/components/bookings/BookingTimeline";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Bookings | Admin" };

export default async function AdminBookingsPage() {
  const bookings = await prisma.booking.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      participant: { select: { name: true, email: true } },
    },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Bookings</h1>
      <ul className="space-y-2">
        {bookings.map((b) => (
          <li key={b.id}>
            <Link
              href={`/admin/bookings/${b.id}`}
              className="flex flex-wrap justify-between gap-2 rounded-lg border border-border bg-card px-4 py-3"
            >
              <div>
                <span className="font-medium capitalize">
                  {b.bookingType.replace("_", " + ")}
                </span>
                <p className="text-sm text-muted-foreground">
                  {b.participant.name} ·{" "}
                  {new Date(b.requestedStart).toLocaleString("en-AU")}
                </p>
              </div>
              <BookingStatusPanel status={b.status} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
