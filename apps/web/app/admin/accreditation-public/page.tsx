import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function AccreditationPublicAdminPage() {
  await requireAdmin();
  const profiles = await prisma.publicAccreditationProfile.findMany({
    orderBy: { publishedAt: "desc" },
    take: 30,
  });

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Public accreditation program</h1>
      <p className="text-muted-foreground">
        Draft and published profiles. Publishing requires explicit approval.
      </p>
      <ul className="space-y-2">
        {profiles.map((p) => (
          <li key={p.id} className="rounded-lg border p-3">
            <strong>{p.title}</strong>
            <span className="ml-2 text-sm">({p.status})</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
