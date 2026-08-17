import Link from "next/link";

import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function AdminVehiclesPage() {
  await requireAdmin();
  const vehicles = await prisma.vehicle.findMany({ take: 50 });
  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">Vehicles</h1>
      <ul>
        {vehicles.map((v) => (
          <li key={v.id}>
            <Link href={`/admin/vehicles/${v.id}`}>{v.displayName}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
