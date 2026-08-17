import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function AdminProviderCapacityPage() {
  await requireAdmin();
  const blocks = await prisma.capacityBlock.findMany({
    include: { organisation: { select: { name: true } } },
    take: 50,
  });
  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">Provider capacity</h1>
      <ul>
        {blocks.map((b) => (
          <li key={b.id}>
            {b.organisation.name} — {b.serviceType}: {b.bookedCapacity}/{b.totalCapacity}
          </li>
        ))}
      </ul>
    </div>
  );
}
