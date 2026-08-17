import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function PublicTransparencyAdminPage() {
  await requireAdmin();
  const publications = await prisma.transparencyPublication.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Public transparency</h1>
      <p className="text-muted-foreground">
        Draft publications require approval before appearing on /transparency.
      </p>
      <ul className="space-y-2">
        {publications.map((p) => (
          <li key={p.id} className="rounded-lg border p-3">
            <strong>{p.title}</strong>
            <span className="ml-2 text-sm">({p.status})</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
