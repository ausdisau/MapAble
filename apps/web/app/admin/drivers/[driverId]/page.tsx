import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function AdminDriverDetailPage({
  params,
}: {
  params: Promise<{ driverId: string }>;
}) {
  await requireAdmin();
  const { driverId } = await params;
  const driver = await prisma.driverProfile.findUnique({ where: { id: driverId } });
  if (!driver) return <p>Not found</p>;
  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">{driver.displayName}</h1>
      <p>Verification: {driver.verificationStatus}</p>
    </div>
  );
}
