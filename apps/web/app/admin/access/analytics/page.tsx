import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function AdminAccessAnalyticsPage() {
  await requireAdmin();

  const byCategory = await prisma.accessPlace.groupBy({
    by: ["category"],
    _count: true,
    where: { status: "published" },
  });

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Access analytics</h1>
      <p className="text-sm text-muted-foreground">
        Aggregates only — no private reviewer identities.
      </p>
      <section>
        <h2 className="font-semibold">Published places by category</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {byCategory.map((row) => (
            <li key={row.category}>
              {row.category}: {row._count}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
