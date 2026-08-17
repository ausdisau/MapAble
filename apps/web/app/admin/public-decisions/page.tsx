import { PublishDecisionForm } from "@/app/admin/public-decisions/PublishDecisionForm";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function PublicDecisionsAdminPage() {
  await requireAdmin();
  const records = await prisma.publicDecisionRecord.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Public decision register</h1>
      <PublishDecisionForm />
      <ul className="space-y-2">
        {records.map((r) => (
          <li key={r.id} className="rounded border p-3">
            {r.title} ({r.status})
            {r.impactedSystems.length > 0 ? (
              <p className="text-xs text-muted-foreground">
                Systems: {r.impactedSystems.join(", ")}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
