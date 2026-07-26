import { ProviderTransportActions } from "@/components/transport/ProviderTransportActions";
import { StatusTextBadge } from "@/components/phase3/StatusTextBadge";
import { VehicleSuitabilityWarning } from "@/components/phase3/VehicleSuitabilityWarning";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { getVehicleSuitabilityWarnings } from "@/lib/transport/vehicle-suitability";

export default async function ProviderTransportDetailPage({
  params,
}: {
  params: Promise<{ transportBookingId: string }>;
}) {
  await requireAuth();
  const { transportBookingId } = await params;
  const booking = await prisma.transportBooking.findUnique({
    where: { id: transportBookingId },
    include: { vehicle: true, driverProfile: true },
  });
  if (!booking) return <p>Not found</p>;
  const reqs = (booking.vehicleRequirements ?? {}) as Record<string, boolean>;
  const warnings = getVehicleSuitabilityWarnings(
    { requiresWheelchairAccessible: reqs.requiresWheelchairAccessible },
    booking.vehicle
  );

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">Transport trip</h1>
      <StatusTextBadge status={booking.status} />
      <p>{booking.pickupAddress} → {booking.dropoffAddress}</p>
      <VehicleSuitabilityWarning warnings={warnings} />
      <ProviderTransportActions transportBookingId={booking.id} />
    </div>
  );
}
