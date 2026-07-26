import { requireAdmin } from "@/lib/auth/guards";
import { getAcademyCatalog } from "@/lib/provider/academy/academy-service";

export default async function ProviderAcademyAdminPage() {
  await requireAdmin();
  const catalog = await getAcademyCatalog();
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Provider academy</h1>
      <ul className="space-y-2">
        {catalog.map((c) => (
          <li key={c.id} className="rounded border p-3">
            {c.code} — {c.title} ({c._count.enrollments} enrolled)
          </li>
        ))}
      </ul>
    </div>
  );
}
