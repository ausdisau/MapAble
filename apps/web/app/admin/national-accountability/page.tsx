import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function NationalAccountabilityAdminPage() {
  await requireAdmin();
  const reports = await prisma.nationalAccountabilityPublication.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">National accountability</h1>
      <ul className="space-y-2">
        {reports.map((r) => (
          <li key={r.id} className="rounded border p-3">
            {r.title} ({r.status})
          </li>
        ))}
      </ul>
    </div>
  );
}
