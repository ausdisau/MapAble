import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ vehicleId: string }>;
}) {
  await requireAuth();
  const { vehicleId } = await params;
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle) return <p>Not found</p>;
  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">{vehicle.displayName}</h1>
      <p>Wheelchair accessible: {vehicle.wheelchairAccessible ? "Yes" : "No"}</p>
      <p>Verification: {vehicle.verificationStatus}</p>
    </div>
  );
}
