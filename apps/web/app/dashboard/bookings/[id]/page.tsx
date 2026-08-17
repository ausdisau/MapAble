import Link from "next/link";
import { notFound } from "next/navigation";

import {
  BookingTimeline,
  BookingStatusPanel,
} from "@/components/bookings/BookingTimeline";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Booking details | MapAble Core" };

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuth();
  const { id } = await params;

  const booking = await prisma.booking.findFirst({
    where: { id, participantId: user.id },
    include: {
      segments: { orderBy: { sortOrder: "asc" } },
      assignedOrganisation: { select: { name: true } },
    },
  });

  if (!booking) notFound();

  return (
    <div className="space-y-6">
      <header>
        <Link href="/dashboard/bookings" className="text-sm text-primary hover:underline">
          ← Back to bookings
        </Link>
        <h1 className="mt-2 font-heading text-2xl font-bold capitalize">
          {booking.bookingType.replace("_", " + ")} booking
        </h1>
        <BookingStatusPanel status={booking.status} />
      </header>

      <dl className="grid max-w-xl gap-3 text-sm">
        <div>
          <dt className="font-medium">Requested start</dt>
          <dd>{new Date(booking.requestedStart).toLocaleString("en-AU")}</dd>
        </div>
        {booking.pickupAddress ? (
          <div>
            <dt className="font-medium">Pickup</dt>
            <dd>{booking.pickupAddress}</dd>
          </div>
        ) : null}
        {booking.dropoffAddress ? (
          <div>
            <dt className="font-medium">Drop-off</dt>
            <dd>{booking.dropoffAddress}</dd>
          </div>
        ) : null}
        {booking.assignedOrganisation ? (
          <div>
            <dt className="font-medium">Assigned provider</dt>
            <dd>{booking.assignedOrganisation.name}</dd>
          </div>
        ) : null}
      </dl>

      {booking.bookingType === "care_transport" || booking.segments.length > 0 ? (
        <section>
          <h2 className="font-semibold">Timeline</h2>
          <BookingTimeline
            segments={booking.segments}
            bookingType={booking.bookingType}
          />
        </section>
      ) : null}
    </div>
  );
}
