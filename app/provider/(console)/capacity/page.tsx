import { getUserOrganisationIds } from "@/lib/api/organisation-scope";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function ProviderCapacityPage() {
  const user = await requireAuth();
  const orgIds = await getUserOrganisationIds(user.id);
  const blocks = await prisma.capacityBlock.findMany({
    where: { organisationId: { in: orgIds } },
    orderBy: { date: "asc" },
  });

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">Capacity</h1>
      <p className="text-sm text-muted-foreground">
        Simple capacity tracking for warnings — not AI scheduling.
      </p>
      <ul>
        {blocks.map((b) => (
          <li key={b.id} className="rounded-lg border p-3">
            {b.serviceType}: {b.bookedCapacity}/{b.totalCapacity} on{" "}
            {b.date.toLocaleDateString("en-AU")}
          </li>
        ))}
      </ul>
    </div>
  );
}
