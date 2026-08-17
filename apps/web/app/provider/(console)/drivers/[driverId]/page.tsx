import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function DriverDetailPage({
  params,
}: {
  params: Promise<{ driverId: string }>;
}) {
  await requireAuth();
  const { driverId } = await params;
  const driver = await prisma.driverProfile.findUnique({ where: { id: driverId } });
  if (!driver) return <p>Not found</p>;
  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">{driver.displayName}</h1>
      <p>Licence status: {driver.licenceStatus}</p>
    </div>
  );
}
