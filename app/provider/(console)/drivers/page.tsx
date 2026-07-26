import Link from "next/link";

import { getUserOrganisationIds } from "@/lib/api/organisation-scope";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function ProviderDriversPage() {
  const user = await requireAuth();
  const orgIds = await getUserOrganisationIds(user.id);
  const drivers = await prisma.driverProfile.findMany({
    where: { organisationId: { in: orgIds } },
  });
  return (
    <div className="space-y-4">
      <header className="flex justify-between">
        <h1 className="font-heading text-2xl font-bold">Drivers</h1>
        <Link href="/provider/drivers/new" className="text-primary underline">Add driver</Link>
      </header>
      <ul>
        {drivers.map((d) => (
          <li key={d.id}>
            <Link href={`/provider/drivers/${d.id}`}>{d.displayName}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
