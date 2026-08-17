import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function PlanManagerPilotPage() {
  await requireAdmin();
  const partners = await prisma.planManagerPilotPartner.findMany({
    include: { exports: { orderBy: { createdAt: "desc" }, take: 5 } },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Plan manager pilot</h1>
      <p className="text-muted-foreground">
        Partner exports for invoice review — no production billing integration.
      </p>
      <ul className="space-y-4">
        {partners.map((p) => (
          <li key={p.id} className="rounded-lg border p-4">
            <strong>{p.name}</strong>
            <span className="ml-2 text-sm">
              {p.active ? "active" : "inactive"} — {p.exportFormat}
            </span>
            <ul className="mt-2 text-sm">
              {p.exports.map((e) => (
                <li key={e.id}>
                  {e.fileName ?? e.id.slice(0, 8)} — {e.status}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
