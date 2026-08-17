import Link from "next/link";
import { notFound } from "next/navigation";

import { BookingEventTimeline } from "@/components/bookings/BookingEventTimeline";
import { BookingStatusPanel } from "@/components/bookings/BookingTimeline";
import { ProviderBookingResponsePanel } from "@/components/bookings/ProviderBookingResponsePanel";
import { requireAuth } from "@/lib/auth/guards";
import { listBookingTimeline } from "@/lib/bookings/timeline-service";
import { prisma } from "@/lib/prisma";

export default async function ProviderBookingDetailPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const user = await requireAuth();
  const { bookingId } = await params;

  const memberships = await prisma.organisationMember.findMany({
    where: { userId: user.id },
  });
  const orgIds = memberships.map((m) => m.organisationId);

  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, assignedOrganisationId: { in: orgIds } },
    include: { participant: { select: { name: true } } },
  });
  if (!booking) notFound();

  const timeline = await listBookingTimeline(bookingId, false);

  return (
    <div className="space-y-6">
      <Link href="/provider/bookings" className="text-sm text-primary hover:underline">
        ← Bookings
      </Link>
      <h1 className="font-heading text-2xl font-bold capitalize">
        {booking.bookingType.replace("_", " + ")} booking
      </h1>
      <p className="text-sm">Participant: {booking.participant.name}</p>
      <BookingStatusPanel status={booking.status} />
      <ProviderBookingResponsePanel
        bookingId={booking.id}
        currentStatus={booking.providerResponseStatus}
      />
      <section>
        <h2 className="font-semibold">Timeline</h2>
        <BookingEventTimeline events={timeline} />
      </section>
    </div>
  );
}
