import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function AdminVehicleDetailPage({
  params,
}: {
  params: Promise<{ vehicleId: string }>;
}) {
  await requireAdmin();
  const { vehicleId } = await params;
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle) return <p>Not found</p>;
  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">{vehicle.displayName}</h1>
      <p>Verification status: {vehicle.verificationStatus}</p>
    </div>
  );
}
