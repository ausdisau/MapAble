import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function TenantsAdminPage() {
  await requireAdmin();
  const tenants = await prisma.tenant.findMany({
    include: { _count: { select: { memberships: true } } },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Tenants</h1>
      <p className="text-muted-foreground">
        Partner organisations are isolated by tenant membership.
      </p>
      <ul className="space-y-2">
        {tenants.map((t) => (
          <li key={t.id} className="rounded border p-3">
            {t.name} ({t.slug}) — {t._count.memberships} members
          </li>
        ))}
      </ul>
    </div>
  );
}
