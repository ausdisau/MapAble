import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function AdminTransportDetailPage({
  params,
}: {
  params: Promise<{ transportBookingId: string }>;
}) {
  await requireAdmin();
  const { transportBookingId } = await params;
  const booking = await prisma.transportBooking.findUnique({
    where: { id: transportBookingId },
    include: { participant: { select: { name: true } }, vehicle: true },
  });
  if (!booking) return <p>Not found</p>;
  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">Transport booking</h1>
      <p>{booking.participant.name}</p>
      <p>{booking.pickupAddress} → {booking.dropoffAddress}</p>
      <p>Status: {booking.status}</p>
    </div>
  );
}
