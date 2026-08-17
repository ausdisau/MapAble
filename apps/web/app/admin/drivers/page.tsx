import Link from "next/link";

import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function AdminDriversPage() {
  await requireAdmin();
  const drivers = await prisma.driverProfile.findMany({ take: 50 });
  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">Drivers</h1>
      <ul>
        {drivers.map((d) => (
          <li key={d.id}>
            <Link href={`/admin/drivers/${d.id}`}>{d.displayName}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
