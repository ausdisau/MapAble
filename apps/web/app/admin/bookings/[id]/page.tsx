import Link from "next/link";
import { notFound } from "next/navigation";

import { BookingAdminPanel } from "@/components/admin/BookingAdminPanel";
import {
  BookingTimeline,
  BookingStatusPanel,
} from "@/components/bookings/BookingTimeline";
import { prisma } from "@/lib/prisma";

export default async function AdminBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      segments: { orderBy: { sortOrder: "asc" } },
      participant: true,
    },
  });
  if (!booking) notFound();

  const organisations = await prisma.organisation.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <Link href="/admin/bookings" className="text-sm text-primary hover:underline">
        ← Bookings
      </Link>
      <h1 className="font-heading text-2xl font-bold capitalize">
        {booking.bookingType.replace("_", " + ")} booking
      </h1>
      <BookingStatusPanel status={booking.status} />
      <p className="text-sm">
        Participant: {booking.participant.name} ({booking.participant.email})
      </p>
      <BookingTimeline
        segments={booking.segments}
        bookingType={booking.bookingType}
      />
      <BookingAdminPanel
        bookingId={booking.id}
        currentStatus={booking.status}
        organisations={organisations}
      />
    </div>
  );
}
